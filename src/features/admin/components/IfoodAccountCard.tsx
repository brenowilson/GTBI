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
import type { IfoodAccount } from "@/entities/ifood-account/model";

interface IfoodAccountCardProps {
  account: IfoodAccount;
  onSync?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "Nunca";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function IfoodAccountCard({
  account,
  onSync,
  onDisconnect,
}: IfoodAccountCardProps) {
  const isTokenExpired =
    account.token_expires_at &&
    new Date(account.token_expires_at) < new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{account.name}</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              account.is_active
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {account.is_active ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-3">
        <div className="text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Merchant ID:</span>{" "}
            {account.merchant_id}
          </p>
          <p>
            <span className="font-medium">Última sincronização:</span>{" "}
            {formatDateTime(account.last_sync_at)}
          </p>
          <p>
            <span className="font-medium">Token expira em:</span>{" "}
            <span className={cn(isTokenExpired && "text-red-600 font-medium")}>
              {formatDateTime(account.token_expires_at)}
              {isTokenExpired && " (expirado)"}
            </span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSync?.(account.id)}
        >
          Sincronizar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDisconnect?.(account.id)}
        >
          Desconectar
        </Button>
      </CardFooter>
    </Card>
  );
}
