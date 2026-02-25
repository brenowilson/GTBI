import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { ReportCard } from "../components/ReportCard";
import { SendReportModal } from "../components/SendReportModal";
import { CreateReportModal } from "../components/CreateReportModal";
import { useReports, useAllReports, useSendReport } from "../hooks";
import type { ReportStatus } from "@/entities/report/model";

export function ReportsPage() {
  const navigate = useNavigate();
  const { selectedRestaurant } = useRestaurantStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState("");

  const filters = statusFilter !== "all"
    ? { status: statusFilter as ReportStatus }
    : undefined;

  const restaurantReports = useReports(filters);
  const allReports = useAllReports(
    selectedRestaurant ? undefined : filters,
  );
  const sendReport = useSendReport();

  const hasRestaurant = !!selectedRestaurant;
  const { data: reports, isLoading, error, refetch } = hasRestaurant
    ? restaurantReports
    : allReports;

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
    restaurantName: selectedRestaurant?.name ?? (r.restaurant_id ? r.restaurant_id : null),
    weekStart: r.week_start,
    weekEnd: r.week_end,
    status: r.status,
    source: r.source ?? "api",
    generatedAt: r.generated_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gerencie e envie relatórios semanais para os clientes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="generating">Gerando</SelectItem>
              <SelectItem value="generated">Gerado</SelectItem>
              <SelectItem value="sending">Enviando</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="failed">Falha</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mappedReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onView={(id) => navigate(`/reports/${id}`)}
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

      <CreateReportModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
