import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertBadge } from "./AlertBadge";

interface OperationalLimitsPanelProps {
  cancellationRate: number;
  openTimeRate: number;
  openTicketsRate: number;
  newCustomersRate: number;
}

type AlertType = "success" | "warning" | "danger";

function getCancellationAlert(rate: number): AlertType {
  if (rate > 2) return "danger";
  if (rate > 1) return "warning";
  return "success";
}

function getOpenTimeAlert(rate: number): AlertType {
  if (rate < 95) return "danger";
  if (rate < 98) return "warning";
  return "success";
}

function getOpenTicketsAlert(rate: number): AlertType {
  if (rate > 3) return "danger";
  if (rate > 2) return "warning";
  return "success";
}

function getNewCustomersAlert(rate: number): AlertType {
  if (rate > 90 || rate < 10) return "warning";
  return "success";
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function OperationalLimitsPanel({
  cancellationRate,
  openTimeRate,
  openTicketsRate,
  newCustomersRate,
}: OperationalLimitsPanelProps) {
  const metrics = [
    {
      label: "Taxa de Cancelamento",
      value: cancellationRate,
      getAlert: getCancellationAlert,
      description: "Ideal: abaixo de 2%",
    },
    {
      label: "Tempo de Abertura",
      value: openTimeRate,
      getAlert: getOpenTimeAlert,
      description: "Ideal: acima de 95%",
    },
    {
      label: "Chamados Abertos",
      value: openTicketsRate,
      getAlert: getOpenTicketsAlert,
      description: "Ideal: abaixo de 3%",
    },
    {
      label: "Clientes Novos",
      value: newCustomersRate,
      getAlert: getNewCustomersAlert,
      description: "Atenção: acima de 90% ou abaixo de 10%",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limites Operacionais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {formatPercentage(metric.value)}
                </span>
                <AlertBadge
                  type={metric.getAlert(metric.value)}
                  label={
                    metric.getAlert(metric.value) === "success"
                      ? "OK"
                      : metric.getAlert(metric.value) === "warning"
                        ? "Atenção"
                        : "Crítico"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
