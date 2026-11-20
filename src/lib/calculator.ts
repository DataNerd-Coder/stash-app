import { formatCalcNumber } from "./format";

/**
 * Evaluates a calculator expression using the display operators (× ÷ −) and %.
 * Only digits, operators, parentheses and dots get past the whitelist, so the
 * Function() call can never run anything but arithmetic.
 */
export function safeEval(str: string): number | null {
  const jsExpr = str
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/(\d+(\.\d+)?)%/g, "($1/100)");
  if (!/^[0-9+\-*/().\s]*$/.test(jsExpr)) return null;
  try {
    const val: unknown = Function(`"use strict"; return (${jsExpr})`)();
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

/** Toggles the sign of the trailing number in the expression. */
export function togglePlusMinus(expr: string): string {
  if (!expr) return "-";
  const m = expr.match(/(-?\d*\.?\d+)$/);
  if (!m) return expr;
  const num = m[1];
  const start = expr.length - num.length;
  const toggled = num.startsWith("-") ? num.slice(1) : "-" + num;
  return expr.slice(0, start) + toggled;
}

/** Builds the "₦1,000 + ₦500 = ₦1,500" line that gets dropped into the chat input. */
export function toStashSummary(expr: string, value: number): string {
  const withNaira = expr.replace(/(\d+(\.\d+)?)/g, (m) => formatCalcNumber(Number(m)));
  const spaced = withNaira.replace(/([+\-×÷])/g, " $1 ₦");
  return `₦${spaced} = ₦${formatCalcNumber(value)}`;
}
