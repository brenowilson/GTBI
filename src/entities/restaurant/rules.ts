import type { RestaurantSnapshot } from "./model";

export const RestaurantRules = {
  CANCELLATION_THRESHOLD: 0.02,
  OPEN_TIME_THRESHOLD: 0.95,
  OPEN_TICKETS_THRESHOLD: 0.03,
  NEW_CUSTOMERS_HIGH: 0.9,
  NEW_CUSTOMERS_LOW: 0.1,

  hasHighCancellation(snapshot: RestaurantSnapshot): boolean {
    return snapshot.cancellation_rate > this.CANCELLATION_THRESHOLD;
  },

  hasLowOpenTime(snapshot: RestaurantSnapshot): boolean {
    return snapshot.open_time_rate < this.OPEN_TIME_THRESHOLD;
  },

  hasHighOpenTickets(snapshot: RestaurantSnapshot): boolean {
    return snapshot.open_tickets_rate > this.OPEN_TICKETS_THRESHOLD;
  },

  hasUnbalancedCustomers(snapshot: RestaurantSnapshot): boolean {
    return (
      snapshot.new_customers_rate > this.NEW_CUSTOMERS_HIGH ||
      snapshot.new_customers_rate < this.NEW_CUSTOMERS_LOW
    );
  },

  getAlerts(snapshot: RestaurantSnapshot): string[] {
    const alerts: string[] = [];
    if (this.hasHighCancellation(snapshot)) {
      alerts.push(`Taxa de cancelamento acima de ${this.CANCELLATION_THRESHOLD * 100}%`);
    }
    if (this.hasLowOpenTime(snapshot)) {
      alerts.push(`Tempo aberto abaixo de ${this.OPEN_TIME_THRESHOLD * 100}%`);
    }
    if (this.hasHighOpenTickets(snapshot)) {
      alerts.push(`Chamados abertos acima de ${this.OPEN_TICKETS_THRESHOLD * 100}%`);
    }
    if (this.hasUnbalancedCustomers(snapshot)) {
      alerts.push("Proporção de clientes novos/recorrentes desbalanceada");
    }
    return alerts;
  },

  calculateConversionRate(snapshot: RestaurantSnapshot): number {
    if (snapshot.visits === 0) return 0;
    return snapshot.completed / snapshot.visits;
  },

  compareSnapshots(
    current: RestaurantSnapshot,
    previous: RestaurantSnapshot
  ): { step: string; diff: number; percentage: number }[] {
    const steps = [
      { step: "visits", current: current.visits, previous: previous.visits },
      { step: "views", current: current.views, previous: previous.views },
      { step: "to_cart", current: current.to_cart, previous: previous.to_cart },
      { step: "checkout", current: current.checkout, previous: previous.checkout },
      { step: "completed", current: current.completed, previous: previous.completed },
    ];

    return steps.map(({ step, current: cur, previous: prev }) => ({
      step,
      diff: cur - prev,
      percentage: prev === 0 ? 0 : ((cur - prev) / prev) * 100,
    }));
  },
};
