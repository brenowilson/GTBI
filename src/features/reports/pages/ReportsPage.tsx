import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportCard } from "../components/ReportCard";
import { SendReportModal } from "../components/SendReportModal";
import type { ReportStatus } from "@/entities/report/model";

const mockReports = [
  {
    id: "1",
    restaurantName: "Restaurante Central",
    weekStart: "2026-02-09",
    weekEnd: "2026-02-15",
    status: "generated" as ReportStatus,
    generatedAt: "2026-02-16T10:00:00Z",
  },
  {
    id: "2",
    restaurantName: "Restaurante Norte",
    weekStart: "2026-02-09",
    weekEnd: "2026-02-15",
    status: "sent" as ReportStatus,
    generatedAt: "2026-02-16T09:30:00Z",
  },
  {
    id: "3",
    restaurantName: "Restaurante Sul",
    weekStart: "2026-02-02",
    weekEnd: "2026-02-08",
    status: "failed" as ReportStatus,
    generatedAt: "2026-02-09T08:00:00Z",
  },
  {
    id: "4",
    restaurantName: "Restaurante Leste",
    weekStart: "2026-02-09",
    weekEnd: "2026-02-15",
    status: "sending" as ReportStatus,
    generatedAt: "2026-02-16T11:00:00Z",
  },
];

export function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState("");

  const filteredReports =
    statusFilter === "all"
      ? mockReports
      : mockReports.filter((r) => r.status === statusFilter);

  function handleSend(id: string) {
    setSelectedReportId(id);
    setSendModalOpen(true);
  }

  function handleConfirmSend(_channels: ("email" | "whatsapp")[]) {
    setSendModalOpen(false);
  }

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
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onSend={handleSend}
          />
        ))}
      </div>

      {filteredReports.length === 0 && (
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
