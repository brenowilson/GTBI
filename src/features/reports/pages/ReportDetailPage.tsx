import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InternalContentEditor } from "../components/InternalContentEditor";
import { ActionsList } from "../components/ActionsList";
import { WeeklyChecklist } from "../components/WeeklyChecklist";
import { SendReportModal } from "../components/SendReportModal";
import { MarkDoneModal } from "../components/MarkDoneModal";
import { MarkDiscardedModal } from "../components/MarkDiscardedModal";
import type { ActionStatus, ActionType } from "@/entities/action/model";

const mockActions = [
  {
    id: "a1",
    title: "Ajustar preço do combo família",
    description: "Reduzir preço em 10% para aumentar conversão",
    goal: "Aumentar pedidos do combo em 15%",
    actionType: "menu_adjustment" as ActionType,
    status: "planned" as ActionStatus,
  },
  {
    id: "a2",
    title: "Responder avaliações negativas",
    description: "Responder todas as avaliações abaixo de 3 estrelas",
    goal: "Melhorar nota geral para 4.5",
    actionType: "response" as ActionType,
    status: "done" as ActionStatus,
  },
  {
    id: "a3",
    title: "Criar promoção de fim de semana",
    description: null,
    goal: "Aumentar pedidos no sábado e domingo",
    actionType: "promotion" as ActionType,
    status: "planned" as ActionStatus,
  },
];

const mockChecklist = [
  { id: "c1", title: "Verificar cardápio atualizado", isChecked: true },
  { id: "c2", title: "Conferir horário de funcionamento", isChecked: true },
  { id: "c3", title: "Revisar avaliações pendentes", isChecked: false },
  { id: "c4", title: "Analisar relatório financeiro", isChecked: false },
  { id: "c5", title: "Atualizar fotos dos produtos", isChecked: false },
];

export function ReportDetailPage() {
  const [internalContent, setInternalContent] = useState("");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [markDoneModalOpen, setMarkDoneModalOpen] = useState(false);
  const [markDiscardedModalOpen, setMarkDiscardedModalOpen] = useState(false);
  const [_selectedActionId, setSelectedActionId] = useState("");
  const [checklist, setChecklist] = useState(mockChecklist);

  function handleToggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }

  function handleMarkDone(actionId: string) {
    setSelectedActionId(actionId);
    setMarkDoneModalOpen(true);
  }

  function handleDiscard(actionId: string) {
    setSelectedActionId(actionId);
    setMarkDiscardedModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório - Restaurante Central
          </h1>
          <p className="text-muted-foreground">
            Semana: 09/02/2026 - 15/02/2026
          </p>
        </div>
        <Button onClick={() => setSendModalOpen(true)}>Enviar relatório</Button>
      </div>

      <InternalContentEditor
        content={internalContent}
        onChange={setInternalContent}
        onSave={() => {}}
      />

      <ActionsList
        actions={mockActions}
        onCreate={() => {}}
        onMarkDone={handleMarkDone}
        onDiscard={handleDiscard}
      />

      <WeeklyChecklist items={checklist} onToggle={handleToggleChecklist} />

      <SendReportModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        reportId="1"
        onConfirm={() => setSendModalOpen(false)}
      />

      <MarkDoneModal
        open={markDoneModalOpen}
        onOpenChange={setMarkDoneModalOpen}
        onConfirm={() => setMarkDoneModalOpen(false)}
      />

      <MarkDiscardedModal
        open={markDiscardedModalOpen}
        onOpenChange={setMarkDiscardedModalOpen}
        onConfirm={() => setMarkDiscardedModalOpen(false)}
      />
    </div>
  );
}
