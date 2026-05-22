export type JalaliFormatOptions = {
  /** Include hour and minute */
  time?: boolean;
};

/**
 * Formats an ISO date or Date in the Persian (Solar Hijri) calendar for fa-IR locale.
 */
export function formatJalaliDate(input: string | Date | number, options?: JalaliFormatOptions): string {
  const d =
    typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    return typeof input === "string" ? input : "";
  }
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(options?.time
        ? { hour: "2-digit", minute: "2-digit", hour12: false }
        : {}),
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Current Jalali year label (for copyright lines). */
export function formatJalaliYear(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
    }).format(date);
  } catch {
    return String(date.getFullYear());
  }
}
