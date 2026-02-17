import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  timestamp: string;
}

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const filteredLogs = logs.filter((log) => {
    const matchesUser =
      userFilter.length === 0 ||
      log.user.toLowerCase().includes(userFilter.toLowerCase());
    const matchesAction =
      actionFilter === "all" || log.action === actionFilter;
    return matchesUser && matchesAction;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Logs de Auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label htmlFor="audit-user-filter">Usuário</Label>
            <Input
              id="audit-user-filter"
              placeholder="Filtrar por usuário..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-action-filter">Ação</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="audit-action-filter" className="w-[200px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell>{formatDateTime(log.timestamp)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredLogs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum log encontrado com os filtros selecionados.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
