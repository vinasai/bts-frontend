// src/utils/time.ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Constant: All Toronto time ops use this zone
export const TORONTO_TZ = "America/Toronto";

/**
 * Get current Toronto time as a dayjs instance.
 */
export function getTorontoNow() {
  return dayjs().tz(TORONTO_TZ);
}

/**
 * Get Toronto "today" (midnight start of current date).
 */
export function getTorontoToday() {
  return getTorontoNow().startOf("day");
}

/**
 * Get Toronto date string in YYYY-MM-DD format.
 */
export function getTorontoDateString() {
  return getTorontoNow().format("YYYY-MM-DD");
}

/**
 * Convert any ISO/local date string to Toronto time (dayjs instance).
 */
export function toToronto(date: string | Date | number) {
  return dayjs(date).tz(TORONTO_TZ);
}

/**
 * Format a date as Toronto local time (customizable pattern).
 * Default: "YYYY-MM-DD HH:mm"
 */
export function formatToronto(
  date: string | Date | number,
  pattern = "YYYY-MM-DD HH:mm"
) {
  return toToronto(date).format(pattern);
}
