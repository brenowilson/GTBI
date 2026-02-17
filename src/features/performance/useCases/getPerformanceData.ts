import { Result } from "@/domain/types/Result";
import { restaurantRepository } from "@/shared/repositories/supabase";
import { RestaurantRules } from "@/entities/restaurant";
import type { RestaurantSnapshot } from "@/entities/restaurant";

export interface PerformanceData {
  current: RestaurantSnapshot;
  previous: RestaurantSnapshot | null;
  comparison: { step: string; diff: number; percentage: number }[];
  alerts: string[];
  conversionRate: number;
}

export async function getPerformanceData(
  restaurantId: string,
): Promise<Result<PerformanceData>> {
  try {
    const snapshots = await restaurantRepository.getSnapshots(restaurantId);

    if (snapshots.length === 0) {
      return Result.fail(new Error("No performance data available for this restaurant"));
    }

    const sorted = [...snapshots].sort(
      (a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime(),
    );

    const current = sorted[0]!;
    const previous = sorted.length > 1 ? sorted[1]! : null;

    const comparison = previous
      ? RestaurantRules.compareSnapshots(current, previous)
      : [];

    const alerts = RestaurantRules.getAlerts(current);
    const conversionRate = RestaurantRules.calculateConversionRate(current);

    return Result.ok({
      current,
      previous,
      comparison,
      alerts,
      conversionRate,
    });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to load performance data"),
    );
  }
}
