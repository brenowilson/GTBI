import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InternalContentEditor } from "../components/InternalContentEditor";
import { ActionsList } from "../components/ActionsList";
import { WeeklyChecklist } from "../components/WeeklyChecklist";
import { SendReportModal } from "../components/SendReportModal";
import { MarkDoneModal } from "../components/MarkDoneModal";
import { MarkDiscardedModal } from "../components/MarkDiscardedModal";
import {
  useReport,
  useActions,
  useChecklists,
  useToggleChecklistItem,
  useInternalContent,
  useMarkActionDone,
  useMarkActionDiscarded,
  useSendReport,
} from "../hooks";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading: reportLoading, error: reportError, refetch: refetchReport } = useReport(id);
  const { data: actions, isLoading: actionsLoading } = useActions({ reportId: id });
  const { data: checklist, isLoading: checklistLoading } = useChecklists({ reportId: id });
  const { internalContent, isLoading: contentLoading, update: updateContent } = useInternalContent(id);
  const toggleChecklistItem = useToggleChecklistItem();
  const markDone = useMarkActionDone();
  const markDiscarded = useMarkActionDiscarded();
  const sendReport = useSendReport();

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [markDoneModalOpen, setMarkDoneModalOpen] = useState(false);
  const [markDiscardedModalOpen, setMarkDiscardedModalOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState("");
  const [localContent, setLocalContent] = useState<string | null>(null);

  // Map internal content: could be a string or an object with .content
  const rawContent = internalContent;
  const resolvedContent =
    typeof rawContent === "string"
      ? rawContent
      : rawContent?.content ?? "";
  const editorContent = localContent ?? resolvedContent;

  function handleContentChange(value: string) {
    setLocalContent(value);
  }

  function handleContentSave() {
    updateContent.mutate(editorContent, {
      onSuccess: () => setLocalContent(null),
    });
  }

  function handleToggleChecklist(itemId: string) {
    const item = checklist?.find((c) => c.id === itemId);
    if (item) {
      toggleChecklistItem.mutate({ id: itemId, isChecked: !item.is_checked });
    }
  }

  function handleMarkDone(actionId: string) {
    setSelectedActionId(actionId);
    setMarkDoneModalOpen(true);
  }

  function handleDiscard(actionId: string) {
    setSelectedActionId(actionId);
    setMarkDiscardedModalOpen(true);
  }

  function handleConfirmMarkDone(evidence: string) {
    markDone.mutate(
      { actionId: selectedActionId, evidence },
      { onSettled: () => setMarkDoneModalOpen(false) },
    );
  }

  function handleConfirmDiscard(reason: string) {
    markDiscarded.mutate(
      { actionId: selectedActionId, reason },
      { onSettled: () => setMarkDiscardedModalOpen(false) },
    );
  }

  function handleConfirmSend(channels: ("email" | "whatsapp")[]) {
    sendReport.mutate(
      { reportId: id!, channels },
      { onSettled: () => setSendModalOpen(false) },
    );
  }

  const isLoading = reportLoading || actionsLoading || checklistLoading || contentLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Erro ao carregar relatório.</p>
        <Button variant="outline" onClick={() => refetchReport()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Relatório não encontrado.</p>
      </div>
    );
  }

  // Map actions from API (snake_case) to component (camelCase)
  const mappedActions = (actions ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    goal: a.goal,
    actionType: a.action_type,
    status: a.status,
  }));

  // Map checklist from API (snake_case) to component (camelCase)
  const mappedChecklist = (checklist ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    isChecked: c.is_checked,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Relatório - {report.restaurant_id}
          </h1>
          <p className="text-muted-foreground">
            Semana: {report.week_start} - {report.week_end}
          </p>
        </div>
        <Button onClick={() => setSendModalOpen(true)}>Enviar relatório</Button>
      </div>

      <InternalContentEditor
        content={editorContent}
        onChange={handleContentChange}
        onSave={handleContentSave}
      />

      <ActionsList
        actions={mappedActions}
        onCreate={() => {}}
        onMarkDone={handleMarkDone}
        onDiscard={handleDiscard}
      />

      <WeeklyChecklist
        items={mappedChecklist}
        onToggle={handleToggleChecklist}
      />

      <SendReportModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        reportId={id ?? ""}
        onConfirm={handleConfirmSend}
      />

      <MarkDoneModal
        open={markDoneModalOpen}
        onOpenChange={setMarkDoneModalOpen}
        onConfirm={handleConfirmMarkDone}
      />

      <MarkDiscardedModal
        open={markDiscardedModalOpen}
        onOpenChange={setMarkDiscardedModalOpen}
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
