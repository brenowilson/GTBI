import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CatalogItem } from "@/entities/catalog-item/model";

interface CatalogItemCardProps {
  item: CatalogItem;
  onOpenImageWorkflow?: (item: CatalogItem) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CatalogItemCard({
  item,
  onOpenImageWorkflow,
}: CatalogItemCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{item.name}</CardTitle>
          <Badge variant={item.is_available ? "default" : "secondary"}>
            {item.is_available ? "Disponível" : "Indisponível"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <div className="flex items-start gap-4">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">Sem foto</span>
            </div>
          )}
          <div className="flex-1 space-y-1">
            {item.category_name && (
              <p className="text-xs text-muted-foreground">
                {item.category_name}
              </p>
            )}
            {item.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
            <p className="text-lg font-semibold">
              {formatCurrency(item.price)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenImageWorkflow?.(item)}
        >
          Editar imagem
        </Button>
      </CardFooter>
    </Card>
  );
}
