// Inset grouped list — the core building block of almost every Stash page.
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { ChevronRightIcon } from "@/components/icons";

export function GroupedCard({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("overflow-hidden rounded-group border border-border bg-surface shadow-card", className)} {...rest} />;
}

const listItemBase =
  "flex w-full items-center gap-4 border-b-[3px] border-border bg-transparent px-[18px] py-[15px] text-inherit last:border-b-0";

type ListItemProps = ComponentProps<"div"> & { to?: undefined };
type ListLinkProps = Omit<ComponentProps<typeof Link>, "className"> & { to: string; className?: string };

export function ListItem(props: ListItemProps | ListLinkProps) {
  if (props.to !== undefined) {
    const { className, ...rest } = props as ListLinkProps;
    return <Link className={cn(listItemBase, "cursor-pointer", className)} {...rest} />;
  }
  const { className, onClick, ...rest } = props as ListItemProps;
  return <div className={cn(listItemBase, onClick && "cursor-pointer", className)} onClick={onClick} {...rest} />;
}

export type RowTone = "default" | "warn" | "danger";

export function RowIcon({ tone = "default", className, children }: { tone?: RowTone; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center font-display text-[13px] font-bold text-muted",
        tone === "warn" && "text-amber",
        tone === "danger" && "text-danger",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RowBody({ title, subtitle, className, children }: { title?: ReactNode; subtitle?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      {title !== undefined && <RowTitle>{title}</RowTitle>}
      {subtitle !== undefined && <RowSubtitle>{subtitle}</RowSubtitle>}
      {children}
    </div>
  );
}

export function RowTitle({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("truncate text-[14px] font-semibold text-ink", className)} {...rest} />;
}

export function RowSubtitle({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("mt-0.5 text-[12px] text-muted", className)} {...rest} />;
}

export function RowTrailing({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("shrink-0 text-right", className)} {...rest} />;
}

/** Bold money figure on the right of a row. */
export function Amount({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("text-[13.5px] font-bold text-ink tabular-nums", className)} {...rest} />;
}

/** Small green caption under an Amount (share %, profit). */
export function AmountNote({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("mt-0.5 text-[11px] font-semibold text-accent", className)} {...rest} />;
}

export function Chevron({ size = 16 }: { size?: number }) {
  return <ChevronRightIcon size={size} className="shrink-0 text-muted-2" />;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-5 py-10 text-center text-[13.5px] text-muted">{children}</div>;
}
