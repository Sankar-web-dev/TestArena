import * as XLSX from 'xlsx';

function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  return '';
}

export interface ParsedStudentRow {
  /** 1-based spreadsheet row (header = row 1) */
  row: number;
  name: string;
  email: string;
}

/**
 * Parses the admin student-import workbook.
 * Expected columns: name | email. Usernames are generated
 * from names and passwords are the server-side default.
 * Role is intentionally never read from the file — every
 * imported account is created as STUDENT by the service.
 */
export function parseStudentsFromExcel(
  buffer: Buffer,
): ParsedStudentRow[] {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Excel file has no worksheet');
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<
    Record<string, unknown>
  >(worksheet, {
    defval: '',
  });

  return rows
    .map((row, index) => ({
      row: index + 2,
      name: toText(row.name).trim(),
      email: toText(row.email).trim().toLowerCase(),
    }))
    .filter((r) => r.name !== '' || r.email !== '');
}
