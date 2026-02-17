import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinancialSummaryCard } from "../components/FinancialSummaryCard";
import { FinancialBreakdown } from "../components/FinancialBreakdown";
import { ExportButtons } from "../components/ExportButtons";
import type { FinancialEntryType } from "@/entities/financial/model";

const mockBreakdown: {
  entryType: FinancialEntryType;
  total: number;
  count: number;
}[] = [
  { entryType: "revenue", total: 45230.5, count: 320 },
  { entryType: "fee", total: -3200.0, count: 320 },
  { entryType: "commission", total: -5428.0, count: 320 },
  { entryType: "delivery_fee", total: -2150.0, count: 280 },
  { entryType: "promotion", total: -1500.0, count: 15 },
  { entryType: "refund", total: -890.0, count: 8 },
  { entryType: "adjustment", total: 350.0, count: 3 },
];

export function FinancialPage() {
  const [startDate, setStartDate] = useState("2026-02-01");
  const [endDate, setEndDate] = useState("2026-02-17");

  const totalPositive = mockBreakdown
    .filter((item) => item.total > 0)
    .reduce((sum, item) => sum + item.total, 0);

  const totalNegative = Math.abs(
    mockBreakdown
      .filter((item) => item.total < 0)
      .reduce((sum, item) => sum + item.total, 0)
  );

  const net = totalPositive - totalNegative;

  function handleExport(_format: "csv" | "xls") {
    // Placeholder for export logic
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Resumo financeiro e detalhamento por tipo de lançamento.
          </p>
        </div>
        <ExportButtons onExport={handleExport} />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="start-date">Data inicial</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end-date">Data final</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>

      <FinancialSummaryCard
        totalPositive={totalPositive}
        totalNegative={totalNegative}
        net={net}
      />

      <FinancialBreakdown items={mockBreakdown} />
    </div>
  );
}
