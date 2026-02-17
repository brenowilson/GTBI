import { Routes, Route, Navigate } from "react-router-dom";

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-h1 text-foreground">GTBI</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Inteligência prática para performance no iFood.
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Login page — coming in Phase 1
        </p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
