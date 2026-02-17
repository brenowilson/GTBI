import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import { TicketAutoReplyControls } from "../components/TicketAutoReplyControls";

const mockTickets = [
  {
    id: "t1",
    subject: "Pedido não entregue",
    status: "open" as const,
    createdAt: "2026-02-16T15:30:00Z",
    messagesCount: 3,
  },
  {
    id: "t2",
    subject: "Item errado no pedido #4521",
    status: "in_progress" as const,
    createdAt: "2026-02-15T10:00:00Z",
    messagesCount: 5,
  },
  {
    id: "t3",
    subject: "Solicitação de reembolso",
    status: "resolved" as const,
    createdAt: "2026-02-14T08:45:00Z",
    messagesCount: 7,
  },
  {
    id: "t4",
    subject: null,
    status: "closed" as const,
    createdAt: "2026-02-10T12:00:00Z",
    messagesCount: 2,
  },
];

const mockRestaurants = [
  { id: "r1", name: "Restaurante Central", enabled: true, mode: "ai" as const },
  { id: "r2", name: "Restaurante Norte", enabled: false, mode: "template" as const },
];

export function TicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chamados</h1>
        <p className="text-muted-foreground">
          Gerencie chamados de suporte e configure respostas automáticas.
        </p>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">Chamados</TabsTrigger>
          <TabsTrigger value="auto-reply">Auto-resposta</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mockTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto-reply" className="space-y-4">
          <TicketAutoReplyControls
            globalEnabled={false}
            globalMode="template"
            restaurants={mockRestaurants}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
