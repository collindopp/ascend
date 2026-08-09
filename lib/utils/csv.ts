import "server-only";

export interface CsvColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | null;
}

/** Escapes a single CSV field per RFC 4180 — quotes anything with a comma, quote, or newline. */
function escapeCsvField(value: string | number | null): string {
  if (value === null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Converts rows into an RFC 4180 CSV string, header row first. Never used for calculations — display/export only. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(c.value(row))).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
