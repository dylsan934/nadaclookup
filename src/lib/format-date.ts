/**
 * Date helpers for NADAC data.
 *
 * There are three distinct kinds of dates in this app:
 *  - source publication / effective date: a calendar date ("2026-09-09") published by CMS.
 *    It has NO time and NO timezone. Passing it to `new Date()` parses it as UTC midnight,
 *    which renders as the previous day for anyone west of UTC. Always use `formatSourceDate`.
 *  - import timestamp: a real instant (created_at/updated_at). Use `formatTimestamp`.
 */

/** Parse a "YYYY-MM-DD" value as a local calendar date (no timezone shift). */
export const parseDateOnly = (value: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};

/** Format a date-only source value (effective date, publication date) without shifting it. */
export const formatSourceDate = (
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
): string => {
  if (!value) return "—";
  try {
    return parseDateOnly(value).toLocaleDateString("en-US", options);
  } catch {
    return value;
  }
};

/** Short form, e.g. "Sep 9, 2026". */
export const formatSourceDateShort = (value?: string | null): string =>
  formatSourceDate(value, { year: "numeric", month: "short", day: "numeric" });

/** Format a true timestamp (an instant), e.g. an import completion time. */
export const formatTimestamp = (value?: string | null): string => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

/** Whole days between a date-only value and today, in local calendar terms. */
export const daysSinceDateOnly = (value: string): number => {
  const then = parseDateOnly(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then.getTime()) / 86400000);
};
