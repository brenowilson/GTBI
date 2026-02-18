import { Button } from "@/components/ui/button";
import { NoRestaurantSelected } from "@/components/common/NoRestaurantSelected";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { FunnelChart } from "../components/FunnelChart";
import { FunnelStepCard } from "../components/FunnelStepCard";
import { OperationalLimitsPanel } from "../components/OperationalLimitsPanel";
import { usePerformanceData } from "../hooks";

const STEP_LABELS: Record<string, string> = {
  visits: "Visitas",
  views: "Visualizações",
  to_cart: "Sacola",
  checkout: "Revisão",
  completed: "Concluídos",
};

const FUNNEL_KEYS = ["visits", "views", "to_cart", "checkout", "completed"] as const;

export function PerformancePage() {
  const { selectedRestaurant } = useRestaurantStore();
  const { data, isLoading, error, refetch } = usePerformanceData();

  if (!selectedRestaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">
            Acompanhe o funil de vendas e limites operacionais do restaurante selecionado.
          </p>
        </div>
        <NoRestaurantSelected />
      </div>
    );
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
        <p className="text-muted-foreground">Erro ao carregar dados de performance.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <p>Nenhum dado de performance encontrado.</p>
      </div>
    );
  }

  const { current, previous } = data;

  const funnelData = FUNNEL_KEYS.map((key) => ({
    step: STEP_LABELS[key] ?? key,
    current: current[key],
    previous: previous?.[key] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground">
          Acompanhe o funil de vendas e limites operacionais do restaurante selecionado.
        </p>
      </div>

      <FunnelChart data={funnelData} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {funnelData.map((item) => (
          <FunnelStepCard
            key={item.step}
            step={item.step}
            current={item.current}
            previous={item.previous}
          />
        ))}
      </div>

      <OperationalLimitsPanel
        cancellationRate={current.cancellation_rate}
        openTimeRate={current.open_time_rate}
        openTicketsRate={current.open_tickets_rate}
        newCustomersRate={current.new_customers_rate}
      />
    </div>
  );
}
