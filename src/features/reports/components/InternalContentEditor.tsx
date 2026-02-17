import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InternalContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function InternalContentEditor({
  content,
  onChange,
  onSave,
}: InternalContentEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notas Internas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Adicione notas internas sobre este relatório..."
          value={content}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
        />
        <Button onClick={onSave} size="sm">
          Salvar notas
        </Button>
      </CardContent>
    </Card>
  );
}
