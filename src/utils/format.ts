/**
 * Utility helpers for invoicegen.
 * Pure functions – no I/O, no network, no side-effects.
 */

/**
 * Format a number as a USD string, e.g. 1500 → "USD 1,500.00"
 */
export function formatUSD(amount: number): string {
  return `USD ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Replace characters that are unsafe in filenames across Windows/macOS/Linux.
 * Characters replaced: / \ : * ? " < > |
 */
export function safeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "-");
}

/**
 * Parse an optional YYYY-MM-DD date string and return a display string
 * like "Feb 20, 2026". Falls back to today if the input is undefined or invalid.
 */
export function formatDate(dateStr?: string): string {
  let d: Date;
  if (dateStr) {
    const parsed = Date.parse(dateStr);
    d = isNaN(parsed) ? new Date() : new Date(parsed);
  } else {
    d = new Date();
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Validate the period string (must match /^[a-z]{3}\d{4}$/, e.g. "feb2026").
 * Returns the period unchanged if valid, throws otherwise.
 */
export function parsePeriod(period: string): string {
  if (!/^[a-z]{3}\d{4}$/.test(period)) {
    throw new Error(
      `--period must match the pattern <3-letter-month><4-digit-year>, e.g. "feb2026". Got: "${period}"`
    );
  }
  return period;
}

/**
 * Parse and validate absence days CSV string.
 * Each value must be an integer 1-31.
 * Returns a sorted array of numbers.
 */
export function parseAbsenceDays(csv: string): number[] {
  const parts = csv.split(",").map((s) => s.trim());
  const days: number[] = [];
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 1 || n > 31) {
      throw new Error(
        `--absence-days must be comma-separated integers between 1 and 31. Invalid value: "${part}"`
      );
    }
    days.push(n);
  }
  return days.sort((a, b) => a - b);
}

/**
 * Build the invoice output filename (unsanitized – caller must sanitize).
 */
export function invoiceFilename(period: string, invoiceNo: string, name: string): string {
  return safeFilename(`Facturacion: ${period} - ${invoiceNo} - ${name}.pdf`);
}

/**
 * Build the activity report output filename (unsanitized – caller must sanitize).
 */
export function reportFilename(period: string, name: string): string {
  return safeFilename(`${period} - reporteactividad - ${name}.pdf`);
}
