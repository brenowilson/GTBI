import { useState } from "react";
import { Loader2, ImageIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScreenshotUpload } from "./ScreenshotUpload";
import { useUploadScreenshots, useGenerateReportFromScreenshots } from "../hooks";
import { useIfoodAccounts } from "@/features/admin/hooks";

interface CreateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "configure" | "generating";

function getDefaultWeekDates(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekStart: monday.toISOString().split("T")[0] ?? "",
    weekEnd: sunday.toISOString().split("T")[0] ?? "",
  };
}

export function CreateReportModal({ open, onOpenChange }: CreateReportModalProps) {
  const defaults = getDefaultWeekDates();

  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [weekStart, setWeekStart] = useState(defaults.weekStart);
  const [weekEnd, setWeekEnd] = useState(defaults.weekEnd);

  const uploadScreenshots = useUploadScreenshots();
  const generateReport = useGenerateReportFromScreenshots();
  const { data: accounts } = useIfoodAccounts();

  function handleClose() {
    if (step === "generating") return;
    setStep("upload");
    setFiles([]);
    setSelectedAccountId("");
    setWeekStart(defaults.weekStart);
    setWeekEnd(defaults.weekEnd);
    onOpenChange(false);
  }

  async function handleGenerate() {
    setStep("generating");

    try {
      const uploaded = await uploadScreenshots.mutateAsync(files);
      const paths = uploaded.map((u) => u.path);

      const result = await generateReport.mutateAsync({
        screenshotPaths: paths,
        ifoodAccountId: selectedAccountId || undefined,
        weekStart,
        weekEnd,
      });

      if (result.success) {
        handleClose();
      } else {
        setStep("configure");
      }
    } catch {
      setStep("configure");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Adicionar Relatório
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Faça upload das capturas de tela do painel de desempenho do iFood."}
            {step === "configure" && "Configure os detalhes do relatório."}
            {step === "generating" && "Gerando relatório a partir das capturas de tela..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <ScreenshotUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={12}
            />
            <div className="flex justify-end">
              <Button
                disabled={files.length === 0}
                onClick={() => setStep("configure")}
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                {files.length} captura{files.length !== 1 ? "s" : ""} de tela selecionada{files.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conta iFood (opcional)</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {(accounts ?? []).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.merchant_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="week-start">Início da semana</Label>
                <Input
                  id="week-start"
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="week-end">Fim da semana</Label>
                <Input
                  id="week-end"
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button onClick={handleGenerate}>
                Gerar Relatório
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Gerando relatório...</p>
              <p className="text-sm text-muted-foreground">
                As capturas de tela estão sendo analisadas pela IA para extrair os dados de desempenho.
                Isso pode levar alguns minutos.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
