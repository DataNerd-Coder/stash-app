import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const base = "flex w-full cursor-pointer items-center justify-center gap-2 font-sans";

const variants = {
  primary: "h-[52px] rounded-[26px] bg-primary text-[15px] font-bold text-white shadow-btn",
  secondary: "h-[52px] rounded-[26px] border border-border bg-surface text-[15px] font-semibold text-ink",
  danger: "h-[46px] rounded-[23px] bg-danger text-[14px] font-bold text-white",
} as const;

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button type={type} className={cn(base, variants[variant], className)} {...rest} />;
}
