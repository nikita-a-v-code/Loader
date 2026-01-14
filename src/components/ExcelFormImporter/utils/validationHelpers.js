/**
 * Вспомогательные константы и функции валидации для ExcelFormImporter.
 * Использует единые правила из validationRules.js
 */
import { validateNetworkCode } from "../../../utils/networkCodeValidation";
import {
  VALIDATION_RULES,
  EXCEL_FIELD_RULES,
  NETWORK_CODE_FIELDS as NC_FIELDS,
  NETWORK_CODE_FIELD_RULES,
  SIM_CARD_FIELDS as SC_FIELDS,
  getExcelFieldRule,
  getRuleMessage,
} from "../../../utils/Validation/validationRules";

// Реэкспортируем константы для обратной совместимости
export const NETWORK_CODE_FIELDS = NC_FIELDS;
export const SIM_CARD_FIELDS = SC_FIELDS;

// Валидация отдельного поля сетевого кода. field, value - какое поле редактируется и его значение.
// row - вся строка данных, touchedFields - множество полей, которые пользователь уже редактировал.
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

  // Получаем правило для поля из единого источника
  const fieldRule = NETWORK_CODE_FIELD_RULES[field];
  if (!fieldRule) return null;

  // Проверяем частичный regex (для ввода)
  if (fieldRule.partialRegex && !fieldRule.partialRegex.test(trimmed)) {
    // Определяем тип ошибки
    if (fieldRule.regex.source.includes("А-ЯA-Z")) {
      return "Только цифры и заглавные буквы";
    }
    return "Только цифры";
  }

  // Проверяем длину
  if (fieldRule.exactLength) {
    if (trimmed.length > fieldRule.exactLength) {
      return `Максимум ${fieldRule.exactLength} ${fieldRule.exactLength === 3 ? "цифры" : "символа"}`;
    }
    if (trimmed.length < fieldRule.exactLength) {
      return fieldRule.message;
    }
  }

  // Специальная проверка для Кода ПС - проверка в справочнике
  if (fieldRule.checkInList && trimmed.length === fieldRule.exactLength) {
    const result = validateNetworkCode(trimmed);
    if (!result.valid) return result.message;
  }

  return null;
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

  // Валидация короткого номера
  if (hasShort) {
    const shortRule = VALIDATION_RULES.simCardShort;
    if (!shortRule.regex.test(shortVal)) {
      errors[shortKey] = "Только цифры";
    } else if (shortVal.length > shortRule.maxLength) {
      errors[shortKey] = `Максимум ${shortRule.maxLength} цифр`;
    }
  }

  // Валидация полного номера
  if (hasFull) {
    const fullValidation = VALIDATION_RULES.simCardFull.validateFull(fullVal);
    if (!fullValidation.valid) {
      errors[fullKey] = fullValidation.message;
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

  const rule = VALIDATION_RULES.transformerNumber;
  if (!rule.regex.test(transformerVal)) {
    errors[transformerKey] = rule.message;
    return errors;
  }

  if (transformerVal.length > rule.maxLength) {
    errors[transformerKey] = `Максимум ${rule.maxLength} цифр`;
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

  // Получаем правило из единого источника
  const rule = getExcelFieldRule(field);
  if (!rule) return null;
  if (!rule.regex.test(trimmed)) {
    return rule.message;
  }

  return null;
};
