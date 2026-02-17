import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/stores/auth.store";

// Auth pages (eagerly loaded)
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { AcceptInvitePage } from "@/features/auth/pages/AcceptInvitePage";

// Protected pages (lazy loaded)
const PerformancePage = lazy(() =>
  import("@/features/performance/pages/PerformancePage").then((m) => ({ default: m.PerformancePage }))
);
const ReportsPage = lazy(() =>
  import("@/features/reports/pages/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const ReportDetailPage = lazy(() =>
  import("@/features/reports/pages/ReportDetailPage").then((m) => ({ default: m.ReportDetailPage }))
);
const ReviewsPage = lazy(() =>
  import("@/features/reviews/pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage }))
);
const TicketsPage = lazy(() =>
  import("@/features/tickets/pages/TicketsPage").then((m) => ({ default: m.TicketsPage }))
);
const TicketDetailPage = lazy(() =>
  import("@/features/tickets/pages/TicketDetailPage").then((m) => ({ default: m.TicketDetailPage }))
);
const FinancialPage = lazy(() =>
  import("@/features/financial/pages/FinancialPage").then((m) => ({ default: m.FinancialPage }))
);
const CatalogPage = lazy(() =>
  import("@/features/catalog/pages/CatalogPage").then((m) => ({ default: m.CatalogPage }))
);
const AdminPage = lazy(() =>
  import("@/features/admin/pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const HelpPage = lazy(() =>
  import("@/features/help/pages/HelpPage").then((m) => ({ default: m.HelpPage }))
);
const HelpArticlePage = lazy(() =>
  import("@/features/help/pages/HelpArticlePage").then((m) => ({ default: m.HelpArticlePage }))
);

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/** Redirect authenticated users away from login to the main app */
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/performance" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes — redirect to app if already authenticated */}
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/invite/accept" element={<AcceptInvitePage />} />

      {/* Protected routes — AppLayout wraps children with ProtectedRoute */}
      <Route element={<AppLayout />}>
        <Route
          path="/performance"
          element={
            <Suspense fallback={<PageLoader />}>
              <PerformancePage />
            </Suspense>
          }
        />
        <Route
          path="/reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReportDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/reviews"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReviewsPage />
            </Suspense>
          }
        />
        <Route
          path="/tickets"
          element={
            <Suspense fallback={<PageLoader />}>
              <TicketsPage />
            </Suspense>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <TicketDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/financial"
          element={
            <Suspense fallback={<PageLoader />}>
              <FinancialPage />
            </Suspense>
          }
        />
        <Route
          path="/catalog"
          element={
            <Suspense fallback={<PageLoader />}>
              <CatalogPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="/help"
          element={
            <Suspense fallback={<PageLoader />}>
              <HelpPage />
            </Suspense>
          }
        />
        <Route
          path="/help/:articleId"
          element={
            <Suspense fallback={<PageLoader />}>
              <HelpArticlePage />
            </Suspense>
          }
        />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/performance" replace />} />
      <Route path="*" element={<Navigate to="/performance" replace />} />
    </Routes>
  );
}
