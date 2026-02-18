import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoRestaurantSelected } from "@/components/common/NoRestaurantSelected";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { FinancialSummaryCard } from "../components/FinancialSummaryCard";
import { FinancialBreakdown } from "../components/FinancialBreakdown";
import { ExportButtons } from "../components/ExportButtons";
import { useFinancialSummary, useFinancialExport } from "../hooks";

function formatDateToISO(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function FinancialPage() {
  const { selectedRestaurant } = useRestaurantStore();

  const defaultDates = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: formatDateToISO(startOfMonth),
      end: formatDateToISO(today),
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const { data: summary, isLoading, error, refetch } = useFinancialSummary(startDate, endDate);
  const exportMutation = useFinancialExport();

  function handleExport(format: "csv" | "xls") {
    exportMutation.mutate({ startDate, endDate, format });
  }

  if (!selectedRestaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Resumo financeiro e detalhamento por tipo de lançamento do restaurante.
          </p>
        </div>
        <NoRestaurantSelected />
      </div>
    );
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
            Resumo financeiro e detalhamento por tipo de lançamento do restaurante.
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
