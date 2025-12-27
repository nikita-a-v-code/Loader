/**
 * Утилиты для нечёткого поиска строк.
 * Используется для поиска улиц, населённых пунктов и других справочных данных.
 */

/**
 * Вычисляет расстояние Левенштейна между двумя строками.
 * Используется для определения похожести строк с опечатками.
 * @param {string} str1 - Первая строка
 * @param {string} str2 - Вторая строка
 * @returns {number} - Количество операций для преобразования str1 в str2
 */
export const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[str2.length][str1.length];
};

/**
 * Нормализует название улицы для сравнения.
 * Убирает префиксы (ул., улица, пр., переулок и т.д.), дефисы, пробелы.
 * @param {string} str - Исходная строка
 * @returns {string} - Нормализованная строка в нижнем регистре
 */
export const normalizeStreet = (str) => {
  let normalized = str.toLowerCase();
  // Убираем распространенные префиксы улиц
  normalized = normalized
    .replace(/^ул\.\s*/g, "")
    .replace(/^улица\s+/g, "")
    .replace(/^пр\.\s*/g, "")
    .replace(/^проспект\s+/g, "")
    .replace(/^пер\.\s*/g, "")
    .replace(/^переулок\s+/g, "")
    .replace(/^пл\.\s*/g, "")
    .replace(/^площадь\s+/g, "")
    .replace(/^б-р\s*/g, "")
    .replace(/^бульвар\s+/g, "");
  // Убираем дефисы, пробелы, тире, точки
  return normalized.replace(/[-\s—.]/g, "");
};

/**
 * Нечёткий поиск вариантов в списке опций.
 * Использует несколько методов:
 * 1. Точное совпадение и нормализованное (без дефисов/пробелов)
 * 2. Начало строки (startsWith)
 * 3. Содержание подстроки (includes)
 * 4. Поиск по словам
 * 5. Алгоритм Левенштейна для опечаток (если длина >= 5 символов)
 *
 * @param {string} value - Введённое пользователем значение
 * @param {Array<string>} options - Список доступных опций
 * @returns {Array<string>} - Отсортированный по релевантности массив опций (топ 15)
 */
export const getSimilarOptions = (value, options) => {
  if (!value || value.trim() === "") return options;

  const searchValue = value.toLowerCase();
  const searchNormalized = normalizeStreet(searchValue);

  // Сортируем опции по релевантности
  const scored = options.map((option) => {
    const optionLower = option.toLowerCase();
    const optionNormalized = normalizeStreet(option);
    let score = 0;

    // Точное совпадение - высший приоритет
    if (optionLower === searchValue) score = 1000;
    // Нормализованное точное совпадение (без дефисов/пробелов/префиксов)
    else if (optionNormalized === searchNormalized) score = 900;
    // Начинается с введенного текста
    else if (optionLower.startsWith(searchValue)) score = 100;
    // Нормализованное начало
    else if (optionNormalized.startsWith(searchNormalized)) score = 90;
    // Содержит введенный текст
    else if (optionLower.includes(searchValue)) score = 50;
    // Нормализованное содержание
    else if (optionNormalized.includes(searchNormalized)) score = 45;
    // Похожие слова (по первым буквам)
    else {
      const words = optionLower.split(/\s+/);
      const searchWords = searchValue.split(/\s+/);
      words.forEach((word) => {
        searchWords.forEach((sw) => {
          if (word.startsWith(sw) && sw.length >= 3) score += 10;
        });
      });
    }

    // Если score все еще 0 и длина поисковой строки >= 5, используем расстояние Левенштейна
    if (score === 0 && searchValue.length >= 5) {
      const distance = levenshteinDistance(searchNormalized, optionNormalized);
      const maxLen = Math.max(searchNormalized.length, optionNormalized.length);
      const similarity = 1 - distance / maxLen;
      // Если похожесть > 70%, даем очки
      if (similarity > 0.7) {
        score = Math.round(similarity * 40); // До 40 очков за похожесть
      }
    }

    return { option, score };
  });

  // Возвращаем отсортированные по score варианты
  // Если есть хорошие совпадения (score >= 40), показываем только их
  // Иначе показываем все варианты (без фильтрации), чтобы пользователь мог выбрать
  const filtered = scored.filter((item) => item.score >= 40);
  const result = (filtered.length > 0 ? filtered : scored)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((item) => item.option);

  return result;
};
