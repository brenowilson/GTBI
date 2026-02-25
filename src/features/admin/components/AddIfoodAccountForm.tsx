import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAddIfoodAccountManually } from "../hooks";

export function AddIfoodAccountForm() {
  const addAccount = useAddIfoodAccountManually();

  const [name, setName] = useState("");
  const [merchantId, setMerchantId] = useState("");

  const isValid = name.trim().length > 0 && merchantId.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const result = await addAccount.mutateAsync({
      name: name.trim(),
      merchant_id: merchantId.trim(),
    });

    if (result.success) {
      setName("");
      setMerchantId("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adicionar Conta iFood</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-ifood-name">Nome da conta</Label>
            <Input
              id="add-ifood-name"
              placeholder="Ex: Restaurante Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={addAccount.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-ifood-merchant-id">Merchant ID</Label>
            <Input
              id="add-ifood-merchant-id"
              placeholder="Identificador do merchant no iFood"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              disabled={addAccount.isPending}
            />
          </div>

          <Button type="submit" disabled={!isValid || addAccount.isPending}>
            {addAccount.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Conta
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
