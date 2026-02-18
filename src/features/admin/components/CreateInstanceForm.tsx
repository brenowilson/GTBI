import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateInstanceFormProps {
  onCreate: (name: string) => void;
  isLoading: boolean;
}

export function CreateInstanceForm({ onCreate, isLoading }: CreateInstanceFormProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nova Instância WhatsApp</CardTitle>
        <CardDescription>
          Crie uma nova instância para conectar um número de WhatsApp ao sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="instance-name" className="sr-only">Nome da instância</Label>
            <Input
              id="instance-name"
              placeholder="Nome da instância (ex: GTBI Principal)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={!name.trim() || isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Criar
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
