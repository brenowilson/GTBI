import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CatalogItem } from "@/entities/catalog-item/model";

interface ImageWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CatalogItem | null;
}

export function ImageWorkflowModal({
  open,
  onOpenChange,
  item,
}: ImageWorkflowModalProps) {
  const [_prompt, setPrompt] = useState("");
  const [_description, setDescription] = useState("");

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Imagem - {item.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="improve" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="improve" className="text-xs">
              Melhorar atual
            </TabsTrigger>
            <TabsTrigger value="from-image" className="text-xs">
              De imagem
            </TabsTrigger>
            <TabsTrigger value="from-description" className="text-xs">
              Da descrição
            </TabsTrigger>
            <TabsTrigger value="new-description" className="text-xs">
              Nova descrição
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs">
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="improve" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Melhora a imagem existente usando IA para aumentar a qualidade e
              apelo visual.
            </p>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Este item não possui imagem atual.
              </p>
            )}
            <Button disabled={!item.image_url}>Gerar melhoria</Button>
          </TabsContent>

          <TabsContent value="from-image" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gera uma nova imagem a partir de uma imagem de referência.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reference-image">Imagem de referência</Label>
              <Input id="reference-image" type="file" accept="image/*" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-image-prompt">
                Instruções adicionais (opcional)
              </Label>
              <Textarea
                id="from-image-prompt"
                placeholder="Ex: Gerar uma versão mais profissional..."
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>
            <Button>Gerar imagem</Button>
          </TabsContent>

          <TabsContent value="from-description" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gera uma imagem baseada na descrição atual do produto.
            </p>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm">
                {item.description ?? "Sem descrição cadastrada."}
              </p>
            </div>
            <Button disabled={!item.description}>
              Gerar a partir da descrição
            </Button>
          </TabsContent>

          <TabsContent value="new-description" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escreva uma nova descrição para gerar a imagem.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-desc">Nova descrição</Label>
              <Textarea
                id="new-desc"
                placeholder="Descreva como a imagem do produto deve ser..."
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Button>Gerar com nova descrição</Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça upload direto de uma imagem para o produto.
            </p>
            <div className="space-y-2">
              <Label htmlFor="direct-upload">Selecionar arquivo</Label>
              <Input
                id="direct-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
            </div>
            <Button>Enviar imagem</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
