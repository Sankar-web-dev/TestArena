import * as XLSX from 'xlsx';

/**
 * Generates a ready-to-fill .xlsx template for bulk question
 * import. The header row must match the column names read by
 * {@link parseQuestionsFromExcel} exactly.
 */
export function buildQuestionTemplate(): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [
      'questionText',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctOption',
      'marks',
    ],
    [
      'What is 2 + 2?',
      '3',
      '4',
      '5',
      '6',
      'B',
      1,
    ],
  ]);

  worksheet['!cols'] = [
    { wch: 50 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Questions',
  );

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;
}
