import { sql, type AnyColumn, type SQL } from "drizzle-orm";
import type { Period } from "../src/data/types.js";

const PERIODS: Period[] = ["today", "7d", "month", "all", "custom"];

export function parsePeriod(value: string | null, fallback: Period): Period {
  return PERIODS.includes(value as Period) ? (value as Period) : fallback;
}

/** The business-local calendar date of a timestamptz column. */
export const localDate = (col: AnyColumn | SQL, tz: string) => sql`(${col} at time zone ${tz})::date`;

/** Today's date in the business's timezone. */
export const localToday = (tz: string) => sql`(now() at time zone ${tz})::date`;

/** SQL condition limiting a timestamptz column to a reporting period. */
export function inPeriod(col: AnyColumn, period: Period, tz: string): SQL {
  switch (period) {
    case "today":
      return sql`${localDate(col, tz)} = ${localToday(tz)}`;
    case "7d":
      return sql`${localDate(col, tz)} > ${localToday(tz)} - 7`;
    case "month":
      return sql`date_trunc('month', ${col} at time zone ${tz}) = date_trunc('month', now() at time zone ${tz})`;
    // "custom" needs a date-range picker in the UI; until then it shows everything
    case "all":
    case "custom":
      return sql`true`;
  }
}

/** Single-letter weekday label for a "YYYY-MM-DD" date. */
export function weekdayLetter(isoDate: string): string {
  return "SMTWTFS"[new Date(`${isoDate}T00:00:00Z`).getUTCDay()];
}
