import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";

interface EvidenceUploadProps {
  onUpload: (files: File[]) => void;
}

export function EvidenceUpload({ onUpload }: EvidenceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload de Evidências</CardTitle>
      </CardHeader>
      <CardContent>
        <label
          htmlFor="evidence-file-input"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg
            className="mb-3 h-10 w-10 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, PDF ou DOC (max. 10MB)
          </p>
          <input
            id="evidence-file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
          />
        </label>
      </CardContent>
    </Card>
  );
}
