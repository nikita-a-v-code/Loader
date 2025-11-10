import { useState } from "react";

// Функции валидации
export const validators = {
  digits: {
    regex: /^\d*$/,
    message: "Только цифры"
  },
  uppercaseLetters: {
    regex: /^[А-ЯA-Z]*$/,
    message: "Только заглавные буквы"
  }
};

// Хук для управления ошибками валидации
export const useValidationErrors = () => {
  const [errors, setErrors] = useState({});

  const setError = (key, hasError) => {
    setErrors(prev => ({ ...prev, [key]: hasError }));
  };

  const showError = (key) => {
    setError(key, true);
    setTimeout(() => setError(key, false), 3000);
  };

  const clearError = (key) => {
    setError(key, false);
  };

  return { errors, showError, clearError };
};

// Функция валидации поля
export const validateField = (value, validator) => {
  return validator.regex.test(value);
};