import { useState } from "react";
import { VALIDATION_RULES, validateByRule } from "./validationRules";

// Экспортируем validators как алиас для VALIDATION_RULES для обратной совместимости
export const validators = {
  ...VALIDATION_RULES,
  // Переименовываем dateInput в dateFormat для совместимости с существующим кодом
  dateFormat: VALIDATION_RULES.dateInput,
};

// Хук для управления ошибками валидации
export const useValidationErrors = () => {
  const [errors, setErrors] = useState({});

  const setError = (key, hasError) => {
    setErrors((prev) => ({ ...prev, [key]: hasError }));
  };

  const showError = (key) => {
    setError(key, true);
    setTimeout(() => setError(key, false), 3000);
  };

  const clearError = (key) => {
    setError(key, false);
  };

  const validateField = (value, validator, errorKey) => {
    return validateWithError(value, validator, errorKey, showError, clearError);
  };

  const validateAndFormatDateField = (value, currentValue, errorKey) => {
    return validateAndFormatDate(value, currentValue, errorKey, showError, clearError);
  };

  return {
    errors,
    showError,
    clearError,
    validateField,
    validateAndFormatDateField,
  };
};

// Функция валидации поля
export const validateField = (value, validator) => {
  return validateByRule(value, validator);
};

// Форматирование даты
export const formatDate = (value, currentValue) => {
  // Если длина уменьшается (удаление), не форматируем
  if (value.length >= currentValue.length) {
    // Автоформатирование при добавлении символов
    let formattedValue = value.replace(/\D/g, ""); // Убираем все не-цифры
    if (formattedValue.length >= 2) {
      formattedValue = formattedValue.substring(0, 2) + "." + formattedValue.substring(2);
    }
    if (formattedValue.length >= 5) {
      formattedValue = formattedValue.substring(0, 5) + "." + formattedValue.substring(5, 9);
    }
    if (formattedValue.length > 10) {
      formattedValue = formattedValue.substring(0, 10);
    }
    return formattedValue;
  }
  return value;
};

// Валидация и форматирование даты
export const validateAndFormatDate = (value, currentValue, errorKey, showError, clearError) => {
  // Проверяем, есть ли недопустимые символы
  if (!validateField(value, validators.dateFormat)) {
    showError(errorKey);
    return null;
  }

  clearError(errorKey);
  return formatDate(value, currentValue);
};

// Универсальная функция валидации
export const validateWithError = (value, validator, errorKey, showError, clearError) => {
  if (!validateField(value, validator)) {
    showError(errorKey);
    return false;
  }
  clearError(errorKey);
  return true;
};
