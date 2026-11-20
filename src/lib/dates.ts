// Business-local date labels ("Today, 4:20 PM", "Yesterday", "Aug 25").
// Stash's businesses run on Lagos time regardless of the viewer's device clock.
const TIME_ZONE = "Africa/Lagos";

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric" });
const clock = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" });

const dayKey = (d: Date) => ymd.format(d); // YYYY-MM-DD in Lagos

function relativeDay(key: string, fallback: () => string): string {
  const now = new Date();
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return fallback();
}

/** ISO timestamp -> "Today, 4:20 PM" / "Yesterday, 6:10 PM" / "Aug 25, 5:30 PM" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${relativeDay(dayKey(d), () => monthDay.format(d))}, ${clock.format(d)}`;
}

/** ISO timestamp -> "Today" / "Yesterday" / "Aug 25" */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  return relativeDay(dayKey(d), () => monthDay.format(d));
}

/** Calendar date "YYYY-MM-DD" -> "Today" / "Yesterday" / "Aug 25" */
export function formatCalendarDate(date: string): string {
  // noon UTC keeps the calendar day stable in any timezone
  return relativeDay(date, () => monthDay.format(new Date(`${date}T12:00:00Z`)));
}
