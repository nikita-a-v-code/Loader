/**
 * Вспомогательные константы и функции валидации для ExcelFormImporter.
 */
import { validateNetworkCode } from "../../../utils/networkCodeValidation";

// Поля сетевого кода для inline-валидации
export const NETWORK_CODE_FIELDS = [
  "Код ПС ((220)110/35-10(6)кВ",
  "Номер фидера 10(6)(3) кВ",
  "Номер ТП 10(6)/0,4 кВ",
  "Номер фидера 0,4 кВ",
  "Код потребителя 3х-значный",
];

// Поля SIM-карты (логика: заполнено хотя бы одно)
export const SIM_CARD_FIELDS = ["Номер сим карты (короткий)", "Номер сим карты (полный)"];

// Валидация отдельного поля сетевого кода
export const validateNetworkCodeField = (field, value, row = {}, touchedFields = new Set()) => {
  const trimmed = (value || "").trim();
  const original = value || "";

  const hasAnyNetworkCodeValue = NETWORK_CODE_FIELDS.some((f) => {
    const fieldValue = row[f];
    return (fieldValue && fieldValue.trim() !== "") || touchedFields.has(f);
  });

  if (!hasAnyNetworkCodeValue && !trimmed) return null;

  if (original.includes(" ")) {
    return "Пробелы не допускаются";
  }

  if (hasAnyNetworkCodeValue && !trimmed) {
    return "Заполните поле";
  }

  switch (field) {
    case "Код ПС ((220)110/35-10(6)кВ": {
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      if (trimmed.length === 3) {
        const result = validateNetworkCode(trimmed);
        if (!result.valid) return result.message;
      }
      return null;
    }
    case "Номер фидера 10(6)(3) кВ": {
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      return null;
    }
    case "Номер ТП 10(6)/0,4 кВ": {
      if (!/^[\dА-ЯA-Z]*$/.test(trimmed)) return "Только цифры и заглавные буквы";
      if (trimmed.length > 2) return "Максимум 2 символа";
      if (trimmed.length < 2) return "Введите 2 символа";
      return null;
    }
    case "Номер фидера 0,4 кВ": {
      if (!/^[\dА-ЯA-Z]*$/.test(trimmed)) return "Только цифры и заглавные буквы";
      if (trimmed.length > 2) return "Максимум 2 символа";
      if (trimmed.length < 2) return "Введите 2 символа";
      return null;
    }
    case "Код потребителя 3х-значный": {
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      return null;
    }
    default:
      return null;
  }
};

// Валидация полей SIM-карты (короткий/полный) для inline-режима
export const getSimFieldErrors = (row) => {
  const errors = {};
  const shortKey = "Номер сим карты (короткий)";
  const fullKey = "Номер сим карты (полный)";
  const shortVal = (row[shortKey] || "").trim();
  const fullVal = (row[fullKey] || "").trim();

  const hasShort = shortVal !== "";
  const hasFull = fullVal !== "";

  if (!hasShort && !hasFull) {
    errors[shortKey] = "Заполните короткий или полный номер";
    errors[fullKey] = "Заполните короткий или полный номер";
    return errors;
  }

  if (hasShort) {
    if (!/^\d*$/.test(shortVal)) {
      errors[shortKey] = "Только цифры";
    } else if (shortVal.length > 5) {
      errors[shortKey] = "Максимум 5 цифр";
    }
  }

  if (hasFull) {
    if (!/^\d*$/.test(fullVal)) {
      errors[fullKey] = "Только цифры";
    } else if (fullVal.length > 11) {
      errors[fullKey] = "Максимум 11 цифр";
    } else if (fullVal.length >= 2 && !fullVal.startsWith("89")) {
      errors[fullKey] = "Должен начинаться с 89";
    } else if (fullVal.length < 11) {
      errors[fullKey] = "Введите 11 цифр";
    }
  }

  return errors;
};

// Валидация поля "Номер трансформаторной подстанции" для inline-режима
export const getTransformerFieldErrors = (row) => {
  const errors = {};
  const transformerKey = "Номер трансформаторной подстанции";
  const transformerVal = (row[transformerKey] || "").trim();

  const hasTransformer = transformerVal !== "";

  if (!hasTransformer) {
    errors[transformerKey] = "Обязательное поле";
    return errors;
  }

  if (!/^\d*$/.test(transformerVal)) {
    errors[transformerKey] = "Только цифры";
    return errors;
  }

  if (transformerVal.length > 5) {
    errors[transformerKey] = "Максимум 5 цифр";
    return errors;
  }

  return errors;
};

// Простая inline валидация полей с regex
export const validateSimpleField = (field, value) => {
  const trimmed = (value || "").trim();
  const original = value || "";

  // Проверяем на пробелы (только пробелы недопустимы)
  if (original !== "" && trimmed === "") {
    return "Поле не может содержать только пробелы";
  }

  // Если поле пустое - пропускаем валидацию (необязательные поля)
  if (!trimmed) return null;

  const validationRules = {
    Дом: { regex: /^\d*$/, message: "Только цифры" },
    "Квартира (офис)": { regex: /^\d*$/, message: "Только цифры" },
    "Корпус (литера)": { regex: /^[А-ЯA-Z]*$/, message: "Только заглавные буквы" },
    "Кол-во фаз": { regex: /^\d{0,2}$/, message: "Максимум 1 цифра" },
    "Заводской номер": { regex: /^\d*$/, message: "Только цифры" },
    "Дата поверки": { regex: /^\d{2}\.\d{2}\.\d{4}$/, message: "Формат ДД.ММ.ГГГГ" },
    "Дата установки": { regex: /^\d{2}\.\d{2}\.\d{4}$/, message: "Формат ДД.ММ.ГГГГ" },
    "Межповерочный интервал, лет": { regex: /^\d{1,2}$/, message: "Только цифры, максимум 2" },
    "Коэффициент (итоговый)": { regex: /^\d*$/, message: "Только цифры" },
    Порт: { regex: /^\d*$/, message: "Только цифры" },
    "Номер коммуникатора (для счетчиков РиМ)": { regex: /^\d*$/, message: "Только цифры" },
    "Максимальная мощность, кВт": { regex: /^\d*$/, message: "Только цифры" },
  };

  const rule = validationRules[field];
  if (!rule) return null; // Нет правила для этого поля

  if (!rule.regex.test(trimmed)) {
    return rule.message;
  }

  return null;
};
