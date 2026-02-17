import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IFinancialRepository, FinancialFilters } from "../interfaces/IFinancialRepository";
import type { FinancialEntry, FinancialSummary } from "@/entities/financial";

export class SupabaseFinancialRepository implements IFinancialRepository {
  async getByRestaurant(restaurantId: string, filters?: FinancialFilters): Promise<FinancialEntry[]> {
    let query = supabase
      .from("financial_entries")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("reference_date", { ascending: false });

    if (filters?.entryType) {
      query = query.eq("entry_type", filters.entryType);
    }

    if (filters?.startDate) {
      query = query.gte("reference_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("reference_date", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getSummary(restaurantId: string, startDate: string, endDate: string): Promise<FinancialSummary> {
    const entries = await this.getByRestaurant(restaurantId, { startDate, endDate });

    let totalPositive = 0;
    let totalNegative = 0;
    const breakdownMap = new Map<string, { total: number; count: number }>();

    for (const entry of entries) {
      if (entry.amount >= 0) {
        totalPositive += entry.amount;
      } else {
        totalNegative += entry.amount;
      }

      const existing = breakdownMap.get(entry.entry_type);
      if (existing) {
        existing.total += entry.amount;
        existing.count += 1;
      } else {
        breakdownMap.set(entry.entry_type, { total: entry.amount, count: 1 });
      }
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([entryType, stats]) => ({
      entry_type: entryType as FinancialEntry["entry_type"],
      total: stats.total,
      count: stats.count,
    }));

    return {
      total_positive: totalPositive,
      total_negative: totalNegative,
      net: totalPositive + totalNegative,
      breakdown,
    };
  }

  async exportData(
    restaurantId: string,
    startDate: string,
    endDate: string,
    format: "csv" | "xls",
  ): Promise<Blob> {
    const { data, error } = await invokeFunction<Blob>("financial-export", {
      restaurant_id: restaurantId,
      start_date: startDate,
      end_date: endDate,
      format,
    });

    if (error) throw new Error(error);
    return data!;
  }
}
