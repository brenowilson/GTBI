import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RoleOption {
  id: string;
  name: string;
}

interface InviteUserFormProps {
  roles: RoleOption[];
  onInvite: (data: { email: string; fullName: string; roleId: string }) => void;
}

export function InviteUserForm({ roles, onInvite }: InviteUserFormProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState("");

  const isValid = email.trim().length > 0 && fullName.trim().length > 0 && roleId.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) {
      onInvite({ email, fullName, roleId });
      setEmail("");
      setFullName("");
      setRoleId("");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Convidar Usuário</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome completo</Label>
            <Input
              id="invite-name"
              placeholder="Nome do usuário"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Papel</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={!isValid}>
            Enviar convite
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
