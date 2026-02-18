import { useState, useCallback, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus, Loader2, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useUserRoles,
  useRolePermissions,
  useFeatures,
  useCreateRole,
  useDeleteRole,
  useTogglePermission,
} from "../hooks";
import { useToast } from "@/shared/hooks/use-toast";
import type { UserRole } from "@/entities/user";
import type { RolePermissionEntry } from "@/shared/repositories/interfaces";

// ---------------------------------------------------------------------------
// Constants: feature display names, CRUD labels, and per-feature descriptions
// ---------------------------------------------------------------------------

const FEATURE_LABELS: Record<string, string> = {
  reports: "Relatorios",
  reviews: "Avaliacoes",
  tickets: "Chamados",
  financial: "Financeiro",
  catalog: "Catalogo",
  restaurants: "Restaurantes",
  users: "Usuarios",
};

const FEATURE_ORDER = [
  "reports",
  "reviews",
  "tickets",
  "financial",
  "catalog",
  "restaurants",
  "users",
];

const CRUD_ACTIONS = ["create", "read", "update", "delete"] as const;
type CrudAction = (typeof CRUD_ACTIONS)[number];

const CRUD_LABELS: Record<CrudAction, string> = {
  create: "Criacao",
  read: "Leitura",
  update: "Edicao",
  delete: "Exclusao",
};

interface ActionDescription {
  label: string;
  disabled?: boolean;
}

const FEATURE_ACTION_DESCRIPTIONS: Record<
  string,
  Record<CrudAction, ActionDescription>
> = {
  reports: {
    create: { label: "Gerar relatorios semanais" },
    read: { label: "Visualizar relatorios" },
    update: { label: "Editar conteudo interno e enviar" },
    delete: { label: "Remover relatorios" },
  },
  reviews: {
    create: { label: "Criar respostas" },
    read: { label: "Ver avaliacoes" },
    update: { label: "Editar configuracoes de resposta" },
    delete: { label: "Remover respostas" },
  },
  tickets: {
    create: { label: "Criar respostas a chamados" },
    read: { label: "Ver chamados" },
    update: { label: "Editar status/respostas" },
    delete: { label: "Fechar chamados" },
  },
  financial: {
    create: { label: "N/A", disabled: true },
    read: { label: "Ver dados financeiros" },
    update: { label: "Exportar dados" },
    delete: { label: "N/A", disabled: true },
  },
  catalog: {
    create: { label: "Adicionar itens ao catalogo" },
    read: { label: "Ver catalogo" },
    update: { label: "Editar itens e gerar imagens" },
    delete: { label: "Remover itens" },
  },
  restaurants: {
    create: { label: "Conectar contas iFood" },
    read: { label: "Ver restaurantes" },
    update: { label: "Editar configuracoes" },
    delete: { label: "Desativar restaurantes" },
  },
  users: {
    create: { label: "Convidar usuarios" },
    read: { label: "Ver lista de usuarios" },
    update: { label: "Alterar perfis de acesso" },
    delete: { label: "Desativar usuarios" },
  },
};

// ---------------------------------------------------------------------------
// Types for local permission editing state
// ---------------------------------------------------------------------------

type PermissionKey = `${string}:${string}`;

function buildPermissionKey(featureCode: string, action: string): PermissionKey {
  return `${featureCode}:${action}`;
}

function parsePermissionKey(key: PermissionKey): { featureCode: string; action: string } {
  const parts = key.split(":");
  return { featureCode: parts[0] ?? "", action: parts[1] ?? "" };
}

// ---------------------------------------------------------------------------
// Helper: count enabled permissions for a role
// ---------------------------------------------------------------------------

function countEnabledPermissions(
  roleId: string,
  permissions: RolePermissionEntry[],
  featureCodes: string[],
): { enabled: number; total: number } {
  let total = 0;
  let enabled = 0;

  for (const code of featureCodes) {
    const descriptions = FEATURE_ACTION_DESCRIPTIONS[code];
    for (const action of CRUD_ACTIONS) {
      const isDisabled = descriptions?.[action]?.disabled;
      if (!isDisabled) {
        total++;
        const hasPermission = permissions.some(
          (p) => p.role_id === roleId && p.feature_code === code && p.action === action,
        );
        if (hasPermission) {
          enabled++;
        }
      }
    }
  }

  return { enabled, total };
}

// ---------------------------------------------------------------------------
// Sub-component: FeatureAccordionSection
// ---------------------------------------------------------------------------

interface FeatureAccordionSectionProps {
  featureCode: string;
  localPermissions: Set<PermissionKey>;
  onToggleAction: (featureCode: string, action: CrudAction) => void;
  onToggleAllForFeature: (featureCode: string) => void;
}

