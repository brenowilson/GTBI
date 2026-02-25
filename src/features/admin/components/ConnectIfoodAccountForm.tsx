import { Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ConnectIfoodAccountForm() {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Conectar via OAuth</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Em breve
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          A conexão automática via API do iFood estará disponível após a
          conclusão da homologação. Enquanto isso, utilize o formulário
          &quot;Adicionar Conta iFood&quot; acima para cadastrar contas
          manualmente.
        </p>
      </CardContent>
    </Card>
  );
}
