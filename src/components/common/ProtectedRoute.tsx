import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { useUserPermissions } from "@/features/auth/hooks/useUserPermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: { feature: string; action: string };
}

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="text-4xl font-bold text-destructive">403</div>
      <h1 className="text-xl font-semibold text-foreground">
        Acesso Negado
      </h1>
      <p className="text-muted-foreground">
        Você não tem permissão para acessar esta página.
      </p>
    </div>
  );
}

export function ProtectedRoute({
  children,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();
  const { can } = useUserPermissions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    const hasPermission = can(
      requiredPermission.feature,
      requiredPermission.action
    );
    if (!hasPermission) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
}
