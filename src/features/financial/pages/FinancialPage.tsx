import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinancialSummaryCard } from "../components/FinancialSummaryCard";
import { FinancialBreakdown } from "../components/FinancialBreakdown";
import { ExportButtons } from "../components/ExportButtons";
import { useFinancialSummary, useFinancialExport } from "../hooks";

export function FinancialPage() {
  const [startDate, setStartDate] = useState("2026-02-01");
  const [endDate, setEndDate] = useState("2026-02-17");

  const { data: summary, isLoading, error, refetch } = useFinancialSummary(startDate, endDate);
  const exportMutation = useFinancialExport();

  function handleExport(format: "csv" | "xls") {
    exportMutation.mutate({ startDate, endDate, format });
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Erro ao carregar dados financeiros.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const totalPositive = summary?.total_positive ?? 0;
  const totalNegative = summary?.total_negative ?? 0;
  const net = summary?.net ?? 0;

  // Map breakdown from API (snake_case) to component (camelCase)
  const mappedBreakdown = (summary?.breakdown ?? []).map((item) => ({
    entryType: item.entry_type,
    total: item.total,
    count: item.count,
  }));

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

      <FinancialBreakdown items={mappedBreakdown} />
    </div>
  );
}
