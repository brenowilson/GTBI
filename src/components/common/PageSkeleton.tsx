import { cn } from "@/shared/lib/cn";

type SkeletonVariant = "dashboard" | "list" | "detail";

interface PageSkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-9 w-32" />
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6"
          >
            <SkeletonBlock className="mb-2 h-4 w-24" />
            <SkeletonBlock className="mb-1 h-8 w-20" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <SkeletonBlock className="mb-4 h-5 w-36" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <SkeletonBlock className="mb-4 h-5 w-36" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-8 w-48" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-24" />
          <SkeletonBlock className="h-9 w-32" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex gap-3">
        <SkeletonBlock className="h-9 w-40" />
        <SkeletonBlock className="h-9 w-32" />
        <SkeletonBlock className="h-9 w-28" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-3">
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/6" />
          <SkeletonBlock className="h-4 w-1/6" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border px-6 py-4 last:border-b-0"
          >
            <SkeletonBlock className="h-4 w-1/4" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-4 w-1/6" />
            <SkeletonBlock className="h-4 w-1/6" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-32" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-9" />
          <SkeletonBlock className="h-9 w-9" />
          <SkeletonBlock className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9" />
        <SkeletonBlock className="h-8 w-56" />
      </div>

      {/* Form sections */}
      <div className="rounded-xl border border-border bg-card p-6">
        <SkeletonBlock className="mb-6 h-6 w-40" />

        <div className="space-y-4">
          {/* Form row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
          </div>

          {/* Form row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-9 w-full" />
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <SkeletonBlock className="h-9 w-24" />
        <SkeletonBlock className="h-9 w-28" />
      </div>
    </div>
  );
}

const VARIANT_MAP: Record<SkeletonVariant, React.FC> = {
  dashboard: DashboardSkeleton,
  list: ListSkeleton,
  detail: DetailSkeleton,
};

export function PageSkeleton({
  variant = "dashboard",
  className,
}: PageSkeletonProps) {
  const VariantComponent = VARIANT_MAP[variant];

  return (
    <div className={cn("p-4 md:p-6", className)} role="status" aria-label="Carregando conteúdo">
      <VariantComponent />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
