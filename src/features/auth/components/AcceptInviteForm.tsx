import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/shared/lib/supabase";
import { PasswordStrength } from "./PasswordStrength";
import { acceptInviteSchema, type AcceptInviteInput } from "../types";

export function AcceptInviteForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const acceptMutation = useMutation({
    mutationFn: async (input: AcceptInviteInput) => {
      const { error } = await supabase.functions.invoke("auth-accept-invite", {
        body: { token, full_name: input.full_name, password: input.password },
      });
      if (error) throw error;
    },
    onSuccess: () => navigate("/login"),
  });

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-destructive">
            Link de convite inválido ou expirado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-h2">Aceitar convite</CardTitle>
        <CardDescription>
          Configure sua conta para acessar o GTBI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => acceptMutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              placeholder="Seu nome"
              autoComplete="name"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password", {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            <PasswordStrength password={passwordValue} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {acceptMutation.error && (
            <p className="text-xs text-destructive">
              Erro ao aceitar convite. O link pode ter expirado.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
            {acceptMutation.isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
