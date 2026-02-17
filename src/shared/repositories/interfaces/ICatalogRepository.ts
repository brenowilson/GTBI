import type { CatalogItem } from "@/entities/catalog-item";

export interface CatalogFilters {
  categoryId?: string;
  isAvailable?: boolean;
  search?: string;
}

export interface CatalogCategory {
  id: string;
  restaurant_id: string;
  ifood_category_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ICatalogRepository {
  getItemsByRestaurant(restaurantId: string, filters?: CatalogFilters): Promise<CatalogItem[]>;
  getItemById(id: string): Promise<CatalogItem | null>;
  getCategoriesByRestaurant(restaurantId: string): Promise<CatalogCategory[]>;
  updateItem(id: string, data: Partial<Pick<CatalogItem, "name" | "description" | "price" | "image_url" | "is_available">>): Promise<CatalogItem>;
}
