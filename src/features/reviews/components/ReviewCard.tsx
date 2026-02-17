import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";

interface ReviewCardProps {
  review: {
    rating: number;
    comment: string | null;
    customerName: string | null;
    date: string;
    response: string | null;
    responseStatus: "pending" | "sent" | "failed" | null;
  };
}

const responseStatusLabels: Record<string, string> = {
  pending: "Pendente",
  sent: "Enviada",
  failed: "Falha",
};

const responseStatusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sent: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {review.customerName ?? "Cliente anônimo"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatDate(review.date)}
            </p>
          </div>
          <StarRating rating={review.rating} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {review.comment && (
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        )}

        {review.response && (
          <div className="rounded-lg bg-muted p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium">Resposta</p>
              {review.responseStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    responseStatusStyles[review.responseStatus]
                  )}
                >
                  {responseStatusLabels[review.responseStatus]}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{review.response}</p>
          </div>
        )}

        {!review.response && (
          <p className="text-xs italic text-muted-foreground">
            Sem resposta ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
}
