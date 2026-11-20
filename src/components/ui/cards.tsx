import type { ReactNode } from "react";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/cn";
import type { WeekBar } from "@/data/types";

/** "Stash noticed" style card with the logo tile on the left. */
export function InsightCard({
  eyebrow = "Stash noticed",
  title,
  subtitle,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3.5 rounded-[22px] border border-border bg-surface p-[18px] shadow-card", className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-accent-tint">
        <img src={logoIcon} alt="Stash" className="h-[22px] w-[22px] object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[7px] text-[11px] font-bold tracking-[0.06em] text-primary uppercase">{eyebrow}</div>
        <div className="text-[15px] leading-[1.35] font-bold text-ink">{title}</div>
        <div className="mt-1 text-[13px] leading-[1.4] text-muted">{subtitle}</div>
      </div>
    </div>
  );
}

/** Mint gradient card used for Today's Sales, the sales trend and the bank account. */
export function TintCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-card border border-mint bg-linear-to-b from-accent-tint to-accent-tint-2 px-5 pt-5 pb-[18px] shadow-card", className)}>
      {children}
    </div>
  );
}

export function MiniChart({ bars, className }: { bars: WeekBar[]; className?: string }) {
  return (
    <div className={cn("mt-[18px] flex h-11 items-end gap-1.5 px-px", className)}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn("relative flex-1 rounded-[4px]", bar.today ? "bg-primary" : "bg-primary/16")}
          style={{ height: `${bar.pct}%` }}
        >
          <span className="absolute right-0 -bottom-4 left-0 text-center text-[9px] font-semibold text-muted-2">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StatBox({ value, label, className }: { value: ReactNode; label: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[18px] border border-border bg-surface p-4 shadow-card", className)}>
      <div className="font-display text-[22px] font-bold text-ink">{value}</div>
      <div className="mt-1 text-[11.5px] font-medium text-muted">{label}</div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-2 grid grid-cols-2 gap-2.5">{children}</div>;
}
