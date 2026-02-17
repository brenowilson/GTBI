import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  onExport: (format: "csv" | "xls") => void;
}

export function ExportButtons({ onExport }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
        Exportar CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => onExport("xls")}>
        Exportar XLS
      </Button>
    </div>
  );
}
