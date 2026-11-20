const withThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * ₦ formatting is hand-rolled rather than using toLocaleString, since en-NG
 * locale data support varies across environments.
 */
export function formatNaira(amount: number): string {
  const n = Math.round(Number(amount));
  return "₦" + withThousands(n.toString());
}

/** Calculator display: integers get commas, decimals are fixed to 2 places. */
export function formatCalcNumber(n: number): string {
  if (Number.isInteger(n)) return withThousands(n.toString());
  const [whole, frac] = n.toFixed(2).split(".");
  return `${withThousands(whole)}.${frac}`;
}

export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const plural = (count: number, word: string) => `${word}${count === 1 ? "" : "s"}`;

/** Short money for stat tiles: ₦2.86M, ₦612K, ₦9,400. */
export function formatNairaCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const trim = (n: number, digits: number) => String(Number(n.toFixed(digits)));
  if (abs >= 1_000_000) return `${sign}₦${trim(abs / 1_000_000, 2)}M`;
  if (abs >= 100_000) return `${sign}₦${trim(abs / 1_000, 0)}K`;
  return sign + formatNaira(abs);
}
