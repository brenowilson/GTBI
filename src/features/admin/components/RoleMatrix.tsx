import { Checkbox } from "@/components/ui/checkbox";
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

interface RoleItem {
  id: string;
  name: string;
}

interface FeatureItem {
  id: string;
  name: string;
}

interface PermissionEntry {
  roleId: string;
  featureId: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface RoleMatrixProps {
  roles: RoleItem[];
  features: FeatureItem[];
  permissions: PermissionEntry[];
  onToggle?: (
    roleId: string,
    featureId: string,
    action: "create" | "read" | "update" | "delete",
    value: boolean
  ) => void;
}

const crudLabels = ["Criar", "Ler", "Editar", "Excluir"] as const;
const crudKeys = ["create", "read", "update", "delete"] as const;

export function RoleMatrix({
  roles,
  features,
  permissions,
  onToggle,
}: RoleMatrixProps) {
  function getPermission(
    roleId: string,
    featureId: string
  ): PermissionEntry | undefined {
    return permissions.find(
      (p) => p.roleId === roleId && p.featureId === featureId
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz de Permissões</CardTitle>
      </CardHeader>
      <CardContent>
        {roles.map((role) => (
          <div key={role.id} className="mb-6">
            <h4 className="mb-2 text-sm font-semibold">{role.name}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionalidade</TableHead>
                  {crudLabels.map((label) => (
                    <TableHead key={label} className="text-center">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => {
                  const perm = getPermission(role.id, feature.id);
                  return (
                    <TableRow key={feature.id}>
                      <TableCell className="font-medium">
                        {feature.name}
                      </TableCell>
                      {crudKeys.map((action) => (
                        <TableCell key={action} className="text-center">
                          <Checkbox
                            checked={perm?.[action] ?? false}
                            onCheckedChange={(checked) =>
                              onToggle?.(
                                role.id,
                                feature.id,
                                action,
                                checked === true
                              )
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
