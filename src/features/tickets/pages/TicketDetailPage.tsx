import { useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/cn";
import { TicketThread } from "../components/TicketThread";
import { useTicket, useTicketMessages, useSendTicketMessage } from "../hooks";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [replyContent, setReplyContent] = useState("");

  const { data: ticket, isLoading: ticketLoading, error: ticketError, refetch } = useTicket(id);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(id);
  const sendMessage = useSendTicketMessage();

  function handleSendReply() {
    if (!id || replyContent.trim().length === 0) return;
    sendMessage.mutate(
      { ticketId: id, content: replyContent.trim() },
      { onSuccess: () => setReplyContent("") },
    );
  }

  const isLoading = ticketLoading || messagesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (ticketError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Erro ao carregar chamado.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Chamado não encontrado.</p>
      </div>
    );
  }

  const status = ticket.status ?? "open";

  // Map messages from API (snake_case) to component (camelCase)
  const mappedMessages = (messages ?? []).map((m) => ({
    sender: m.sender,
    content: m.content,
    sentAt: m.sent_at ?? m.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {ticket.subject ?? "Sem assunto"}
          </h1>
          <p className="text-muted-foreground">Chamado #{ticket.id}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(STATUS_STYLES[status] ?? STATUS_STYLES.open)}
        >
          {STATUS_LABELS[status] ?? status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversa</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketThread messages={mappedMessages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite a resposta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
          />
          <Button
            disabled={replyContent.trim().length === 0 || sendMessage.isPending}
            onClick={handleSendReply}
          >
            {sendMessage.isPending ? "Enviando..." : "Enviar resposta"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
