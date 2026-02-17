import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportCard } from "../components/ReportCard";
import { SendReportModal } from "../components/SendReportModal";
import { useReports, useSendReport } from "../hooks";
import type { ReportStatus } from "@/entities/report/model";

export function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState("");

  const filters = statusFilter !== "all"
    ? { status: statusFilter as ReportStatus }
    : undefined;

  const { data: reports, isLoading, error, refetch } = useReports(filters);
  const sendReport = useSendReport();

  function handleSend(id: string) {
    setSelectedReportId(id);
    setSendModalOpen(true);
  }

  function handleConfirmSend(channels: ("email" | "whatsapp")[]) {
    sendReport.mutate(
      { reportId: selectedReportId, channels },
      { onSettled: () => setSendModalOpen(false) },
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
        <p className="text-muted-foreground">Erro ao carregar relatórios.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const mappedReports = (reports ?? []).map((r) => ({
    id: r.id,
    restaurantName: r.restaurant_id,
    weekStart: r.week_start,
    weekEnd: r.week_end,
    status: r.status,
    generatedAt: r.generated_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gerencie e envie os relatórios semanais.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="generated">Gerado</SelectItem>
            <SelectItem value="sending">Enviando</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="failed">Falha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mappedReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onSend={handleSend}
          />
        ))}
      </div>

      {mappedReports.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum relatório encontrado com os filtros selecionados.
        </p>
      )}

      <SendReportModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        reportId={selectedReportId}
        onConfirm={handleConfirmSend}
      />
    </div>
  );
}
