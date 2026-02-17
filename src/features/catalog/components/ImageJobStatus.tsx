import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/shared/lib/cn";
import type { ImageJob, ImageJobStatus as ImageJobStatusType } from "@/entities/image-job/model";

interface ImageJobStatusProps {
  job: ImageJob;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
}

const statusLabels: Record<ImageJobStatusType, string> = {
  generating: "Gerando",
  ready_for_approval: "Aguardando aprovação",
  approved: "Aprovada",
  applied_to_catalog: "Aplicada ao catálogo",
  rejected: "Rejeitada",
  archived: "Arquivada",
  failed: "Falha",
};

const statusStyles: Record<ImageJobStatusType, string> = {
  generating: "bg-blue-100 text-blue-800 border-blue-200",
  ready_for_approval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  applied_to_catalog: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  archived: "bg-gray-100 text-gray-800 border-gray-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

function getProgressValue(status: ImageJobStatusType): number {
  const progressMap: Record<ImageJobStatusType, number> = {
    generating: 30,
    ready_for_approval: 60,
    approved: 80,
    applied_to_catalog: 100,
    rejected: 100,
    archived: 100,
    failed: 100,
  };
  return progressMap[status];
}

export function ImageJobStatus({ job, onApprove, onReject }: ImageJobStatusProps) {
  const isReadyForApproval = job.status === "ready_for_approval";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm">Job #{job.id.slice(0, 8)}</CardTitle>
          <Badge
            variant="outline"
            className={cn(statusStyles[job.status])}
          >
            {statusLabels[job.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <Progress value={getProgressValue(job.status)} />

        {job.generated_image_url && (
          <img
            src={job.generated_image_url}
            alt="Imagem gerada"
            className="h-32 w-32 rounded-lg object-cover"
          />
        )}

        {job.error_message && (
          <p className="text-xs text-red-600">{job.error_message}</p>
        )}
      </CardContent>
      {isReadyForApproval && (
        <CardFooter className="gap-2">
          <Button size="sm" onClick={() => onApprove?.(job.id)}>
            Aprovar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(job.id)}
          >
            Rejeitar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
