import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useProfile } from "../hooks";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function SettingsPage() {
  const { profile, isLoading, update } = useProfile();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  function handleThemeChange(value: "light" | "dark" | "system") {
    setTheme(value);
    update.mutate({ theme_preference: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Preferências e informações do perfil.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
          <CardDescription>
            Configure o tema visual da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-preference">Tema</Label>
            <Select
              value={theme}
              onValueChange={handleThemeChange}
            >
              <SelectTrigger id="theme-preference" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {update.isPending && (
            <p className="text-xs text-muted-foreground">Salvando...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>
            Informações do perfil (somente leitura).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nome</span>
              <span className="text-sm text-muted-foreground">
                {profile?.full_name ?? "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">
                {profile?.email ?? "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Membro desde</span>
              <span className="text-sm text-muted-foreground">
                {profile?.created_at ? formatDate(profile.created_at) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
