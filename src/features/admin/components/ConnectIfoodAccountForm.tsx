import { useState } from "react";
import { Copy, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
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
import { useRequestIfoodCode, useConnectIfoodAccount } from "../hooks";
import { useToast } from "@/shared/hooks/use-toast";

type Step = "form" | "code" | "done";

export function ConnectIfoodAccountForm() {
  const { toast } = useToast();
  const requestCode = useRequestIfoodCode();
  const connectAccount = useConnectIfoodAccount();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [userCode, setUserCode] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [verifier, setVerifier] = useState("");
  const [copied, setCopied] = useState(false);

  const isValid = name.trim().length > 0 && merchantId.trim().length > 0;

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const result = await requestCode.mutateAsync();
    if (result.success) {
      setUserCode(result.data.userCode);
      setVerificationUrl(result.data.verificationUrl);
      setVerifier(result.data.authorizationCodeVerifier);
      setStep("code");
    }
  }

  async function handleAuthorize() {
    const result = await connectAccount.mutateAsync({
      name: name.trim(),
      merchant_id: merchantId.trim(),
      authorization_code_verifier: verifier,
    });

    if (result.success) {
      setStep("done");
      setName("");
      setMerchantId("");
      setUserCode("");
      setVerifier("");
      // Reset to form after 3 seconds
      setTimeout(() => setStep("form"), 3000);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    toast({ title: "Codigo copiado!" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCancel() {
    setStep("form");
    setUserCode("");
    setVerifier("");
  }

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold">Conta conectada com sucesso!</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "code") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autorizar no iFood</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Acesse o portal iFood e insira o codigo abaixo para autorizar a conexao:
          </p>

          <div className="flex items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-muted/50 p-6">
            <span className="font-mono text-3xl font-bold tracking-widest">
              {userCode}
            </span>
            <Button variant="ghost" size="icon" onClick={handleCopyCode}>
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(verificationUrl, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Portal iFood
          </Button>

          <Alert>
            <AlertDescription>
              Apos inserir o codigo no portal, clique em "Confirmar Autorizacao" abaixo.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleAuthorize}
              disabled={connectAccount.isPending}
            >
              {connectAccount.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Confirmar Autorizacao"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={connectAccount.isPending}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conectar Conta iFood</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ifood-name">Nome da conta</Label>
            <Input
              id="ifood-name"
              placeholder="Ex: Restaurante Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={requestCode.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifood-merchant-id">Merchant ID</Label>
            <Input
              id="ifood-merchant-id"
              placeholder="Identificador do merchant no iFood"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={requestCode.isPending}
            />
          </div>

          <Button type="submit" disabled={!isValid || requestCode.isPending}>
            {requestCode.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Solicitando codigo...
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
