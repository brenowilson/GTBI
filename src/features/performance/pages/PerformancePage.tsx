import { FunnelChart } from "../components/FunnelChart";
import { FunnelStepCard } from "../components/FunnelStepCard";
import { OperationalLimitsPanel } from "../components/OperationalLimitsPanel";

const mockFunnelData = [
  { step: "Visitas", current: 12500, previous: 11800 },
  { step: "Visualizações", current: 8200, previous: 7900 },
  { step: "Sacola", current: 3100, previous: 2850 },
  { step: "Revisão", current: 2400, previous: 2200 },
  { step: "Concluídos", current: 1800, previous: 1650 },
];

const mockOperationalLimits = {
  cancellationRate: 1.8,
  openTimeRate: 96.5,
  openTicketsRate: 2.1,
  newCustomersRate: 35.2,
};

export function PerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground">
          Acompanhe o funil de vendas e limites operacionais do seu restaurante.
        </p>
      </div>

      <FunnelChart data={mockFunnelData} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {mockFunnelData.map((item) => (
          <FunnelStepCard
            key={item.step}
            step={item.step}
            current={item.current}
            previous={item.previous}
          />
        ))}
      </div>

      <OperationalLimitsPanel
        cancellationRate={mockOperationalLimits.cancellationRate}
        openTimeRate={mockOperationalLimits.openTimeRate}
        openTicketsRate={mockOperationalLimits.openTicketsRate}
        newCustomersRate={mockOperationalLimits.newCustomersRate}
      />
    </div>
  );
}
