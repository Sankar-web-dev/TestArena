import * as XLSX from 'xlsx';

export interface ParsedQuestion {
  questionText: string;
  marks: number;
  correctOption: string;
  options: {
    optionKey: string;
    optionText: string;
  }[];
}

export function parseQuestionsFromExcel(
  buffer: Buffer,
): ParsedQuestion[] {
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

  return rows.map((row, index) => {
    const questionText = String(
      row.questionText ?? '',
    ).trim();

    const marks = Number(row.marks ?? 1);

    const correctOption = String(
      row.correctOption ?? '',
    )
      .trim()
      .toUpperCase();

    if (!questionText) {
      throw new Error(
        `Row ${index + 2}: questionText is required`,
      );
    }

    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      throw new Error(
        `Row ${index + 2}: correctOption must be A, B, C or D`,
      );
    }

    if (!Number.isInteger(marks) || marks < 1) {
      throw new Error(
        `Row ${index + 2}: marks must be a positive integer`,
      );
    }

    const options = ['A', 'B', 'C', 'D'].map(
      (key) => ({
        optionKey: key,
        optionText: String(
          row[`option${key}`] ?? '',
        ).trim(),
      }),
    );

    for (const option of options) {
      if (!option.optionText) {
        throw new Error(
          `Row ${index + 2}: option${option.optionKey} is required`,
        );
      }
    }

    return {
      questionText,
      marks,
      correctOption,
      options,
    };
  });
}
