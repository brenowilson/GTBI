import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";
import type { ReportStatus } from "@/entities/report/model";

interface ReportCardProps {
  report: {
    id: string;
    restaurantName: string;
    weekStart: string;
    weekEnd: string;
    status: ReportStatus;
    generatedAt: string;
  };
  onView?: (id: string) => void;
  onSend?: (id: string) => void;
}

const statusLabels: Record<ReportStatus, string> = {
  generated: "Gerado",
  sending: "Enviando",
  sent: "Enviado",
  failed: "Falha",
};

const statusStyles: Record<ReportStatus, string> = {
  generated: "bg-blue-100 text-blue-800 border-blue-200",
  sending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sent: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReportCard({ report, onView, onSend }: ReportCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{report.restaurantName}</CardTitle>
          <Badge
            variant="outline"
            className={cn(statusStyles[report.status])}
          >
            {statusLabels[report.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Período: {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
          </p>
          <p>Gerado em: {formatDate(report.generatedAt)}</p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={() => onView?.(report.id)}>
          Ver detalhes
        </Button>
        {report.status === "generated" && (
          <Button size="sm" onClick={() => onSend?.(report.id)}>
            Enviar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
