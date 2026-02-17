import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketCard } from "../components/TicketCard";
import { TicketAutoReplyControls } from "../components/TicketAutoReplyControls";
import { useTickets, useTicketAutoReply } from "../hooks";
import { useRestaurantStore } from "@/stores/restaurant.store";

export function TicketsPage() {
  const { data: tickets, isLoading, error, refetch } = useTickets();
  const autoReply = useTicketAutoReply();
  const { selectedRestaurant } = useRestaurantStore();

  const restaurants = selectedRestaurant
    ? [
        {
          id: selectedRestaurant.id,
          name: selectedRestaurant.name,
          enabled: selectedRestaurant.ticket_auto_reply_enabled,
          mode: selectedRestaurant.ticket_auto_reply_mode,
        },
      ]
    : [];

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
        <p className="text-muted-foreground">Erro ao carregar chamados.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Map tickets from API (snake_case) to component (camelCase)
  const mappedTickets = (tickets ?? []).map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    createdAt: t.created_at,
    messagesCount: 0,
  }));

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
          {mappedTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <p>Nenhum chamado encontrado.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mappedTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto-reply" className="space-y-4">
          <TicketAutoReplyControls
            globalEnabled={autoReply.isEnabled}
            globalMode={autoReply.mode}
            restaurants={restaurants}
            onGlobalToggle={(enabled) => autoReply.toggle.mutate(enabled)}
            onGlobalModeChange={(mode) =>
              autoReply.updateSettings.mutate({ mode })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
