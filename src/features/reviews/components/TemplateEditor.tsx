import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface TemplateEditorProps {
  template: string;
  onChange: (template: string) => void;
  onSave: () => void;
  placeholders: string[];
}

export function TemplateEditor({
  template,
  onChange,
  onSave,
  placeholders,
}: TemplateEditorProps) {
  function handleInsertPlaceholder(placeholder: string) {
    onChange(template + `{${placeholder}}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Template de Resposta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Placeholders disponíveis (clique para inserir):
          </p>
          <div className="flex flex-wrap gap-1">
            {placeholders.map((placeholder) => (
              <Badge
                key={placeholder}
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleInsertPlaceholder(placeholder)}
              >
                {`{${placeholder}}`}
              </Badge>
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Digite o template de resposta..."
          value={template}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
        />

        <Button onClick={onSave} size="sm">
          Salvar template
        </Button>
      </CardContent>
    </Card>
  );
}
