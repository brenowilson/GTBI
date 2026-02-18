import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roleId: string | null;
  } | null;
  roles: { id: string; name: string }[];
  onSave: (data: {
    userId: string;
    roleId: string | null;
    isActive: boolean;
    previousRoleId: string | null;
  }) => void;
  isSaving?: boolean;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSave,
  isSaving = false,
}: EditUserDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setSelectedRoleId(user.roleId);
      setIsActive(user.isActive);
    }
  }, [user]);

  function handleSave() {
    if (!user) return;
    onSave({
      userId: user.id,
      roleId: selectedRoleId,
      isActive,
      previousRoleId: user.roleId,
    });
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere o papel e o status do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Nome</Label>
            <p className="text-sm font-medium">{user.fullName}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="user-active-switch">Ativo</Label>
            <Switch
              id="user-active-switch"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role-select">Papel</Label>
            <Select
              value={selectedRoleId ?? "none"}
              onValueChange={(value) =>
                setSelectedRoleId(value === "none" ? null : value)
              }
            >
              <SelectTrigger id="user-role-select">
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
