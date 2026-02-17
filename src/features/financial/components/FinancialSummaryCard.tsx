import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FinancialSummaryCardProps {
  totalPositive: number;
  totalNegative: number;
  net: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FinancialSummaryCard({
  totalPositive,
  totalNegative,
  net,
}: FinancialSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Receitas</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPositive)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Despesas</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalNegative)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Saldo Líquido</p>
            <p className="text-2xl font-bold">
              {formatCurrency(net)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
