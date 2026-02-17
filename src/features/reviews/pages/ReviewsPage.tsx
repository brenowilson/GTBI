import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewCard } from "../components/ReviewCard";
import { AutoReplyControls } from "../components/AutoReplyControls";
import { TemplateEditor } from "../components/TemplateEditor";

const mockReviews = [
  {
    rating: 5,
    comment: "Comida excelente! Chegou rápido e bem embalada.",
    customerName: "Maria S.",
    date: "2026-02-15T14:30:00Z",
    response: "Obrigado pela avaliação, Maria! Ficamos felizes que gostou!",
    responseStatus: "sent" as const,
  },
  {
    rating: 3,
    comment: "Pedido veio incompleto, faltou a bebida.",
    customerName: "João P.",
    date: "2026-02-14T20:00:00Z",
    response: null,
    responseStatus: null,
  },
  {
    rating: 1,
    comment: "Demorou muito e a comida chegou fria.",
    customerName: "Ana L.",
    date: "2026-02-13T19:15:00Z",
    response: "Sentimos muito pela experiência, Ana. Já estamos tomando providências.",
    responseStatus: "pending" as const,
  },
  {
    rating: 4,
    comment: null,
    customerName: null,
    date: "2026-02-12T12:00:00Z",
    response: null,
    responseStatus: null,
  },
];

const mockRestaurants = [
  { id: "r1", name: "Restaurante Central", enabled: true, mode: "ai" as const },
  { id: "r2", name: "Restaurante Norte", enabled: false, mode: "template" as const },
  { id: "r3", name: "Restaurante Sul", enabled: true, mode: "template" as const },
];

const mockPlaceholders = [
  "nome_cliente",
  "nome_restaurante",
  "nota",
  "pedido_id",
];

export function ReviewsPage() {
  const [template, setTemplate] = useState(
    "Olá {nome_cliente}, agradecemos sua avaliação no {nome_restaurante}!"
  );

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mockReviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="auto-reply" className="space-y-4">
          <AutoReplyControls
            globalEnabled={true}
            globalMode="ai"
            restaurants={mockRestaurants}
          />
          <TemplateEditor
            template={template}
            onChange={setTemplate}
            onSave={() => {}}
            placeholders={mockPlaceholders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
