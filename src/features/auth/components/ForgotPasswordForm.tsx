import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/common";
import { useAuth } from "../hooks/useAuth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../types";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => forgotPassword.mutate(data);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo size="lg" />
        </div>
        <CardTitle className="text-h2">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu email para receber um link de recuperação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forgotPassword.isSuccess ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Se o email estiver cadastrado, você receberá um link de recuperação.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Voltar ao login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? "Enviando..." : "Enviar link"}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
