import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminStats {
  totalUsers: number;
  totalAccounts: number;
  totalRestaurants: number;
  totalReports: number;
}

interface AdminDashboardProps {
  stats: AdminStats;
}

const statItems: { key: keyof AdminStats; label: string }[] = [
  { key: "totalUsers", label: "Usuários" },
  { key: "totalAccounts", label: "Contas iFood" },
  { key: "totalRestaurants", label: "Restaurantes" },
  { key: "totalReports", label: "Relatórios" },
];

export function AdminDashboard({ stats }: AdminDashboardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats[item.key].toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
