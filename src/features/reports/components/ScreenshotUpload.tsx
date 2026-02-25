import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenshotUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ScreenshotUpload({
  files,
  onFilesChange,
  maxFiles = 12,
  disabled = false,
}: ScreenshotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const valid = newFiles.filter((f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) return false;
        if (f.size > MAX_FILE_SIZE) return false;
        return true;
      });

      const remaining = maxFiles - files.length;
      const toAdd = valid.slice(0, remaining);
      if (toAdd.length > 0) {
        onFilesChange([...files, ...toAdd]);
      }
    },
    [files, maxFiles, onFilesChange],
  );

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  }

  // Generate previews
  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const file of files) {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!previews[key]) {
        urls[key] = URL.createObjectURL(file);
      }
    }

    if (Object.keys(urls).length > 0) {
      setPreviews((prev) => ({ ...prev, ...urls }));
    }

    return () => {
      for (const url of Object.values(urls)) {
        URL.revokeObjectURL(url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Clipboard paste
  useEffect(() => {
    if (disabled) return;

    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [disabled, addFiles]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
    if (inputRef.current) inputRef.current.value = "";
  }

  function getPreviewUrl(file: File): string | undefined {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    return previews[key];
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        className={`
          flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8
          transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            Arraste capturas de tela aqui
          </p>
          <p className="text-xs text-muted-foreground">
            ou clique para selecionar, ou cole da área de transferência (Ctrl+V)
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG ou WebP - máx. 10MB por arquivo ({files.length}/{maxFiles})
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {files.map((file, index) => {
            const url = getPreviewUrl(file);
            return (
              <div
                key={`${file.name}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
              >
                {url ? (
                  <img
                    src={url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {!disabled && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
