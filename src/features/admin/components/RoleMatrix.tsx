import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2, Shield } from "lucide-react";
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
import {
  useUserRoles,
  useRolePermissions,
  useFeatures,
  useCreateRole,
  useDeleteRole,
  useTogglePermission,
} from "../hooks";

const FEATURE_LABELS: Record<string, string> = {
  users: "Usuarios / Admin",
  restaurants: "Restaurantes",
  reports: "Relatorios",
  reviews: "Avaliacoes",
  tickets: "Chamados",
  financial: "Financeiro",
  catalog: "Cardapio",
};

const CRUD_LABELS = [
  { key: "create", label: "Criar" },
  { key: "read", label: "Ler" },
  { key: "update", label: "Editar" },
  { key: "delete", label: "Excluir" },
] as const;

export function RoleMatrix() {
  const [newRoleName, setNewRoleName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: permissions, isLoading: permsLoading } = useRolePermissions();
  const { data: features, isLoading: featuresLoading } = useFeatures();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const togglePermission = useTogglePermission();

  const isLoading = rolesLoading || permsLoading || featuresLoading;

  function hasPermission(roleId: string, featureCode: string, action: string): boolean {
    return (permissions ?? []).some(
      (p) => p.role_id === roleId && p.feature_code === featureCode && p.action === action,
    );
  }

  function handleToggle(roleId: string, featureCode: string, action: string, currentValue: boolean) {
    togglePermission.mutate({
      roleId,
      featureCode,
      action,
      granted: !currentValue,
    });
  }

  function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    createRole.mutate(
      { name: newRoleName.trim(), description: "" },
      { onSuccess: () => { setNewRoleName(""); setShowCreateForm(false); } },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const featureList = features ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Roles e Permissoes</h3>
        {!showCreateForm && (
          <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nova Role
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreateRole} className="flex gap-3">
              <Input
                placeholder="Nome da role (ex: Gerente)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                disabled={createRole.isPending}
                className="flex-1"
              />
              <Button type="submit" disabled={!newRoleName.trim() || createRole.isPending}>
                {createRole.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Criar"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowCreateForm(false); setNewRoleName(""); }}
              >
                Cancelar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(roles ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Shield className="h-8 w-8" />
          <p>Nenhuma role configurada.</p>
        </div>
      ) : (
        (roles ?? []).map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {role.name}
                {role.is_system && (
                  <Badge variant="secondary">Sistema</Badge>
                )}
              </CardTitle>
              {!role.is_system && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deleteRole.mutate(role.id)}
                  disabled={deleteRole.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Funcionalidade</TableHead>
                      {CRUD_LABELS.map(({ key, label }) => (
                        <TableHead key={key} className="text-center w-20">
                          {label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureList.map((feature) => (
                      <TableRow key={feature.code}>
                        <TableCell className="font-medium">
                          {FEATURE_LABELS[feature.code] ?? feature.name}
                        </TableCell>
                        {CRUD_LABELS.map(({ key }) => {
                          const checked = hasPermission(role.id, feature.code, key);
                          return (
                            <TableCell key={key} className="text-center">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  handleToggle(role.id, feature.code, key, checked)
                                }
                                disabled={role.is_system && role.name === "admin"}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
