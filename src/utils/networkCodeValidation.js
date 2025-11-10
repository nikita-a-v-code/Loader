import { SubstationCode } from "../data/dataBase";

// Правила валидации для каждой позиции в сетевом коде
const VALIDATION_RULES = [
  { range: [0, 3], pattern: /\d/, message: "Несуществующий код ПС - найдите нужный в списке ниже" },
  { range: [3, 6], pattern: /\d/, message: "Номер фидера 10кВ: только цифры (3 символа)" },
  { range: [6, 8], pattern: /[\dА-ЯA-Z]/, message: "Номер ТП: цифры и заглавные буквы (2 символа)" },
  { range: [8, 10], pattern: /[\dА-ЯA-Z]/, message: "Номер фидера 0,4кВ: цифры и заглавные буквы (2 символа)" },
  { range: [10, 13], pattern: /\d/, message: "Код потребителя: только цифры (3 символа)" }
];

// Автоматическое форматирование сетевого кода
export const formatNetworkCode = (value) => {
  const cleanValue = value.replace(/-/g, "");
  const positions = [3, 6, 8, 10];
  
  return positions.reduce((formatted, pos, index) => {
    if (cleanValue.length > pos) {
      const before = formatted.substring(0, pos + index);
      const after = formatted.substring(pos + index);
      return before + "-" + after;
    }
    return formatted;
  }, cleanValue);
};

// Валидация символа по позиции
export const validateCharacterAtPosition = (char, position) => {
  const rule = VALIDATION_RULES.find(r => position >= r.range[0] && position < r.range[1]);
  if (!rule) return { valid: false, message: "Максимальная длина кода: 13 символов" };
  
  return {
    valid: rule.pattern.test(char),
    message: rule.message
  };
};

// Валидация кода ПС
export const validateSubstationCode = (code) => {
  return SubstationCode.some(ps => ps.value === code);
};

// Валидация полного сетевого кода
export const validateNetworkCode = (value) => {
  const cleanValue = value.replace(/-/g, "");
  
  // Проверка длины
  if (cleanValue.length > 13) {
    return { valid: false, message: "Максимальная длина кода: 13 символов" };
  }

  // Проверка каждого символа
  for (let i = 0; i < cleanValue.length; i++) {
    const validation = validateCharacterAtPosition(cleanValue[i], i);
    if (!validation.valid) {
      return validation;
    }
  }

  // Проверка кода ПС если введены первые 3 символа
  if (cleanValue.length >= 3) {
    const psCode = cleanValue.substring(0, 3);
    if (!validateSubstationCode(psCode)) {
      return { 
        valid: false, 
        message: "Несуществующий код ПС - найдите нужный в списке ниже",
        shouldCorrect: true,
        correctedValue: cleanValue.substring(0, 2)
      };
    }
  }

  return { valid: true };
};

// Валидация только цифр
export const validateDigitsOnly = (value) => {
  return /^\d*$/.test(value);
};