import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a time string (HH:MM) for display based on user preference
 */
export function formatTime(time: string, format: '12h' | '24h' = '24h'): string {
  if (format === '24h') return time;

  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate time difference in hours between two HH:MM times
 * Handles overnight spans
 */
export function getTimeDifferenceHours(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

/**
 * Add hours to a time string, returning new HH:MM
 */
export function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + hours * 60;

  // Normalize to 0-24h range
  while (totalMinutes < 0) totalMinutes += 24 * 60;
  while (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = Math.round(totalMinutes % 60);

  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * Get a friendly timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Generate a unique ID (simple UUID v4 alternative)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format day number for protocol display
 * -2 → "2 days before"
 * 0 → "Travel day"
 * 1 → "Day 1"
 */
export function formatProtocolDay(dayNumber: number): string {
  if (dayNumber < 0) {
    return `${Math.abs(dayNumber)} day${Math.abs(dayNumber) === 1 ? '' : 's'} before`;
  }
  if (dayNumber === 0) {
    return 'Travel day';
  }
  return `Day ${dayNumber}`;
}
