/**
 * Единый источник правил валидации для всего приложения.
 * Используется в:
 * - Validation.jsx (хук useValidationErrors для форм)
 * - excelValidationSchema.js (Yup-схема для Excel)
 * - validationHelpers.js (inline-валидация при редактировании)
 */

// === Базовые правила валидации ===
export const VALIDATION_RULES = {
  // Только цифры (любое количество)
  digits: {
    regex: /^\d*$/,
    message: "Только цифры",
  },

  // Только заглавные буквы (рус/англ)
  uppercaseLetters: {
    regex: /^[А-ЯA-Z]*$/,
    message: "Только заглавные буквы",
  },

  // Цифры и заглавные буквы
  digitsAndUppercase: {
    regex: /^[\dА-ЯA-Z]*$/,
    message: "Только цифры и заглавные буквы",
  },

  // Максимум 2 цифры
  twoDigits: {
    regex: /^\d{0,2}$/,
    message: "Максимум 2 цифры",
  },

  // Ровно 3 цифры
  threeDigits: {
    regex: /^\d{3}$/,
    message: "Введите 3 цифры",
    partialRegex: /^\d{0,3}$/,
  },

  // Ровно 2 символа (цифры или заглавные буквы)
  twoSymbols: {
    regex: /^[\dА-ЯA-Z]{2}$/,
    message: "Введите 2 символа",
    partialRegex: /^[\dА-ЯA-Z]{0,2}$/,
  },

  // Формат даты ДД.ММ.ГГГГ (для проверки ввода - разрешаем цифры и точки)
  dateInput: {
    regex: /^[\d.]*$/,
    message: "Формат ДД.ММ.ГГГГ",
  },

  // Формат даты ДД.ММ.ГГГГ (для финальной валидации)
  dateFormat: {
    regex: /^\d{2}\.\d{2}\.\d{4}$/,
    message: "Формат ДД.ММ.ГГГГ",
  },

  // Заводской номер
  serialNumber: {
    regex: /^\d*$/,
    message: "Только цифры",
  },

  // Короткий номер SIM-карты (до 5 цифр)
  simCardShort: {
    regex: /^\d*$/,
    message: "До 5 цифр",
    maxLength: 5,
    validate: (value) => {
      if (!value) return true;
      if (value.length > 5) return false;
      return /^\d*$/.test(value);
    },
  },

  // Полный номер SIM-карты (11 цифр, начинается с 89)
  simCardFull: {
    regex: /^\d*$/,
    message: "11 цифр, начинается с 89",
    exactLength: 11,
    validate: (value) => {
      if (!value) return true;
      if (value.length > 11) return false;
      if (value.length >= 2 && !value.startsWith("89")) return false;
      return /^\d*$/.test(value);
    },
    // Полная валидация для финальной проверки
    validateFull: (value) => {
      if (!value || value.trim() === "") return { valid: true };
      const trimmed = value.trim();
      if (!/^\d*$/.test(trimmed)) return { valid: false, message: "Только цифры" };
      if (trimmed.length > 11) return { valid: false, message: "Максимум 11 цифр" };
      if (trimmed.length >= 2 && !trimmed.startsWith("89")) return { valid: false, message: "Должен начинаться с 89" };
      if (trimmed.length < 11) return { valid: false, message: "Введите 11 цифр" };
      return { valid: true };
    },
  },

  // Порт
  port: {
    regex: /^\d*$/,
    message: "Только цифры",
  },

  // Номер коммуникатора
  communicatorNumber: {
    regex: /^\d*$/,
    message: "Только цифры",
  },

  // Коэффициенты
  coefficients: {
    regex: /^\d*$/,
    message: "Только цифры",
  },

  // Интервалы (1-2 цифры)
  intervals: {
    regex: /^\d{0,2}$/,
    message: "Только цифры, максимум 2",
  },

  // Номер трансформаторной подстанции (до 5 цифр)
  transformerNumber: {
    regex: /^\d*$/,
    message: "Только цифры",
    maxLength: 5,
  },

  // Максимальная мощность
  maxPower: {
    regex: /^\d*$/,
    message: "Только цифры",
  },
};

