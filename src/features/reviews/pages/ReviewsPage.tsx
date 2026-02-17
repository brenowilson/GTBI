import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewCard } from "../components/ReviewCard";
import { AutoReplyControls } from "../components/AutoReplyControls";
import { TemplateEditor } from "../components/TemplateEditor";
import { useReviews, useAutoReplySettings } from "../hooks";
import { useRestaurantStore } from "@/stores/restaurant.store";

const TEMPLATE_PLACEHOLDERS = [
  "nome_cliente",
  "nome_restaurante",
  "nota",
  "pedido_id",
];

export function ReviewsPage() {
  const { data: reviews, isLoading, error, refetch } = useReviews();
  const autoReply = useAutoReplySettings();
  const { selectedRestaurant } = useRestaurantStore();

  const [localTemplate, setLocalTemplate] = useState<string | null>(null);

  const templateValue = localTemplate ?? autoReply.template ?? "";

  function handleTemplateChange(value: string) {
    setLocalTemplate(value);
  }

  function handleTemplateSave() {
    autoReply.updateSettings.mutate(
      { mode: autoReply.mode, template: localTemplate ?? "" },
      { onSuccess: () => setLocalTemplate(null) },
    );
  }

  const restaurants = selectedRestaurant
    ? [
        {
          id: selectedRestaurant.id,
          name: selectedRestaurant.name,
          enabled: selectedRestaurant.review_auto_reply_enabled,
          mode: selectedRestaurant.review_auto_reply_mode,
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
        <p className="text-muted-foreground">Erro ao carregar avaliações.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Map reviews from API (snake_case) to component (camelCase)
  const mappedReviews = (reviews ?? []).map((r) => ({
    rating: r.rating,
    comment: r.comment,
    customerName: r.customer_name,
    date: r.review_date,
    response: r.response,
    responseStatus: r.response_status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avaliações</h1>
        <p className="text-muted-foreground">
          Gerencie avaliações e configure respostas automáticas.
        </p>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="auto-reply">Auto-resposta</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {mappedReviews.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <p>Nenhuma avaliação encontrada.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mappedReviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto-reply" className="space-y-4">
          <AutoReplyControls
            globalEnabled={autoReply.isEnabled}
            globalMode={autoReply.mode}
            restaurants={restaurants}
            onGlobalToggle={(enabled) => autoReply.toggle.mutate(enabled)}
            onGlobalModeChange={(mode) =>
              autoReply.updateSettings.mutate({ mode })
            }
          />
          <TemplateEditor
            template={templateValue}
            onChange={handleTemplateChange}
            onSave={handleTemplateSave}
            placeholders={TEMPLATE_PLACEHOLDERS}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
