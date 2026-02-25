import { Link2 } from "lucide-react";
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
  const isManuallyAdded = !account.token_expires_at && account.is_active;
  const isTokenExpired =
    account.token_expires_at &&
    new Date(account.token_expires_at) < new Date();

  function getBadge() {
    if (!account.is_active) {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-200"
        >
          Inativa
        </Badge>
      );
    }
    if (isManuallyAdded) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-200"
        >
          Manual
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-200"
      >
        Ativa
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{account.name}</CardTitle>
          {getBadge()}
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
          {!isManuallyAdded && (
            <p>
              <span className="font-medium">Token expira em:</span>{" "}
              <span className={cn(isTokenExpired && "text-red-600 font-medium")}>
                {formatDateTime(account.token_expires_at)}
                {isTokenExpired && " (expirado)"}
              </span>
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {isManuallyAdded ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Disponível após homologação da API iFood"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Conectar no iFood
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSync?.(account.id)}
          >
            Sincronizar
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDisconnect?.(account.id)}
        >
          {isManuallyAdded ? "Remover" : "Desconectar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
