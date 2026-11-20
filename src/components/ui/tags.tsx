import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const badgeTones = {
  expired: "bg-danger-tint text-danger",
  soon: "bg-amber-tint text-amber",
  ok: "bg-accent-tint text-primary",
  neutral: "bg-border text-muted",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[20px] px-2 py-[3px] text-[10.5px] font-bold tracking-[0.01em] whitespace-nowrap",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const statusTones = {
  ok: "bg-accent-tint text-primary",
  info: "bg-info-tint text-info",
  danger: "bg-danger-tint text-danger",
  warn: "bg-amber-tint text-amber",
} as const;

export type StatusTone = keyof typeof statusTones;

/** Status pill for sales / invoices / debts / bank transactions. */
export function StatusTag({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={cn("rounded-[20px] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap", statusTones[tone])}>{children}</span>;
}

export function TabRow<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto px-0.5 pt-0.5 pb-1" role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "shrink-0 cursor-pointer rounded-[20px] border px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap",
              active ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
