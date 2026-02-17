import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  withMiddleware,
  AuthContext,
  requirePermission,
  requireRestaurantAccess,
  checkIdempotency,
} from "../_shared/middleware.ts";
import { jsonResponse, ValidationError, NotFoundError } from "../_shared/errors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";
import { chatCompletion } from "../_shared/openai.ts";

interface SnapshotData {
  id: string;
  week_start: string;
  week_end: string;
  visits: number;
  views: number;
  to_cart: number;
  checkout: number;
  completed: number;
  cancellation_rate: number;
  open_time_rate: number;
  open_tickets_rate: number;
  new_customers_rate: number;
}

/**
 * POST /report-generate
 *
 * Generates a weekly BI report for a restaurant. Compares last 2 snapshots,
 * creates report HTML/PDF, generates recommended actions, and stores everything.
 *
 * Body: { restaurant_id: string, week_start: string, week_end: string }
 * Requires: user_can(userId, 'reports', 'create') + restaurant access
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Permission check
    await requirePermission(adminClient, userId, "reports", "create");

    // Idempotency check
    await checkIdempotency(adminClient, req);

    // Parse and validate input
    const body = await req.json();
    const { restaurant_id, week_start, week_end } = body;

    if (!restaurant_id || typeof restaurant_id !== "string") {
      throw new ValidationError("restaurant_id is required");
    }

    if (!week_start || typeof week_start !== "string") {
      throw new ValidationError("week_start is required (YYYY-MM-DD)");
    }

    if (!week_end || typeof week_end !== "string") {
      throw new ValidationError("week_end is required (YYYY-MM-DD)");
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, restaurant_id);

    // Get restaurant info
    const { data: restaurant, error: restError } = await adminClient
      .from("restaurants")
      .select("id, name")
      .eq("id", restaurant_id)
      .maybeSingle();

    if (restError || !restaurant) {
      throw new NotFoundError("Restaurant", restaurant_id);
    }

    // Fetch the latest 2 snapshots for comparison
    const { data: snapshots, error: snapError } = await adminClient
      .from("restaurant_snapshots")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .order("week_start", { ascending: false })
      .limit(2);

    if (snapError) {
      throw new Error(`Failed to fetch snapshots: ${snapError.message}`);
    }

    const currentSnapshot: SnapshotData | undefined = snapshots?.[0];
    const previousSnapshot: SnapshotData | undefined = snapshots?.[1];

    if (!currentSnapshot) {
      throw new ValidationError(
        "No performance data available. Run data collection first.",
      );
    }

    // Fetch recent reviews summary
    const { data: reviews } = await adminClient
      .from("reviews")
      .select("rating")
      .eq("restaurant_id", restaurant_id)
      .gte("review_date", week_start)
      .lte("review_date", week_end);

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
      : 0;

    // Fetch financial summary
    const { data: financials } = await adminClient
      .from("financial_entries")
      .select("entry_type, amount")
      .eq("restaurant_id", restaurant_id)
      .gte("reference_date", week_start)
      .lte("reference_date", week_end);

    const totalRevenue = financials
      ?.filter((f) => f.entry_type === "revenue")
      .reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;

    const totalFees = financials
      ?.filter((f) => f.entry_type !== "revenue")
      .reduce((sum, f) => sum + Math.abs(Number(f.amount)), 0) ?? 0;

    // Calculate week-over-week changes
    const changes = previousSnapshot
      ? {
          visits: calculateChange(currentSnapshot.visits, previousSnapshot.visits),
          views: calculateChange(currentSnapshot.views, previousSnapshot.views),
          toCart: calculateChange(currentSnapshot.to_cart, previousSnapshot.to_cart),
          checkout: calculateChange(currentSnapshot.checkout, previousSnapshot.checkout),
          completed: calculateChange(currentSnapshot.completed, previousSnapshot.completed),
        }
      : null;

    // Generate report HTML content
    const reportHtml = buildReportHtml(
      restaurant.name,
      week_start,
      week_end,
      currentSnapshot,
      previousSnapshot,
      changes,
      avgRating,
      reviews?.length ?? 0,
      totalRevenue,
      totalFees,
    );

    // Upload HTML as PDF placeholder to storage
    const pdfFileName = `reports/${restaurant_id}/${week_start}-report.html`;
    const htmlBlob = new Blob([reportHtml], { type: "text/html" });

    const { error: uploadError } = await adminClient.storage
      .from("reports")
      .upload(pdfFileName, htmlBlob, {
        contentType: "text/html",
        upsert: true,
      });

    let pdfUrl: string | null = null;
    if (!uploadError) {
      const { data: urlData } = adminClient.storage
        .from("reports")
        .getPublicUrl(pdfFileName);
      pdfUrl = urlData?.publicUrl ?? null;
    } else {
      console.error("Failed to upload report:", uploadError.message);
    }

    // Create report record
    const { data: report, error: reportError } = await adminClient
      .from("reports")
      .upsert(
        {
          restaurant_id,
          week_start,
          week_end,
          status: "generated",
          pdf_url: pdfUrl,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id,week_start" },
      )
      .select("id, restaurant_id, week_start, week_end, status, pdf_url, generated_at")
      .single();

    if (reportError || !report) {
      throw new Error(`Failed to create report: ${reportError?.message}`);
    }

    // Generate AI-powered recommended actions
    const actions = await generateActions(
      adminClient,
      userId,
      report.id,
      restaurant_id,
      week_start,
      currentSnapshot,
      previousSnapshot,
      avgRating,
    );

    // Generate checklist items
    await generateChecklist(
      adminClient,
      report.id,
      restaurant_id,
      week_start,
      currentSnapshot,
    );

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "generate_report",
      entity: "reports",
      entityId: report.id,
      newData: { restaurant_id, week_start, week_end, actions_count: actions.length },
      ipAddress: getClientIp(req),
    });

    return jsonResponse({
      success: true,
      report: {
        id: report.id,
        restaurant_id: report.restaurant_id,
        week_start: report.week_start,
        week_end: report.week_end,
        status: report.status,
        pdf_url: report.pdf_url,
        generated_at: report.generated_at,
      },
      metrics: {
        current: currentSnapshot,
        previous: previousSnapshot ?? null,
        changes,
        avg_rating: avgRating,
        review_count: reviews?.length ?? 0,
        total_revenue: totalRevenue,
        total_fees: totalFees,
      },
      actions_count: actions.length,
    }, 201);
  },
);

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function buildReportHtml(
  restaurantName: string,
  weekStart: string,
  weekEnd: string,
  current: SnapshotData,
  previous: SnapshotData | undefined,
  changes: Record<string, number> | null,
  avgRating: number,
  reviewCount: number,
  totalRevenue: number,
  totalFees: number,
): string {
  const changeIndicator = (value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    const arrow = value > 0 ? "+" : "";
    const color = value >= 0 ? "#22c55e" : "#ef4444";
    return `<span style="color: ${color}; font-size: 12px;">${arrow}${value}%</span>`;
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatorio Semanal - ${restaurantName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1a1a2e; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; }
    .header h1 { font-size: 28px; color: #1a1a2e; }
    .header p { color: #666; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; margin-bottom: 16px; color: #1a1a2e; border-left: 4px solid #e94560; padding-left: 12px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .metric-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-card .value { font-size: 32px; font-weight: bold; color: #1a1a2e; }
    .metric-card .label { font-size: 13px; color: #666; margin-top: 4px; }
    .funnel { margin-top: 16px; }
    .funnel-step { display: flex; align-items: center; margin-bottom: 8px; }
    .funnel-bar { height: 32px; background: linear-gradient(90deg, #1a1a2e, #e94560); border-radius: 4px; margin-right: 12px; display: flex; align-items: center; padding-left: 12px; color: white; font-weight: bold; font-size: 14px; }
    .funnel-label { font-size: 13px; color: #666; min-width: 100px; }
    .financial-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .financial-row .label { color: #666; }
    .financial-row .value { font-weight: bold; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>GTBI - Relatorio Semanal</h1>
      <p>${restaurantName}</p>
      <p>${weekStart} a ${weekEnd}</p>
    </div>

    <div class="section">
      <h2>Funil de Conversao</h2>
      <div class="funnel">
        ${buildFunnelStep("Visitas", current.visits, 100, changes?.visits)}
        ${buildFunnelStep("Visualizacoes", current.views, current.visits > 0 ? (current.views / current.visits) * 100 : 0, changes?.views)}
        ${buildFunnelStep("Carrinho", current.to_cart, current.visits > 0 ? (current.to_cart / current.visits) * 100 : 0, changes?.toCart)}
        ${buildFunnelStep("Checkout", current.checkout, current.visits > 0 ? (current.checkout / current.visits) * 100 : 0, changes?.checkout)}
        ${buildFunnelStep("Concluidos", current.completed, current.visits > 0 ? (current.completed / current.visits) * 100 : 0, changes?.completed)}
      </div>
    </div>

    <div class="section">
      <h2>Metricas Operacionais</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="value">${(current.cancellation_rate * 100).toFixed(1)}%</div>
          <div class="label">Taxa de Cancelamento</div>
        </div>
        <div class="metric-card">
          <div class="value">${(current.open_time_rate * 100).toFixed(1)}%</div>
          <div class="label">Taxa Loja Aberta</div>
        </div>
        <div class="metric-card">
          <div class="value">${(current.new_customers_rate * 100).toFixed(1)}%</div>
          <div class="label">Novos Clientes</div>
        </div>
        <div class="metric-card">
          <div class="value">${avgRating.toFixed(1)}</div>
          <div class="label">Avaliacao Media (${reviewCount} reviews)</div>
        </div>
        <div class="metric-card">
          <div class="value">R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div class="label">Receita Total</div>
        </div>
        <div class="metric-card">
          <div class="value">R$ ${totalFees.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div class="label">Taxas e Descontos</div>
        </div>
      </div>
    </div>

    ${
      previous
        ? `
    <div class="section">
      <h2>Comparacao Semana Anterior</h2>
      <div class="metrics-grid">
        <div class="metric-card"><div class="value">${previous.visits} &rarr; ${current.visits}</div><div class="label">Visitas ${changeIndicator(changes?.visits)}</div></div>
        <div class="metric-card"><div class="value">${previous.views} &rarr; ${current.views}</div><div class="label">Visualizacoes ${changeIndicator(changes?.views)}</div></div>
        <div class="metric-card"><div class="value">${previous.completed} &rarr; ${current.completed}</div><div class="label">Concluidos ${changeIndicator(changes?.completed)}</div></div>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>Resumo Financeiro</h2>
      <div class="financial-row"><span class="label">Receita Bruta</span><span class="value">R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
      <div class="financial-row"><span class="label">Taxas e Comissoes</span><span class="value" style="color: #ef4444;">- R$ ${totalFees.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
      <div class="financial-row" style="border-top: 2px solid #1a1a2e; font-size: 18px;"><span class="label"><strong>Receita Liquida</strong></span><span class="value">R$ ${(totalRevenue - totalFees).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
    </div>
  </div>
</body>
</html>`.trim();

  function buildFunnelStep(
    label: string,
    value: number,
    percentage: number,
    change?: number,
  ): string {
    const barWidth = Math.max(percentage, 10);
    return `
      <div class="funnel-step">
        <span class="funnel-label">${label}</span>
        <div class="funnel-bar" style="width: ${barWidth}%">${value}</div>
        ${change !== undefined ? changeIndicator(change) : ""}
      </div>`;
  }
}

async function generateActions(
  adminClient: SupabaseClient,
  userId: string,
  reportId: string,
  restaurantId: string,
  weekStart: string,
  current: SnapshotData,
  previous: SnapshotData | undefined,
  avgRating: number,
): Promise<Array<{ id: string }>> {
  // Build a prompt for OpenAI to suggest actions
  const metricsContext = `
Current week metrics:
- Visits: ${current.visits}, Views: ${current.views}, To Cart: ${current.to_cart}, Checkout: ${current.checkout}, Completed: ${current.completed}
- Cancellation Rate: ${(current.cancellation_rate * 100).toFixed(1)}%
- Open Time Rate: ${(current.open_time_rate * 100).toFixed(1)}%
- New Customers Rate: ${(current.new_customers_rate * 100).toFixed(1)}%
- Average Rating: ${avgRating.toFixed(1)}
${
    previous
      ? `Previous week: Visits: ${previous.visits}, Views: ${previous.views}, Completed: ${previous.completed}`
      : "No previous week data."
  }`;

  let aiActions: Array<{
    title: string;
    description: string;
    goal: string;
    action_type: string;
  }> = [];

  try {
    const aiResponse = await chatCompletion({
      systemPrompt: `You are a restaurant business intelligence consultant for iFood restaurants in Brazil.
Analyze the metrics and suggest 3-5 concrete, actionable recommendations.
Respond ONLY with a JSON array of objects with keys: title, description, goal, action_type.
action_type must be one of: menu_adjustment, promotion, response, operational, marketing, other.
Keep responses in Portuguese (Brazil). Be specific and practical.`,
      userPrompt: metricsContext,
      temperature: 0.7,
      maxTokens: 1024,
    });

    // Parse AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      aiActions = JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("AI action generation failed:", error);
    // Fallback: generate basic rule-based actions
    aiActions = generateRuleBasedActions(current, previous, avgRating);
  }

  // Insert actions
  const insertedActions: Array<{ id: string }> = [];
  const validActionTypes = [
    "menu_adjustment", "promotion", "response", "operational", "marketing", "other",
  ];

  for (const action of aiActions) {
    const actionType = validActionTypes.includes(action.action_type)
      ? action.action_type
      : "other";

    const { data, error } = await adminClient
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

    if (!error && data) {
      insertedActions.push({ id: data.id });
    }
  }

  return insertedActions;
}

function generateRuleBasedActions(
  current: SnapshotData,
  previous: SnapshotData | undefined,
  avgRating: number,
): Array<{ title: string; description: string; goal: string; action_type: string }> {
  const actions: Array<{
    title: string;
    description: string;
    goal: string;
    action_type: string;
  }> = [];

  // Low conversion rate from views to cart
  if (current.views > 0 && current.to_cart / current.views < 0.3) {
    actions.push({
      title: "Melhorar fotos e descricoes do cardapio",
      description:
        "A taxa de conversao de visualizacoes para carrinho esta abaixo de 30%. Revise as fotos e descricoes dos itens mais visualizados.",
      goal: "Aumentar taxa de conversao para carrinho em 10%",
      action_type: "menu_adjustment",
    });
  }

  // High cancellation rate
  if (current.cancellation_rate > 0.05) {
    actions.push({
      title: "Reduzir taxa de cancelamento",
      description:
        `Taxa de cancelamento em ${(current.cancellation_rate * 100).toFixed(1)}%. Verifique tempo de preparo, disponibilidade de itens e embalagens.`,
      goal: "Reduzir cancelamentos para menos de 5%",
      action_type: "operational",
    });
  }

  // Low rating
  if (avgRating > 0 && avgRating < 4.0) {
    actions.push({
      title: "Melhorar avaliacao dos clientes",
      description:
        `Avaliacao media de ${avgRating.toFixed(1)}. Responda avaliacoes negativas, melhore embalagem e tempo de entrega.`,
      goal: "Atingir avaliacao media de 4.5+",
      action_type: "response",
    });
  }

  // Decline in visits
  if (previous && current.visits < previous.visits * 0.9) {
    actions.push({
      title: "Reativar visibilidade na plataforma",
      description:
        "Queda de visitas em relacao a semana anterior. Considere ativar promocoes ou ampliar horario de funcionamento.",
      goal: "Recuperar volume de visitas da semana anterior",
      action_type: "marketing",
    });
  }

  // Low open time rate
  if (current.open_time_rate < 0.8) {
    actions.push({
      title: "Aumentar tempo com loja aberta",
      description:
        `Loja aberta apenas ${(current.open_time_rate * 100).toFixed(1)}% do horario. Avalie se o horario configurado esta correto.`,
      goal: "Manter loja aberta 90%+ do horario configurado",
      action_type: "operational",
    });
  }

  return actions;
}

async function generateChecklist(
  adminClient: SupabaseClient,
  reportId: string,
  restaurantId: string,
  weekStart: string,
  current: SnapshotData,
): Promise<void> {
  const items: Array<{ title: string }> = [
    { title: "Revisar metricas de funil e identificar gargalos" },
    { title: "Verificar avaliacoes pendentes de resposta" },
    { title: "Conferir tickets abertos e resolver" },
    { title: "Verificar disponibilidade do cardapio" },
    { title: "Analisar top 5 itens mais vendidos" },
  ];

  if (current.cancellation_rate > 0.03) {
    items.push({ title: "Investigar motivos de cancelamento" });
  }

  if (current.open_time_rate < 0.85) {
    items.push({ title: "Revisar horarios de funcionamento" });
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
