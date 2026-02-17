import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface TicketCardProps {
  ticket: {
    id: string;
    subject: string | null;
    status: TicketStatus;
    createdAt: string;
    messagesCount: number;
  };
  onClick?: (id: string) => void;
}

const statusLabels: Record<TicketStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => onClick?.(ticket.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">
            {ticket.subject ?? "Sem assunto"}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(statusStyles[ticket.status])}
          >
            {statusLabels[ticket.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Criado em: {formatDate(ticket.createdAt)}</span>
          <span>
            {ticket.messagesCount}{" "}
            {ticket.messagesCount === 1 ? "mensagem" : "mensagens"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
