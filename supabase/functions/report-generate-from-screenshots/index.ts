import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  withMiddleware,
  AuthContext,
  requireIfoodAccountAccess,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, ExternalServiceError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import {
  chatCompletionWithUsage,
  logApiUsage,
  estimateCost,
  type TokenUsage,
} from "../_shared/openai.ts";
import { createLogger } from "../_shared/logger.ts";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const log = createLogger("report-generate-from-screenshots");

const OPENAI_API_URL = "https://api.openai.com/v1";
const EDGE_FUNCTION_NAME = "report-generate-from-screenshots";

// ============================================
// Types
// ============================================

interface ExtractedData {
  financial: {
    total_orders: number | null;
    revenue: number | null;
    avg_ticket: number | null;
    new_customers: number | null;
    revenue_change_pct: number | null;
    orders_change_pct: number | null;
  };
  funnel: {
    visits: number | null;
    views: number | null;
    to_cart: number | null;
    checkout: number | null;
    completed: number | null;
    visits_change_pct: number | null;
    conversion_rate: number | null;
  };
  operations: {
    peak_hours: string | null;
    best_day: string | null;
    cancellation_rate: number | null;
    open_time: string | null;
    avg_delivery_time: string | null;
  };
  marketing: {
    promo_orders: number | null;
    store_investment: number | null;
    ifood_investment: number | null;
    roas: number | null;
    campaign_names: string[];
  };
  menu: {
    top_items: Array<{ name: string; quantity: number }>;
    least_sold_items: Array<{ name: string; quantity: number }>;
  };
  customers: {
    by_radius: Record<string, number>;
    profile: {
      new: number | null;
      frequent: number | null;
      alert: number | null;
      lost: number | null;
      recovered: number | null;
    };
  };
  competition: {
    direct_competitors: Record<string, number>;
    avg_ticket_comparison: {
      store: number | null;
      market: number | null;
    };
  };
}

type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail: "high" };
};

interface BackgroundParams {
  adminClient: SupabaseClient;
  userId: string;
  reportId: string;
  screenshotPaths: string[];
  accountName: string;
  weekStart: string;
  weekEnd: string;
  restaurantId: string | null;
  ifoodAccountId: string | null;
  clientIp: string | undefined;
}

// ============================================
// Handler (synchronous — returns immediately)
// ============================================

