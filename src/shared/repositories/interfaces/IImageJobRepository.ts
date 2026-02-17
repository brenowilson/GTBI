import type { ImageJob, ImageJobStatus, CreateImageJobInput } from "@/entities/image-job";

export interface ImageJobFilters {
  status?: ImageJobStatus;
  catalogItemId?: string;
}

export interface IImageJobRepository {
  getByRestaurant(restaurantId: string, filters?: ImageJobFilters): Promise<ImageJob[]>;
  getById(id: string): Promise<ImageJob | null>;
  create(restaurantId: string, data: CreateImageJobInput): Promise<ImageJob>;
  approve(id: string): Promise<ImageJob>;
  reject(id: string): Promise<ImageJob>;
  applyToCatalog(id: string): Promise<void>;
}
