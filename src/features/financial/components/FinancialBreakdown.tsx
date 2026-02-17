import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FinancialEntryType } from "@/entities/financial/model";

interface BreakdownItem {
  entryType: FinancialEntryType;
  total: number;
  count: number;
}

interface FinancialBreakdownProps {
  items: BreakdownItem[];
}

const entryTypeLabels: Record<FinancialEntryType, string> = {
  revenue: "Receita",
  fee: "Taxa",
  promotion: "Promoção",
  refund: "Reembolso",
  adjustment: "Ajuste",
  delivery_fee: "Taxa de Entrega",
  commission: "Comissão",
  other: "Outro",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FinancialBreakdown({ items }: FinancialBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalhamento por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.entryType}>
                <TableCell className="font-medium">
                  {entryTypeLabels[item.entryType]}
                </TableCell>
                <TableCell className="text-right">{item.count}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
