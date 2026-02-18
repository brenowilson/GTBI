import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import {
  withMiddleware,
  AuthContext,
  requireRestaurantAccess,
} from "../_shared/middleware.ts";
import { ValidationError, NotFoundError } from "../_shared/errors.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logAudit, getClientIp } from "../_shared/audit.ts";

/**
 * POST /financial-export
 *
 * Exports financial data for a restaurant as CSV (or tab-separated for XLS compatibility).
 *
 * Body: {
 *   restaurant_id: string,
 *   start_date: string (YYYY-MM-DD),
 *   end_date: string (YYYY-MM-DD),
 *   format?: "csv" | "xls" (default: "csv")
 * }
 * Requires: user_can(userId, 'financial', 'read') + restaurant access
 */
const handler = withMiddleware(
  async (req: Request, ctx: AuthContext | null): Promise<Response> => {
    const { userId, adminClient } = ctx!;

    // Parse and validate input
    const body = await req.json();
    const { restaurant_id, start_date, end_date, format } = body;

    if (!restaurant_id || typeof restaurant_id !== "string") {
      throw new ValidationError("restaurant_id is required");
    }

    if (!start_date || typeof start_date !== "string") {
      throw new ValidationError("start_date is required (YYYY-MM-DD)");
    }

    if (!end_date || typeof end_date !== "string") {
      throw new ValidationError("end_date is required (YYYY-MM-DD)");
    }

    const exportFormat = format ?? "csv";
    if (exportFormat !== "csv" && exportFormat !== "xls") {
      throw new ValidationError("format must be 'csv' or 'xls'");
    }

    // Check restaurant access
    await requireRestaurantAccess(adminClient, userId, restaurant_id);

    // Get restaurant name
    const { data: restaurant } = await adminClient
      .from("restaurants")
      .select("name")
      .eq("id", restaurant_id)
      .maybeSingle();

    if (!restaurant) {
      throw new NotFoundError("Restaurant", restaurant_id);
    }

    // Fetch financial entries
    const { data: entries, error: fetchError } = await adminClient
      .from("financial_entries")
      .select("id, entry_type, description, amount, reference_date, order_id, created_at")
      .eq("restaurant_id", restaurant_id)
      .gte("reference_date", start_date)
      .lte("reference_date", end_date)
      .order("reference_date", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch financial entries: ${fetchError.message}`);
    }

    if (!entries || entries.length === 0) {
      throw new NotFoundError("Financial entries for the given period");
    }

    // Calculate totals
    const totals = {
      revenue: 0,
      fees: 0,
      promotions: 0,
      refunds: 0,
      other: 0,
      net: 0,
    };

    for (const entry of entries) {
      const amount = Number(entry.amount);
      switch (entry.entry_type) {
        case "revenue":
          totals.revenue += amount;
          break;
        case "fee":
        case "commission":
        case "delivery_fee":
          totals.fees += amount;
          break;
        case "promotion":
          totals.promotions += amount;
          break;
        case "refund":
          totals.refunds += amount;
          break;
        default:
          totals.other += amount;
          break;
      }
    }
    totals.net = totals.revenue + totals.fees + totals.promotions + totals.refunds + totals.other;

    // Build CSV/TSV content
    const separator = exportFormat === "csv" ? "," : "\t";
    const lines: string[] = [];

    // Header
    lines.push(
      [
        "Data",
        "Tipo",
        "Descricao",
        "Valor (R$)",
        "Pedido",
      ].join(separator),
    );

    // Type label map
    const typeLabels: Record<string, string> = {
      revenue: "Receita",
      fee: "Taxa",
      promotion: "Promocao",
      refund: "Reembolso",
      adjustment: "Ajuste",
      delivery_fee: "Taxa de Entrega",
      commission: "Comissao",
      other: "Outros",
    };

    // Data rows
    for (const entry of entries) {
      const row = [
        entry.reference_date,
        typeLabels[entry.entry_type ?? "other"] ?? entry.entry_type ?? "Outros",
        escapeField(entry.description ?? "", separator),
        Number(entry.amount).toFixed(2),
        entry.order_id ?? "",
      ];
      lines.push(row.join(separator));
    }

    // Summary rows
    lines.push("");
    lines.push(["", "RESUMO", "", "", ""].join(separator));
    lines.push(["", "Receita Total", "", totals.revenue.toFixed(2), ""].join(separator));
    lines.push(["", "Taxas e Comissoes", "", totals.fees.toFixed(2), ""].join(separator));
    lines.push(["", "Promocoes", "", totals.promotions.toFixed(2), ""].join(separator));
    lines.push(["", "Reembolsos", "", totals.refunds.toFixed(2), ""].join(separator));
    lines.push(["", "Outros", "", totals.other.toFixed(2), ""].join(separator));
    lines.push(["", "TOTAL LIQUIDO", "", totals.net.toFixed(2), ""].join(separator));

    const fileContent = lines.join("\n");

    // Build filename
    const sanitizedName = restaurant.name.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `financeiro_${sanitizedName}_${start_date}_${end_date}`;

    // Set content type and disposition based on format
    const contentType =
      exportFormat === "csv"
        ? "text/csv; charset=utf-8"
        : "application/vnd.ms-excel; charset=utf-8";
    const fileExtension = exportFormat === "csv" ? "csv" : "xls";

    // Audit log
    await logAudit(adminClient, {
      userId,
      action: "export_financial",
      entity: "financial_entries",
      newData: {
        restaurant_id,
        start_date,
        end_date,
        format: exportFormat,
        entries_count: entries.length,
      },
      ipAddress: getClientIp(req),
    });

    // Return as downloadable file
    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}.${fileExtension}"`,
      },
    });
  },
  { permission: ["financial", "read"] },
);

function escapeField(value: string, separator: string): string {
  // If the value contains the separator, quotes, or newlines, wrap in quotes
  if (
    value.includes(separator) ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

serve(handler);
