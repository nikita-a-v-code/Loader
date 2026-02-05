// Установите библиотеку xlsx если еще не установлена:
// npm install xlsx

const XLSX = require("xlsx");

/**
 * Основная функция для сопоставления счетчиков из двух страниц Excel
 * @param {string} filePath - Путь к Excel файлу
 * @param {Object} options - Настройки обработки
 * @returns {Array} - Результат сопоставления
 */
function matchMetersFromExcel(filePath, options = {}) {
  // Настройки по умолчанию
  const config = {
    firstSheetName: null, // Имя первой страницы (null - первая страница)
    firstSheetColumn: "A", // Колонка со счетчиками на первой странице
    firstSheetStartRow: 1, // Строка начала данных (1-индексация)

    secondSheetName: null, // Имя второй страницы (null - вторая страница)
    secondSheetMeterColumn: "A", // Колонка со счетчиками на второй странице
    secondSheetCodeColumn: "B", // Колонка с кодами на второй странице
    secondSheetStartRow: 1, // Строка начала данных

    resultFile: "результат_сопоставления.xlsx", // Имя файла для сохранения результата
    ...options,
  };

  try {
    // 1. Читаем Excel файл
    console.log("Чтение файла...");
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log("Найденные страницы:", sheetNames);

    // 2. Определяем имена страниц
    const firstSheetName = config.firstSheetName || sheetNames[0];
    const secondSheetName = config.secondSheetName || sheetNames[1] || sheetNames[0];

    console.log(`Используем страницы: "${firstSheetName}" и "${secondSheetName}"`);

    // 3. Получаем данные с первой страницы
    console.log("Получение данных с первой страницы...");
    const firstSheet = workbook.Sheets[firstSheetName];
    const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, {
      header: 1,
      defval: null,
    });

    // Извлекаем первую колонку счетчиков
    const firstColumnMeters = [];
    for (let i = config.firstSheetStartRow - 1; i < firstSheetData.length; i++) {
      const cellValue = firstSheetData[i][0]; // Колонка A
      if (cellValue !== null && cellValue !== undefined && cellValue !== "") {
        const value = String(cellValue).trim();
        if (value) {
          firstColumnMeters.push(value);
        }
      }
    }

    console.log(`На первой странице найдено ${firstColumnMeters.length} счетчиков`);

    // 4. Получаем данные со второй страницы
    console.log("Получение данных со второй страницы...");
    const secondSheet = workbook.Sheets[secondSheetName];
    const secondSheetData = XLSX.utils.sheet_to_json(secondSheet, {
      header: 1,
      defval: null,
    });

    // Создаем Map для быстрого поиска счетчиков со второй страницы
    const secondMap = new Map();
    const meterColumnIndex = columnLetterToIndex(config.secondSheetMeterColumn);
    const codeColumnIndex = columnLetterToIndex(config.secondSheetCodeColumn);

    let foundCount = 0;
    for (let i = config.secondSheetStartRow - 1; i < secondSheetData.length; i++) {
      const meterValue = secondSheetData[i][meterColumnIndex];
      const codeValue = secondSheetData[i][codeColumnIndex];

      if (
        meterValue !== null &&
        meterValue !== undefined &&
        meterValue !== "" &&
        codeValue !== null &&
        codeValue !== undefined &&
        codeValue !== ""
      ) {
        const meterStr = String(meterValue).trim();
        const codeStr = String(codeValue).trim();

        if (meterStr && codeStr) {
          secondMap.set(meterStr, codeStr);
          foundCount++;
        }
      }
    }

    console.log(`На второй странице найдено ${foundCount} пар счетчик-код`);

    // 5. Сопоставляем данные
    console.log("Сопоставление данных...");
    const result = [];
    let matchedCount = 0;
    let notMatchedCount = 0;

    for (const meter of firstColumnMeters) {
      if (secondMap.has(meter)) {
        const fullCode = secondMap.get(meter);
        const codeParts = fullCode.split("-");

        result.push({
          "Номер счетчика": meter,
          "Часть 1": codeParts[0] || "",
          "Часть 2": codeParts[1] || "",
          "Часть 3": codeParts[2] || "",
          "Часть 4": codeParts[3] || "",
          "Часть 5": codeParts[4] || "",
          "Полный код": fullCode,
          Статус: "НАЙДЕН",
        });
        matchedCount++;
      } else {
        result.push({
          "Номер счетчика": meter,
          "Часть 1": "",
          "Часть 2": "",
          "Часть 3": "",
          "Часть 4": "",
          "Часть 5": "",
          "Полный код": "",
          Статус: "НЕ НАЙДЕН",
        });
        notMatchedCount++;
      }
    }

    console.log(`\nРезультаты:`);
    console.log(`Сопоставлено: ${matchedCount} счетчиков`);
    console.log(`Не найдено: ${notMatchedCount} счетчиков`);
    console.log(`Всего обработано: ${result.length} счетчиков`);

    // 6. Сохраняем результат в новый Excel файл
    console.log("\nСохранение результата...");
    saveResultsToExcel(result, config.resultFile);

    // 7. Дополнительно: сохраняем отчет в текстовый файл
    saveReport(result, matchedCount, notMatchedCount);

    return result;
  } catch (error) {
    console.error("Ошибка при обработке файла:", error);
    throw error;
  }
}

/**
 * Преобразует букву колонки в индекс (A -> 0, B -> 1, и т.д.)
 */
function columnLetterToIndex(letter) {
  letter = letter.toUpperCase();
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - "A".charCodeAt(0) + 1);
  }
  return index - 1;
}

/**
 * Сохраняет результаты в Excel файл
 */
function saveResultsToExcel(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data);

  // Настраиваем ширину колонок
  const wscols = [
    { wch: 30 }, // Номер счетчика
    { wch: 15 }, // Часть 1
    { wch: 15 }, // Часть 2
    { wch: 15 }, // Часть 3
    { wch: 15 }, // Часть 4
    { wch: 15 }, // Часть 5
    { wch: 30 }, // Полный код
    { wch: 15 }, // Статус
  ];
  ws["!cols"] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Результаты");

  XLSX.writeFile(wb, filename);
  console.log(`Результаты сохранены в файл: ${filename}`);
}

matchMetersFromExcel("C:\\Programmirovanie\\ImEnforce\\Loader\\Для Спарка\\Коды.xls");
