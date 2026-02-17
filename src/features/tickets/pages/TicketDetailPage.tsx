import { useState } from "react";
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

const mockMessages = [
  {
    sender: "customer" as const,
    content: "Olá, meu pedido não chegou e já faz 2 horas. Número do pedido: #4521",
    sentAt: "2026-02-16T15:30:00Z",
  },
  {
    sender: "system" as const,
    content: "Chamado aberto automaticamente pelo sistema.",
    sentAt: "2026-02-16T15:30:01Z",
  },
  {
    sender: "restaurant" as const,
    content: "Olá! Sentimos muito pelo inconveniente. Vamos verificar com o entregador o status da entrega.",
    sentAt: "2026-02-16T15:45:00Z",
  },
  {
    sender: "customer" as const,
    content: "Ok, aguardo retorno.",
    sentAt: "2026-02-16T15:50:00Z",
  },
  {
    sender: "restaurant" as const,
    content: "Identificamos que houve um problema com o entregador. Estamos providenciando o reenvio do pedido. Deve chegar em até 40 minutos.",
    sentAt: "2026-02-16T16:00:00Z",
  },
];

export function TicketDetailPage() {
  const [replyContent, setReplyContent] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pedido não entregue
          </h1>
          <p className="text-muted-foreground">Chamado #t1</p>
        </div>
        <Badge
          variant="outline"
          className={cn("bg-blue-100 text-blue-800 border-blue-200")}
        >
          Aberto
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversa</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketThread messages={mockMessages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite sua resposta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
          />
          <Button disabled={replyContent.trim().length === 0}>
            Enviar resposta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