function FeatureAccordionSection({
  featureCode,
  localPermissions,
  onToggleAction,
  onToggleAllForFeature,
}: FeatureAccordionSectionProps) {
  const descriptions = FEATURE_ACTION_DESCRIPTIONS[featureCode];
  if (!descriptions) return null;

  const enabledActions = CRUD_ACTIONS.filter((action) => {
    if (descriptions[action]?.disabled) return false;
    return localPermissions.has(buildPermissionKey(featureCode, action));
  });

  const availableActions = CRUD_ACTIONS.filter(
    (action) => !descriptions[action]?.disabled,
  );

  const allChecked = enabledActions.length === availableActions.length;
  const noneChecked = enabledActions.length === 0;
  const selectAllState: boolean | "indeterminate" = allChecked
    ? true
    : noneChecked
      ? false
      : "indeterminate";

  return (
    <AccordionItem value={featureCode}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3">
          <span className="font-medium">
            {FEATURE_LABELS[featureCode] ?? featureCode}
          </span>
          <Badge variant="secondary" className="text-xs">
            {enabledActions.length}/{availableActions.length}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pl-1">
          {/* Select all for this feature */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={() => onToggleAllForFeature(featureCode)}
              id={`select-all-${featureCode}`}
            />
            <Label
              htmlFor={`select-all-${featureCode}`}
              className="text-sm font-medium cursor-pointer"
            >
              Selecionar todas as permissoes
            </Label>
          </div>

          {/* Individual action checkboxes */}
          {CRUD_ACTIONS.map((action) => {
            const desc = descriptions[action];
            const isDisabled = desc?.disabled ?? false;
            const isChecked =
              !isDisabled &&
              localPermissions.has(buildPermissionKey(featureCode, action));
            const checkboxId = `perm-${featureCode}-${action}`;

            return (
              <div key={action} className="flex items-start gap-3">
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={() => onToggleAction(featureCode, action)}
                  className="mt-0.5"
                />
                <div className="flex flex-col">
                  <Label
                    htmlFor={checkboxId}
                    className={`text-sm font-medium cursor-pointer ${
                      isDisabled ? "text-muted-foreground" : ""
                    }`}
                  >
                    {CRUD_LABELS[action]}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {desc?.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: RoleEditDialog
// ---------------------------------------------------------------------------

interface RoleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole | null;
  permissions: RolePermissionEntry[];
  featureCodes: string[];
  onSave: (data: {
    roleId: string | null;
    name: string;
    description: string;
    permissionsToGrant: { featureCode: string; action: string }[];
    permissionsToRevoke: { featureCode: string; action: string }[];
  }) => void;
  isSaving: boolean;
}

function RoleEditDialog({
  open,
  onOpenChange,
  role,
  permissions,
  featureCodes,
  onSave,
  isSaving,
}: RoleEditDialogProps) {
  const isCreating = role === null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localPermissions, setLocalPermissions] = useState<Set<PermissionKey>>(
    new Set(),
  );

  // Build the initial permission set from the server data for this role
  const buildInitialPermissions = useCallback((): Set<PermissionKey> => {
    if (!role) return new Set();
    const set = new Set<PermissionKey>();
    for (const p of permissions) {
      if (p.role_id === role.id) {
        set.add(buildPermissionKey(p.feature_code, p.action));
      }
    }
    return set;
  }, [role, permissions]);

  // Reset local state whenever the dialog opens or role changes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setName(role?.name ?? "");
        setDescription(role?.description ?? "");
        setLocalPermissions(buildInitialPermissions());
      }
      onOpenChange(nextOpen);
    },
    [role, buildInitialPermissions, onOpenChange],
  );

  // Sync local state when the dialog is opened externally (e.g. parent sets open=true)
  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setDescription(role?.description ?? "");
      setLocalPermissions(buildInitialPermissions());
    }
    // Only re-run when the dialog opens or the target role changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.id]);

  function toggleAction(featureCode: string, action: CrudAction) {
    setLocalPermissions((prev) => {
      const next = new Set(prev);
      const key = buildPermissionKey(featureCode, action);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleAllForFeature(featureCode: string) {
    const descriptions = FEATURE_ACTION_DESCRIPTIONS[featureCode];
    if (!descriptions) return;

    const availableActions = CRUD_ACTIONS.filter(
      (action) => !descriptions[action]?.disabled,
    );

    const allChecked = availableActions.every((action) =>
      localPermissions.has(buildPermissionKey(featureCode, action)),
    );

    setLocalPermissions((prev) => {
      const next = new Set(prev);
      for (const action of availableActions) {
        const key = buildPermissionKey(featureCode, action);
        if (allChecked) {
          next.delete(key);
        } else {
          next.add(key);
        }
      }
      return next;
    });
  }

  function handleSave() {
    const initialPerms = buildInitialPermissions();

    const permissionsToGrant: { featureCode: string; action: string }[] = [];
    const permissionsToRevoke: { featureCode: string; action: string }[] = [];

    // Find newly added permissions
    for (const key of localPermissions) {
      if (!initialPerms.has(key)) {
        permissionsToGrant.push(parsePermissionKey(key));
      }
    }

    // Find removed permissions
    for (const key of initialPerms) {
      if (!localPermissions.has(key)) {
        permissionsToRevoke.push(parsePermissionKey(key));
      }
    }

    onSave({
      roleId: role?.id ?? null,
      name: name.trim(),
      description: description.trim(),
      permissionsToGrant,
      permissionsToRevoke,
    });
  }

  const isNameValid = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Criar Perfil de Acesso" : "Editar Perfil de Acesso"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Configure o nome, descricao e permissoes do novo perfil."
              : "Altere as informacoes e permissoes deste perfil."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Nome do perfil</Label>
            <Input
              id="role-name"
              placeholder="Ex: Gerente, Operador, Analista"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Descricao</Label>
            <Textarea
              id="role-description"
              placeholder="Descreva brevemente as responsabilidades deste perfil"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={2}
            />
          </div>

          {/* Permissions accordion (only show when editing or creating) */}
          {!isCreating || name.trim().length > 0 ? (
            <div className="space-y-2">
              <Label>Permissoes</Label>
              <Accordion type="multiple" className="w-full">
                {featureCodes.map((code) => (
                  <FeatureAccordionSection
                    key={code}
                    featureCode={code}
                    localPermissions={localPermissions}
                    onToggleAction={toggleAction}
                    onToggleAllForFeature={toggleAllForFeature}
                  />
                ))}
              </Accordion>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isNameValid || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component: RoleMatrix
// ---------------------------------------------------------------------------

export function RoleMatrix() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: permissions, isLoading: permsLoading } = useRolePermissions();
  const { data: features, isLoading: featuresLoading } = useFeatures();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const togglePermission = useTogglePermission();
  const { toast } = useToast();

  const isLoading = rolesLoading || permsLoading || featuresLoading;

  // Build ordered feature codes from server data, using our preferred order
  const featureCodes = useMemo(() => {
    const serverCodes = (features ?? []).map((f) => f.code);
    const ordered = FEATURE_ORDER.filter((code) => serverCodes.includes(code));
    const remaining = serverCodes.filter((code) => !FEATURE_ORDER.includes(code));
    return [...ordered, ...remaining];
  }, [features]);

  function handleOpenCreate() {
    setEditingRole(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(role: UserRole) {
    setEditingRole(role);
    setDialogOpen(true);
  }

  async function handleSave(data: {
    roleId: string | null;
    name: string;
    description: string;
    permissionsToGrant: { featureCode: string; action: string }[];
    permissionsToRevoke: { featureCode: string; action: string }[];
  }) {
    setIsSaving(true);

    try {
      let targetRoleId = data.roleId;

      // If creating a new role, create it first
      if (!targetRoleId) {
        const newRole = await createRole.mutateAsync({
          name: data.name,
          description: data.description,
        });
        targetRoleId = newRole.id;
      }

      // Apply all permission changes sequentially
      for (const perm of data.permissionsToGrant) {
        await togglePermission.mutateAsync({
          roleId: targetRoleId,
          featureCode: perm.featureCode,
          action: perm.action,
          granted: true,
        });
      }

      for (const perm of data.permissionsToRevoke) {
        await togglePermission.mutateAsync({
          roleId: targetRoleId,
          featureCode: perm.featureCode,
          action: perm.action,
          granted: false,
        });
      }

      toast({
        title: data.roleId
          ? "Perfil atualizado"
          : "Perfil criado",
        description: data.roleId
          ? "As permissoes foram atualizadas com sucesso."
          : "O novo perfil de acesso foi criado com sucesso.",
      });

      setDialogOpen(false);
      setEditingRole(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao salvar perfil",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(role: UserRole) {
    deleteRole.mutate(role.id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const roleList = roles ?? [];
  const permissionList = permissions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Perfis de Acesso</h3>
      </div>

      {roleList.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Shield className="h-8 w-8" />
          <p>Nenhum perfil de acesso configurado.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roleList.map((role) => {
          const { enabled, total } = countEnabledPermissions(
            role.id,
            permissionList,
            featureCodes,
          );

          return (
            <Card key={role.id} className="relative">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {role.name}
                    {role.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </CardTitle>
                  {role.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {role.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0">
                  {enabled}/{total}
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(role)}
                    className="flex-1"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {!role.is_system && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(role)}
                      disabled={deleteRole.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Create new profile card */}
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed transition-colors hover:border-primary hover:bg-accent/50"
          onClick={handleOpenCreate}
        >
          <CardContent className="flex flex-col items-center gap-2 py-8">
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Criar Perfil
            </span>
          </CardContent>
        </Card>
      </div>

      <RoleEditDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setEditingRole(null);
          } else {
            setDialogOpen(true);
          }
        }}
        role={editingRole}
        permissions={permissionList}
        featureCodes={featureCodes}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