/**
 * POST /report-generate-from-screenshots
 *
 * Creates a report record with "generating" status and schedules
 * background processing via EdgeRuntime.waitUntil.
 *
 * Body: {
 *   screenshot_paths: string[],
 *   ifood_account_id?: string,
 *   restaurant_id?: string,
 *   week_start?: string,
 *   week_end?: string
 * }
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    await checkIdempotency(adminClient, req);

    const body = await req.json();
    const {
      screenshot_paths,
      ifood_account_id,
      restaurant_id,
      week_start,
      week_end,
    } = body;

    // Validate input
    if (!screenshot_paths || !Array.isArray(screenshot_paths) || screenshot_paths.length === 0) {
      throw new ValidationError("screenshot_paths is required (non-empty array)");
    }

    if (screenshot_paths.length > 12) {
      throw new ValidationError("Maximum 12 screenshots allowed");
    }

    // Validate access to iFood account if provided
    if (ifood_account_id) {
      await requireIfoodAccountAccess(adminClient, userId, ifood_account_id);
    }

    // Determine week dates (default to previous week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const defaultMonday = new Date(now);
    defaultMonday.setDate(now.getDate() - diffToMonday - 7);
    const defaultSunday = new Date(defaultMonday);
    defaultSunday.setDate(defaultMonday.getDate() + 6);

    const effectiveWeekStart = week_start || defaultMonday.toISOString().split("T")[0];
    const effectiveWeekEnd = week_end || defaultSunday.toISOString().split("T")[0];

    // Fetch iFood account name if provided
    let accountName = "Conta Manual";
    if (ifood_account_id) {
      const { data: account } = await adminClient
        .from("ifood_accounts")
        .select("name")
        .eq("id", ifood_account_id)
        .maybeSingle();
      if (account?.name) accountName = account.name;
    }

    // Create report record with "generating" status — returns immediately
    const { data: report, error: reportError } = await adminClient
      .from("reports")
      .insert({
        restaurant_id: restaurant_id || null,
        ifood_account_id: ifood_account_id || null,
        week_start: effectiveWeekStart,
        week_end: effectiveWeekEnd,
        status: "generating",
        source: "screenshots",
        generated_at: new Date().toISOString(),
      })
      .select("id, restaurant_id, ifood_account_id, week_start, week_end, status, source, generated_at")
      .single();

    if (reportError || !report) {
      throw new Error(`Failed to create report: ${reportError?.message}`);
    }

    // Link screenshots to report with "processing" status
    for (const path of screenshot_paths) {
      await adminClient
        .from("report_screenshots")
        .update({ report_id: report.id, processing_status: "processing" })
        .eq("storage_path", path);
    }

    log.info("Report created with generating status, scheduling background processing", {
      reportId: report.id,
      screenshotCount: screenshot_paths.length,
    });

    // Schedule background processing
    EdgeRuntime.waitUntil(
      processReportInBackground({
        adminClient,
        userId,
        reportId: report.id,
        screenshotPaths: screenshot_paths,
        accountName,
        weekStart: effectiveWeekStart,
        weekEnd: effectiveWeekEnd,
        restaurantId: restaurant_id || null,
        ifoodAccountId: ifood_account_id || null,
        clientIp: getClientIp(req),
      }),
    );

    // Return immediately
    return jsonResponse({
      success: true,
      report: { ...report },
    }, 201);
  },
  { permission: ["reports", "create"] },
);

// ============================================
// Background Processing
// ============================================

async function processReportInBackground(params: BackgroundParams): Promise<void> {
  const {
    adminClient,
    userId,
    reportId,
    screenshotPaths,
    accountName,
    weekStart,
    weekEnd,
    restaurantId,
    ifoodAccountId,
    clientIp,
  } = params;

  try {
    // 1. Download screenshots from storage
    log.info("Downloading screenshots", { reportId, count: screenshotPaths.length });
    const imageContents = await downloadScreenshots(adminClient, screenshotPaths);

    if (imageContents.length === 0) {
      throw new Error("No valid screenshots could be downloaded");
    }

    // 2. Extract data with GPT-4o Vision
    log.info("Extracting data with Vision API", { reportId, imageCount: imageContents.length });
    const { data: extractedData, usage: visionUsage } =
      await extractDataFromScreenshots(imageContents);

    // Log Vision API usage
    if (visionUsage) {
      await logApiUsage(adminClient, {
        userId,
        edgeFunction: EDGE_FUNCTION_NAME,
        model: "gpt-4o",
        promptTokens: visionUsage.prompt_tokens,
        completionTokens: visionUsage.completion_tokens,
        totalTokens: visionUsage.total_tokens,
        estimatedCost: estimateCost("gpt-4o", visionUsage.prompt_tokens, visionUsage.completion_tokens),
        metadata: { step: "vision_extraction", report_id: reportId, screenshot_count: screenshotPaths.length },
      });
    }

    // 3. Generate report HTML
    log.info("Generating report HTML", { reportId });
    const reportHtml = buildScreenshotReportHtml(accountName, weekStart, weekEnd, extractedData);

    // 4. Upload HTML to storage
    const fileId = crypto.randomUUID();
    const pdfFileName = `screenshots/${fileId}/${weekStart}-report.html`;
    const htmlBlob = new Blob([reportHtml], { type: "text/html" });

    const { error: uploadError } = await adminClient.storage
      .from("reports")
      .upload(pdfFileName, htmlBlob, { contentType: "text/html", upsert: true });

    let pdfUrl: string | null = null;
    if (!uploadError) {
      const { data: urlData } = adminClient.storage
        .from("reports")
        .getPublicUrl(pdfFileName);
      pdfUrl = urlData?.publicUrl ?? null;
    } else {
      log.error("Failed to upload report HTML", { error: uploadError.message });
    }

    // 5. Generate AI actions
    log.info("Generating AI actions", { reportId });
    const { actions, usage: actionsUsage } = await generateScreenshotActions(
      adminClient, userId, reportId, restaurantId, weekStart, extractedData,
    );

    // Log actions API usage
    if (actionsUsage) {
      await logApiUsage(adminClient, {
        userId,
        edgeFunction: EDGE_FUNCTION_NAME,
        model: "gpt-4o",
        promptTokens: actionsUsage.prompt_tokens,
        completionTokens: actionsUsage.completion_tokens,
        totalTokens: actionsUsage.total_tokens,
        estimatedCost: estimateCost("gpt-4o", actionsUsage.prompt_tokens, actionsUsage.completion_tokens),
        metadata: { step: "action_generation", report_id: reportId },
      });
    }

    // 6. Generate checklist
    await generateScreenshotChecklist(adminClient, reportId, restaurantId, weekStart, extractedData);

    // 7. Update screenshots to completed
    for (const path of screenshotPaths) {
      await adminClient
        .from("report_screenshots")
        .update({ processing_status: "completed" })
        .eq("storage_path", path);
    }

    // 8. Update report to "generated" — triggers Realtime subscription
    await adminClient
      .from("reports")
      .update({ status: "generated", pdf_url: pdfUrl })
      .eq("id", reportId);

    log.info("Report generation completed", { reportId, actionsCount: actions.length });

    // 9. Audit log
    await logAudit(adminClient, {
      userId,
      action: "generate_report_from_screenshots",
      entity: "reports",
      entityId: reportId,
      newData: {
        screenshot_count: screenshotPaths.length,
        ifood_account_id: ifoodAccountId,
        week_start: weekStart,
        week_end: weekEnd,
        actions_count: actions.length,
      },
      ipAddress: clientIp,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Background processing failed", { reportId, error: errorMessage });

    // Update report status to "failed" — triggers Realtime subscription
    await adminClient
      .from("reports")
      .update({ status: "failed" })
      .eq("id", reportId);

    // Update screenshots to failed
    for (const path of screenshotPaths) {
      await adminClient
        .from("report_screenshots")
        .update({ processing_status: "failed" })
        .eq("storage_path", path);
    }
  }
}

// ============================================
// Screenshot Download
// ============================================

async function downloadScreenshots(
  adminClient: SupabaseClient,
  paths: string[],
): Promise<ImageContent[]> {
  const imageContents: ImageContent[] = [];

  for (const path of paths) {
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("report-screenshots")
      .download(path);

    if (downloadError || !fileData) {
      log.warn("Failed to download screenshot", { path, error: downloadError?.message });
      continue;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binaryStr = "";
    for (let i = 0; i < uint8.length; i++) {
      binaryStr += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binaryStr);
    const mimeType = fileData.type || "image/png";

    imageContents.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64}`,
        detail: "high",
      },
    });
  }

  return imageContents;
}

// ============================================
// Vision Data Extraction
// ============================================

async function extractDataFromScreenshots(
  imageContents: ImageContent[],
): Promise<{ data: ExtractedData; usage: TokenUsage | null }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new ExternalServiceError("OpenAI", "OPENAI_API_KEY not configured");
  }

  const systemPrompt = `You are a data extraction specialist for iFood restaurant performance dashboards.
You will receive multiple screenshots from the iFood partner dashboard (Gestor de Pedidos / Portal do Parceiro).
Extract ALL visible metrics and data into the specified JSON structure.

IMPORTANT RULES:
- Extract exact numbers as shown in the screenshots
- For monetary values, parse Brazilian format (R$ 1.234,56 → 1234.56)
- For percentages, convert to decimal (4,61% → 4.61)
- If a metric is not visible in any screenshot, use null
- For arrays (like menu items), extract as many as visible
- Week-over-week changes should be extracted as percentage points

Respond ONLY with valid JSON matching this exact structure:
{
  "financial": {
    "total_orders": number|null,
    "revenue": number|null,
    "avg_ticket": number|null,
    "new_customers": number|null,
    "revenue_change_pct": number|null,
    "orders_change_pct": number|null
  },
  "funnel": {
    "visits": number|null,
    "views": number|null,
    "to_cart": number|null,
    "checkout": number|null,
    "completed": number|null,
    "visits_change_pct": number|null,
    "conversion_rate": number|null
  },
  "operations": {
    "peak_hours": string|null,
    "best_day": string|null,
    "cancellation_rate": number|null,
    "open_time": string|null,
    "avg_delivery_time": string|null
  },
  "marketing": {
    "promo_orders": number|null,
    "store_investment": number|null,
    "ifood_investment": number|null,
    "roas": number|null,
    "campaign_names": string[]
  },
  "menu": {
    "top_items": [{"name": string, "quantity": number}],
    "least_sold_items": [{"name": string, "quantity": number}]
  },
  "customers": {
    "by_radius": {"0-1km": number, "1-3km": number, ...},
    "profile": {
      "new": number|null,
      "frequent": number|null,
      "alert": number|null,
      "lost": number|null,
      "recovered": number|null
    }
  },
  "competition": {
    "direct_competitors": {"Category": percentage, ...},
    "avg_ticket_comparison": {
      "store": number|null,
      "market": number|null
    }
  }
}`;

  const userContent: Array<
    | { type: "text"; text: string }
    | ImageContent
  > = [
    {
      type: "text",
      text: "Extract all performance metrics from these iFood dashboard screenshots. Return ONLY valid JSON.",
    },
    ...imageContents,
  ];

  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ExternalServiceError(
      "OpenAI Vision",
      `Vision extraction failed (${response.status}): ${errorText}`,
    );
  }

  const responseData = await response.json();
  const content = responseData.choices?.[0]?.message?.content ?? "";
  const usage: TokenUsage | null = responseData.usage
    ? {
        prompt_tokens: responseData.usage.prompt_tokens ?? 0,
        completion_tokens: responseData.usage.completion_tokens ?? 0,
        total_tokens: responseData.usage.total_tokens ?? 0,
      }
    : null;

  // Parse JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    log.error("Failed to parse AI extraction response", { content });
    throw new ExternalServiceError(
      "OpenAI Vision",
      "Failed to extract structured data from screenshots",
    );
  }

  try {
    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedData;
    return { data: extractedData, usage };
  } catch {
    log.error("JSON parse error on extracted data", { raw: jsonMatch[0] });
    throw new ExternalServiceError(
      "OpenAI Vision",
      "Invalid JSON in extraction response",
    );
  }
}

// ============================================
// Report HTML Generation
// ============================================

function buildScreenshotReportHtml(
  accountName: string,
  weekStart: string,
  weekEnd: string,
  data: ExtractedData,
): string {
  const fmt = (n: number | null | undefined): string =>
    n !== null && n !== undefined ? n.toLocaleString("pt-BR") : "—";

  const fmtMoney = (n: number | null | undefined): string =>
    n !== null && n !== undefined
      ? `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  const fmtPct = (n: number | null | undefined): string =>
    n !== null && n !== undefined ? `${n.toFixed(1)}%` : "—";

  const changeIndicator = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const arrow = value > 0 ? "+" : "";
    const color = value >= 0 ? "#22c55e" : "#ef4444";
    return `<span style="color: ${color}; font-size: 12px;">${arrow}${value.toFixed(1)}%</span>`;
  };

  const topItemsHtml = (data.menu.top_items ?? [])
    .map((item) => `<div class="menu-item"><span>${item.name}</span><span class="quantity">${item.quantity} vendas</span></div>`)
    .join("");

  const leastSoldHtml = (data.menu.least_sold_items ?? [])
    .map((item) => `<div class="menu-item"><span>${item.name}</span><span class="quantity">${item.quantity} vendas</span></div>`)
    .join("");

  const customerProfileHtml = Object.entries(data.customers.profile ?? {})
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `<div class="metric-card"><div class="value">${fmt(v)}</div><div class="label">${translateProfileKey(k)}</div></div>`)
    .join("");

  const competitorHtml = Object.entries(data.competition.direct_competitors ?? {})
    .map(([k, v]) => `<div class="financial-row"><span class="label">${k}</span><span class="value">${fmtPct(v)}</span></div>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatorio Semanal - ${accountName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a2e; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
    .header h1 { font-size: 28px; color: #1a1a2e; }
    .header p { color: #666; margin-top: 4px; }
    .header .badge { display: inline-block; background: #8b5cf6; color: white; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-top: 8px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; margin-bottom: 16px; color: #1a1a2e; border-left: 4px solid #e94560; padding-left: 12px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .metric-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-card .value { font-size: 28px; font-weight: bold; color: #1a1a2e; }
    .metric-card .label { font-size: 13px; color: #666; margin-top: 4px; }
    .funnel { margin-top: 16px; }
    .funnel-step { display: flex; align-items: center; margin-bottom: 8px; }
    .funnel-bar { height: 32px; background: linear-gradient(90deg, #1a1a2e, #e94560); border-radius: 4px; margin-right: 12px; display: flex; align-items: center; padding-left: 12px; color: white; font-weight: bold; font-size: 14px; }
    .funnel-label { font-size: 13px; color: #666; min-width: 120px; }
    .financial-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .financial-row .label { color: #666; }
    .financial-row .value { font-weight: bold; }
    .menu-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .menu-item .quantity { color: #666; font-weight: 500; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>GTBI - Relatorio Semanal</h1>
      <p>${accountName}</p>
      <p>${weekStart} a ${weekEnd}</p>
      <span class="badge">Via Capturas de Tela</span>
    </div>

    <div class="section">
      <h2>Resumo Financeiro</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="value">${fmt(data.financial.total_orders)}</div>
          <div class="label">Pedidos ${changeIndicator(data.financial.orders_change_pct)}</div>
        </div>
        <div class="metric-card">
          <div class="value">${fmtMoney(data.financial.revenue)}</div>
          <div class="label">Receita ${changeIndicator(data.financial.revenue_change_pct)}</div>
        </div>
        <div class="metric-card">
          <div class="value">${fmtMoney(data.financial.avg_ticket)}</div>
          <div class="label">Ticket Medio</div>
        </div>
        <div class="metric-card">
          <div class="value">${fmt(data.financial.new_customers)}</div>
          <div class="label">Novos Clientes</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Funil de Conversao</h2>
      <div class="funnel">
        ${buildFunnelStep("Visitas", data.funnel.visits, 100, data.funnel.visits_change_pct)}
        ${buildFunnelStep("Visualizacoes", data.funnel.views, data.funnel.visits ? ((data.funnel.views ?? 0) / data.funnel.visits) * 100 : 0, null)}
        ${buildFunnelStep("Carrinho", data.funnel.to_cart, data.funnel.visits ? ((data.funnel.to_cart ?? 0) / data.funnel.visits) * 100 : 0, null)}
        ${buildFunnelStep("Checkout", data.funnel.checkout, data.funnel.visits ? ((data.funnel.checkout ?? 0) / data.funnel.visits) * 100 : 0, null)}
        ${buildFunnelStep("Concluidos", data.funnel.completed, data.funnel.visits ? ((data.funnel.completed ?? 0) / data.funnel.visits) * 100 : 0, null)}
      </div>
      ${data.funnel.conversion_rate !== null ? `<p style="margin-top: 12px; font-size: 14px; color: #666;">Taxa de conversao geral: <strong>${fmtPct(data.funnel.conversion_rate)}</strong></p>` : ""}
    </div>

    <div class="section">
      <h2>Metricas Operacionais</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="value">${fmtPct(data.operations.cancellation_rate)}</div>
          <div class="label">Taxa de Cancelamento</div>
        </div>
        <div class="metric-card">
          <div class="value">${data.operations.peak_hours ?? "—"}</div>
          <div class="label">Horario de Pico</div>
        </div>
        <div class="metric-card">
          <div class="value">${data.operations.best_day ?? "—"}</div>
          <div class="label">Melhor Dia</div>
        </div>
        <div class="metric-card">
          <div class="value">${data.operations.open_time ?? "—"}</div>
          <div class="label">Tempo Aberto</div>
        </div>
        ${data.operations.avg_delivery_time ? `<div class="metric-card"><div class="value">${data.operations.avg_delivery_time}</div><div class="label">Tempo Medio Entrega</div></div>` : ""}
      </div>
    </div>

    <div class="section">
      <h2>Marketing e Promocoes</h2>
      <div class="financial-row"><span class="label">Pedidos com promocao</span><span class="value">${fmt(data.marketing.promo_orders)}</span></div>
      <div class="financial-row"><span class="label">Investimento loja</span><span class="value">${fmtMoney(data.marketing.store_investment)}</span></div>
      <div class="financial-row"><span class="label">Investimento iFood</span><span class="value">${fmtMoney(data.marketing.ifood_investment)}</span></div>
      <div class="financial-row"><span class="label">ROAS</span><span class="value">${data.marketing.roas !== null ? `R$ ${data.marketing.roas?.toFixed(2)}` : "—"}</span></div>
      ${data.marketing.campaign_names.length > 0 ? `<p style="margin-top: 8px; font-size: 13px; color: #666;">Campanhas: ${data.marketing.campaign_names.join(", ")}</p>` : ""}
    </div>

    <div class="section">
      <h2>Cardapio</h2>
      <div class="two-col">
        <div>
          <h3 style="font-size: 16px; margin-bottom: 8px;">Mais Vendidos</h3>
          ${topItemsHtml || '<p style="color: #999; font-size: 13px;">Dados nao disponiveis</p>'}
        </div>
        <div>
          <h3 style="font-size: 16px; margin-bottom: 8px;">Menos Vendidos</h3>
          ${leastSoldHtml || '<p style="color: #999; font-size: 13px;">Dados nao disponiveis</p>'}
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Perfil de Clientes</h2>
      <div class="metrics-grid">
        ${customerProfileHtml}
      </div>
    </div>

    ${competitorHtml ? `
    <div class="section">
      <h2>Concorrencia</h2>
      ${competitorHtml}
      ${data.competition.avg_ticket_comparison.store !== null ? `
      <div style="margin-top: 12px;">
        <div class="financial-row"><span class="label">Ticket medio loja</span><span class="value">${fmtMoney(data.competition.avg_ticket_comparison.store)}</span></div>
        <div class="financial-row"><span class="label">Ticket medio mercado</span><span class="value">${fmtMoney(data.competition.avg_ticket_comparison.market)}</span></div>
      </div>` : ""}
    </div>` : ""}
  </div>
</body>
</html>`.trim();

  function buildFunnelStep(
    label: string,
    value: number | null,
    percentage: number,
    change: number | null,
  ): string {
    const barWidth = Math.max(percentage, 10);
    return `
      <div class="funnel-step">
        <span class="funnel-label">${label}</span>
        <div class="funnel-bar" style="width: ${barWidth}%">${value !== null ? fmt(value) : "—"}</div>
        ${change !== null ? changeIndicator(change) : ""}
      </div>`;
  }
}

function translateProfileKey(key: string): string {
  const translations: Record<string, string> = {
    new: "Novos",
    frequent: "Frequentes",
    alert: "Em Alerta",
    lost: "Perdidos",
    recovered: "Recuperados",
  };
  return translations[key] ?? key;
}

// ============================================
// AI Action Generation
// ============================================

async function generateScreenshotActions(
  adminClient: SupabaseClient,
  userId: string,
  reportId: string,
  restaurantId: string | null,
  weekStart: string,
  data: ExtractedData,
): Promise<{ actions: Array<{ id: string }>; usage: TokenUsage | null }> {
  const metricsContext = `
Current week metrics (extracted from iFood dashboard screenshots):
- Total Orders: ${data.financial.total_orders ?? "N/A"}
- Revenue: R$ ${data.financial.revenue ?? "N/A"}
- Avg Ticket: R$ ${data.financial.avg_ticket ?? "N/A"}
- New Customers: ${data.financial.new_customers ?? "N/A"}
- Funnel: Visits ${data.funnel.visits ?? "?"} → Views ${data.funnel.views ?? "?"} → Cart ${data.funnel.to_cart ?? "?"} → Checkout ${data.funnel.checkout ?? "?"} → Completed ${data.funnel.completed ?? "?"}
- Cancellation Rate: ${data.operations.cancellation_rate ?? "N/A"}%
- Peak Hours: ${data.operations.peak_hours ?? "N/A"}
- Top Items: ${(data.menu.top_items ?? []).map((i) => `${i.name} (${i.quantity})`).join(", ") || "N/A"}
- Marketing Investment: Store R$ ${data.marketing.store_investment ?? "N/A"}, iFood R$ ${data.marketing.ifood_investment ?? "N/A"}, ROAS ${data.marketing.roas ?? "N/A"}
- Customer Profile: New ${data.customers.profile.new ?? "?"}, Frequent ${data.customers.profile.frequent ?? "?"}, Alert ${data.customers.profile.alert ?? "?"}, Lost ${data.customers.profile.lost ?? "?"}, Recovered ${data.customers.profile.recovered ?? "?"}`;

  let aiActions: Array<{
    title: string;
    description: string;
    goal: string;
    action_type: string;
  }> = [];
  let usage: TokenUsage | null = null;

  try {
    const aiResult = await chatCompletionWithUsage({
      systemPrompt: `You are a restaurant business intelligence consultant for iFood restaurants in Brazil.
Analyze the metrics extracted from dashboard screenshots and suggest 3-5 concrete, actionable recommendations.
Respond ONLY with a JSON array of objects with keys: title, description, goal, action_type.
action_type must be one of: menu_adjustment, promotion, response, operational, marketing, other.
Keep responses in Portuguese (Brazil). Be specific and practical.`,
      userPrompt: metricsContext,
      temperature: 0.7,
      maxTokens: 1024,
    });

    usage = aiResult.usage;
    const jsonMatch = aiResult.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      aiActions = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    log.error("AI action generation failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    aiActions = generateFallbackActions(data);
  }

  const insertedActions: Array<{ id: string }> = [];
  const validActionTypes = [
    "menu_adjustment", "promotion", "response", "operational", "marketing", "other",
  ];

  for (const action of aiActions) {
    const actionType = validActionTypes.includes(action.action_type)
      ? action.action_type
      : "other";

    const { data: inserted, error } = await adminClient
      .from("actions")
      .insert({
        report_id: reportId,
        restaurant_id: restaurantId,
        week_start: weekStart,
        title: action.title,
        description: action.description,
        goal: action.goal,
        action_type: actionType,
        status: "planned",
        created_by: userId,
      })
      .select("id")
      .single();

    if (!error && inserted) {
      insertedActions.push({ id: inserted.id });
    }
  }

  return { actions: insertedActions, usage };
}

function generateFallbackActions(
  data: ExtractedData,
): Array<{ title: string; description: string; goal: string; action_type: string }> {
  const actions: Array<{
    title: string;
    description: string;
    goal: string;
    action_type: string;
  }> = [];

  if (data.operations.cancellation_rate !== null && data.operations.cancellation_rate > 5) {
    actions.push({
      title: "Reduzir taxa de cancelamento",
      description: `Taxa de cancelamento em ${data.operations.cancellation_rate}%. Verifique tempo de preparo, disponibilidade de itens e embalagens.`,
      goal: "Reduzir cancelamentos para menos de 3%",
      action_type: "operational",
    });
  }

  if (data.funnel.visits !== null && data.funnel.completed !== null) {
    const conversionRate = data.funnel.completed / data.funnel.visits;
    if (conversionRate < 0.15) {
      actions.push({
        title: "Melhorar conversao do funil",
        description: `Apenas ${(conversionRate * 100).toFixed(1)}% das visitas resultam em pedidos concluidos. Revise fotos, precos e descricoes do cardapio.`,
        goal: "Aumentar taxa de conversao para 20%+",
        action_type: "menu_adjustment",
      });
    }
  }

  if (data.customers.profile.lost !== null && data.customers.profile.lost > 500) {
    actions.push({
      title: "Campanha de recuperacao de clientes",
      description: `${data.customers.profile.lost} clientes perdidos identificados. Crie cupons de desconto para reengajar.`,
      goal: "Recuperar pelo menos 10% dos clientes perdidos",
      action_type: "marketing",
    });
  }

  if (data.marketing.roas !== null && data.marketing.roas < 2) {
    actions.push({
      title: "Otimizar investimento em marketing",
      description: `ROAS atual de R$ ${data.marketing.roas.toFixed(2)}. Revise campanhas ativas e desative as com baixo retorno.`,
      goal: "Atingir ROAS de pelo menos R$ 3,00",
      action_type: "promotion",
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Revisar metricas do painel iFood",
      description: "Analise detalhada das metricas extraidas para identificar oportunidades de melhoria.",
      goal: "Identificar 3 areas de melhoria prioritarias",
      action_type: "other",
    });
  }

  return actions;
}

// ============================================
// Checklist Generation
// ============================================

async function generateScreenshotChecklist(
  adminClient: SupabaseClient,
  reportId: string,
  restaurantId: string | null,
  weekStart: string,
  data: ExtractedData,
): Promise<void> {
  const items: Array<{ title: string }> = [
    { title: "Revisar metricas de funil e identificar gargalos" },
    { title: "Verificar avaliacoes pendentes de resposta" },
    { title: "Conferir disponibilidade do cardapio" },
    { title: "Analisar top 5 itens mais vendidos" },
  ];

  if (data.operations.cancellation_rate !== null && data.operations.cancellation_rate > 3) {
    items.push({ title: "Investigar motivos de cancelamento" });
  }

  if (data.customers.profile.lost !== null && data.customers.profile.lost > 500) {
    items.push({ title: "Planejar campanha de recuperacao de clientes" });
  }

  if (data.marketing.roas !== null && data.marketing.roas < 2.5) {
    items.push({ title: "Revisar campanhas de marketing ativas" });
  }

  for (const item of items) {
    await adminClient.from("checklists").insert({
      report_id: reportId,
      restaurant_id: restaurantId,
      week_start: weekStart,
      title: item.title,
      is_checked: false,
    });
  }
}

serve(handler);
