import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogItemCard } from "../components/CatalogItemCard";
import { ImageWorkflowModal } from "../components/ImageWorkflowModal";
import { useCatalogItems, useImageJobRealtime } from "../hooks";
import type { CatalogItem } from "@/entities/catalog-item/model";

export function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const filters = searchTerm ? { search: searchTerm } : undefined;
  const { data: items, isLoading, error, refetch } = useCatalogItems(filters);

  // Subscribe to real-time image job updates
  useImageJobRealtime();

  const filteredItems = (items ?? []).filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleOpenImageWorkflow(item: CatalogItem) {
    setSelectedItem(item);
    setImageModalOpen(true);
  }

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
        <p className="text-muted-foreground">Erro ao carregar catálogo.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
        <p className="text-muted-foreground">
          Gerencie os produtos e suas imagens no cardápio.
        </p>
      </div>

      <Input
        placeholder="Buscar por nome ou categoria..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <CatalogItemCard
            key={item.id}
            item={item}
            onOpenImageWorkflow={handleOpenImageWorkflow}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado.
        </p>
      )}

      <ImageWorkflowModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        item={selectedItem}
      />
    </div>
  );
}
