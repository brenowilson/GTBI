import type { FinancialEntry, FinancialSummary, FinancialEntryType } from "@/entities/financial";

export interface FinancialFilters {
  entryType?: FinancialEntryType;
  startDate?: string;
  endDate?: string;
}

export interface IFinancialRepository {
  getByRestaurant(restaurantId: string, filters?: FinancialFilters): Promise<FinancialEntry[]>;
  getSummary(restaurantId: string, startDate: string, endDate: string): Promise<FinancialSummary>;
  exportData(restaurantId: string, startDate: string, endDate: string, format: "csv" | "xls"): Promise<Blob>;
}
