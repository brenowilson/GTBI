import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ConnectIfoodAccountInput } from "@/entities/ifood-account";

interface ConnectIfoodAccountFormProps {
  onConnect: (data: ConnectIfoodAccountInput) => void;
  isLoading?: boolean;
}

export function ConnectIfoodAccountForm({
  onConnect,
  isLoading = false,
}: ConnectIfoodAccountFormProps) {
  const [name, setName] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const isValid =
    name.trim().length > 0 &&
    merchantId.trim().length > 0 &&
    clientId.trim().length > 0 &&
    clientSecret.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isLoading) return;

    onConnect({
      name: name.trim(),
      merchant_id: merchantId.trim(),
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
    });

    setName("");
    setMerchantId("");
    setClientId("");
    setClientSecret("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conectar Conta iFood</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Obtenha as credenciais no{" "}
              <a
                href="https://developer.ifood.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Portal do Desenvolvedor iFood
              </a>{" "}
              (developer.ifood.com.br).
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="ifood-name">Nome da conta</Label>
            <Input
              id="ifood-name"
              placeholder="Ex: Restaurante Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifood-merchant-id">Merchant ID</Label>
            <Input
              id="ifood-merchant-id"
              placeholder="Identificador do merchant no iFood"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifood-client-id">Client ID</Label>
            <Input
              id="ifood-client-id"
              placeholder="Client ID da API iFood"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifood-client-secret">Client Secret</Label>
            <Input
              id="ifood-client-secret"
              type="password"
              placeholder="Client Secret da API iFood"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
