import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CatalogItemCard } from "../components/CatalogItemCard";
import { ImageWorkflowModal } from "../components/ImageWorkflowModal";
import type { CatalogItem } from "@/entities/catalog-item/model";

const mockItems: CatalogItem[] = [
  {
    id: "cat-1",
    restaurant_id: "r1",
    ifood_item_id: "ifood-1",
    category_id: "c1",
    category_name: "Pratos Principais",
    name: "X-Burguer Especial",
    description: "Hambúrguer artesanal com queijo cheddar, bacon e molho especial",
    price: 32.9,
    image_url: null,
    is_available: true,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-02-10T14:30:00Z",
  },
  {
    id: "cat-2",
    restaurant_id: "r1",
    ifood_item_id: "ifood-2",
    category_id: "c1",
    category_name: "Pratos Principais",
    name: "Pizza Margherita",
    description: "Pizza tradicional com molho de tomate, mussarela e manjericão",
    price: 45.0,
    image_url: null,
    is_available: true,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-02-10T14:30:00Z",
  },
  {
    id: "cat-3",
    restaurant_id: "r1",
    ifood_item_id: "ifood-3",
    category_id: "c2",
    category_name: "Bebidas",
    name: "Suco Natural de Laranja",
    description: "Suco natural feito na hora, 500ml",
    price: 12.0,
    image_url: null,
    is_available: false,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-02-10T14:30:00Z",
  },
  {
    id: "cat-4",
    restaurant_id: "r1",
    ifood_item_id: "ifood-4",
    category_id: "c3",
    category_name: "Sobremesas",
    name: "Petit Gâteau",
    description: "Bolo quente de chocolate com sorvete de creme",
    price: 22.5,
    image_url: null,
    is_available: true,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-02-10T14:30:00Z",
  },
];

export function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const filteredItems = mockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleOpenImageWorkflow(item: CatalogItem) {
    setSelectedItem(item);
    setImageModalOpen(true);
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
