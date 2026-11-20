// Loading & error states for data-backed sections.
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { GroupedCard } from "@/components/ui/list";
import { cn } from "@/lib/cn";

const bar = "animate-pulse rounded-md bg-border";

/** Placeholder rows shaped like list items while data loads. */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <GroupedCard className={className} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b-[3px] border-border px-[18px] py-[15px] last:border-b-0">
          <div className="min-w-0 flex-1">
            <div className={cn(bar, "h-3.5 w-2/5")} />
            <div className={cn(bar, "mt-2 h-3 w-1/4")} />
          </div>
          <div className={cn(bar, "h-3.5 w-16")} />
        </div>
      ))}
    </GroupedCard>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn(bar, "rounded-card", className)} />;
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <GroupedCard className={cn("px-5 py-8 text-center", className)} role="alert">
      <p className="text-[13.5px] leading-normal text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mx-auto mt-4 h-10 w-auto px-5 text-[13.5px]" onClick={onRetry}>
          Try again
        </Button>
      )}
    </GroupedCard>
  );
}

interface QueryLike<T> {
  data: T | undefined;
  error: unknown;
  isPending: boolean;
  refetch: () => unknown;
}

/** Renders loading / error / data for a React Query result. */
export function QueryView<T>({
  query,
  loading = <SkeletonList />,
  children,
}: {
  query: QueryLike<T>;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isPending) return <>{loading}</>;
  return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
}