// === Маппинг полей Excel на правила валидации ===
export const EXCEL_FIELD_RULES = {
  Дом: "digits",
  "Квартира (офис)": "digits",
  "Корпус (литера)": "uppercaseLetters",
  "Кол-во фаз": "twoDigits",
  "Заводской номер": "serialNumber",
  "Дата поверки": "dateFormat",
  "Дата установки": "dateFormat",
  "Межповерочный интервал, лет": "intervals",
  "Коэффициент (итоговый)": "coefficients",
  Порт: "port",
  "Номер коммуникатора (для счетчиков РиМ)": "communicatorNumber",
  "Максимальная мощность, кВт": "maxPower",
  "Номер трансформаторной подстанции": "transformerNumber",
};

// === Поля сетевого кода ===
export const NETWORK_CODE_FIELDS = [
  "Код ПС ((220)110/35-10(6)кВ",
  "Номер фидера 10(6)(3) кВ",
  "Номер ТП 10(6)/0,4 кВ",
  "Номер фидера 0,4 кВ",
  "Код потребителя 3х-значный",
];

// Правила для полей сетевого кода
export const NETWORK_CODE_FIELD_RULES = {
  "Код ПС ((220)110/35-10(6)кВ": {
    regex: /^\d{3}$/,
    partialRegex: /^\d{0,3}$/,
    message: "Введите 3 цифры",
    exactLength: 3,
    checkInList: true, // Требует проверки в справочнике
  },
  "Номер фидера 10(6)(3) кВ": {
    regex: /^\d{3}$/,
    partialRegex: /^\d{0,3}$/,
    message: "Введите 3 цифры",
    exactLength: 3,
  },
  "Номер ТП 10(6)/0,4 кВ": {
    regex: /^[\dА-ЯA-Z]{2}$/,
    partialRegex: /^[\dА-ЯA-Z]{0,2}$/,
    message: "Введите 2 символа",
    exactLength: 2,
  },
  "Номер фидера 0,4 кВ": {
    regex: /^[\dА-ЯA-Z]{2}$/,
    partialRegex: /^[\dА-ЯA-Z]{0,2}$/,
    message: "Введите 2 символа",
    exactLength: 2,
  },
  "Код потребителя 3х-значный": {
    regex: /^\d{3}$/,
    partialRegex: /^\d{0,3}$/,
    message: "Введите 3 цифры",
    exactLength: 3,
  },
};

// === Поля SIM-карты ===
export const SIM_CARD_FIELDS = ["Номер сим карты (короткий)", "Номер сим карты (полный)"];

// === Вспомогательные функции ===

/**
 * Проверяет значение по правилу валидации
 * @param {string} value - Значение для проверки
 * @param {string|object} rule - Имя правила или объект правила
 * @returns {boolean} - Результат валидации
 */
export const validateByRule = (value, rule) => {
  const ruleObj = typeof rule === "string" ? VALIDATION_RULES[rule] : rule;
  if (!ruleObj) return true;

  if (ruleObj.validate) {
    return ruleObj.validate(value);
  }
  return ruleObj.regex.test(value);
};

/**
 * Получает сообщение об ошибке для правила
 * @param {string|object} rule - Имя правила или объект правила
 * @returns {string} - Сообщение об ошибке
 */
export const getRuleMessage = (rule) => {
  const ruleObj = typeof rule === "string" ? VALIDATION_RULES[rule] : rule;
  return ruleObj?.message || "Некорректное значение";
};

/**
 * Получает правило валидации для поля Excel
 * @param {string} fieldName - Имя поля Excel
 * @returns {object|null} - Объект правила или null
 */
export const getExcelFieldRule = (fieldName) => {
  const ruleName = EXCEL_FIELD_RULES[fieldName];
  if (!ruleName) return null;
  return VALIDATION_RULES[ruleName];
};
