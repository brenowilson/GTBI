export interface ChecklistItem {
  id: string;
  report_id: string | null;
  restaurant_id: string | null;
  week_start: string | null;
  title: string;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
}

export interface ChecklistFilters {
  reportId?: string;
  weekStart?: string;
  isChecked?: boolean;
}

export interface IChecklistRepository {
  getByRestaurant(restaurantId: string, filters?: ChecklistFilters): Promise<ChecklistItem[]>;
  getById(id: string): Promise<ChecklistItem | null>;
  toggleCheck(id: string, isChecked: boolean): Promise<ChecklistItem>;
}
