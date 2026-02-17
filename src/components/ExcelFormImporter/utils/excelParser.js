/**
 * Утилиты для парсинга Excel файлов.
 */

/**
 * Парсит Excel файл и возвращает заголовки и строки данных.
 * @param {File} file - Excel файл
 * @returns {Promise<{headers: string[], rows: object[]}>}
 */
export const parseExcelFile = async (file) => {
  const XLSX = await import(/* webpackChunkName: "xlsx" */ "xlsx");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (!sheetData || sheetData.length === 0) {
    throw new Error("Пустой лист в файле");
  }

  const rawHdrRow = sheetData[1] && sheetData[1].length > 0 ? sheetData[1] : sheetData[0];

  // Обработка дублирующихся заголовков - добавляем суффиксы _2, _3 и т.д.
  const headerCounts = {};
  const headers = rawHdrRow.map((h) => {
    const trimmed = String(h || "").trim();
    if (!trimmed) return trimmed;

    if (headerCounts[trimmed] === undefined) {
      headerCounts[trimmed] = 1;
      return trimmed;
    } else {
      headerCounts[trimmed]++;
      return `${trimmed}_${headerCounts[trimmed]}`;
    }
  });

  const rows = sheetData
    .slice(2)
    .map((rowArr) => {
      const obj = {};
      headers.forEach((h, i) => {
        // Нормализуем значение: убираем пробелы, неразрывные пробелы и т.д.
        // Если после очистки получаем пустую строку - сохраняем как пустую строку
        const rawValue = rowArr[i];
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          obj[h] = "";
        } else {
          // Преобразуем в строку и очищаем от пробелов и спецсимволов
          const trimmed = String(rawValue).trim();
          obj[h] = trimmed === "" ? "" : trimmed;
        }
      });
      return obj;
    })
    .filter((row) => Object.values(row).some((val) => val !== ""));

  return { headers, rows };
};
