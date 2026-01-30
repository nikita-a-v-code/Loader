import * as yup from "yup";
import { validateNetworkCode } from "../networkCodeValidation";
import { VALIDATION_RULES, NETWORK_CODE_FIELDS, NETWORK_CODE_FIELD_RULES, isRimModelRequiringCommunicator } from "./validationRules";

/**
 * Создаёт динамическую схему валидации для Excel импорта.
 * Схема зависит от справочников, загруженных с сервера.
 *
 * @param {Object} lists - Объект со справочниками
 * @param {Array<string>} lists.mpesList - Список МПЭС
 * @param {Array<string>} lists.rkesList - Список РКЭС
 * @param {Array<string>} lists.masterUnitsList - Список Мастерских участков
 * @param {Array<string>} lists.settlementList - Список населенных пунктов
 * @param {Object} lists.streetsBySettlement - Улицы по населенным пунктам {name: [streets]}
 * @param {Array<string>} lists.subscriberList - Список типов абонентов
 * @param {Array<string>} lists.statusList - Список статусов счета
 * @param {Array<string>} lists.deviceList - Список моделей счетчиков
 * @returns {yup.ObjectSchema} - Схема валидации Yup
 */
export const createExcelValidationSchema = (lists) => {
  const {
    mpesList = [],
    rkesList = [],
    masterUnitsList = [],
    settlementList = [],
    streetsBySettlement = {},
    subscriberList = [],
    statusList = [],
    deviceList = [],
    numberTPList = [],
  } = lists;

  // Сообщения об ошибках
  const REQUIRED_MSG = "Поле обязательно для заполнения";
  const SELECT_FROM_LIST_MSG = "Неверное значение. Выберите из списка";

  // Хелпер: обязательное поле из списка
  const requiredFromList = (list, fieldName) =>
    yup
      .string()
      .trim()
      .required(REQUIRED_MSG)
      .test("in-list", SELECT_FROM_LIST_MSG, (value) => {
        if (!value) return false;
        return list.includes(value);
      });

  // Хелпер: необязательное поле с правилом из единого источника
  const optionalWithRule = (ruleName) => {
    const rule = VALIDATION_RULES[ruleName];
    if (!rule) return yup.string();
    return yup
      .string()
      .transform((value) => (value ? value.trim() : value))
      .test("regex-if-filled", rule.message, (value, context) => {
        const originalValue = context.originalValue;
        if (originalValue && originalValue.trim() === "" && originalValue !== "") {
          return false;
        }
        if (!value || value === "") return true;
        return rule.regex.test(value);
      });
  };

  // Хелпер: необязательное поле с regex (для обратной совместимости)
  const optionalWithRegex = (regex, message) =>
    yup
      .string()
      .transform((value) => (value ? value.trim() : value))
      .test("regex-if-filled", message, (value, context) => {
        // Проверяем исходное значение - если только пробелы, это ошибка
        const originalValue = context.originalValue;
        if (originalValue && originalValue.trim() === "" && originalValue !== "") {
          return false; // Только пробелы - недопустимо
        }
        if (!value || value === "") return true;
        return regex.test(value);
      });

  // Хелпер: создание валидации для поля сетевого кода
  const networkCodeFieldValidation = (fieldName) => {
    const fieldRule = NETWORK_CODE_FIELD_RULES[fieldName];
    if (!fieldRule) return yup.string();

    return yup
      .string()
      .trim()
      .test(`network-code-${fieldName}`, "Ошибка валидации", function (value) {
        const parent = this.parent;
        const hasAnyValue = NETWORK_CODE_FIELDS.some((f) => parent[f] && parent[f].trim() !== "");

        // Если ни одно поле не заполнено - пропускаем
        if (!hasAnyValue) return true;

        // Если какое-то заполнено, но это пустое - ошибка
        if (!value || value === "") {
          return this.createError({ message: "Заполните поле" });
        }
        // Проверка на пробелы
        if (value.includes(" ")) {
          return this.createError({ message: "Пробелы не допускаются" });
        }
        // Проверка по частичному regex
        if (fieldRule.partialRegex && !fieldRule.partialRegex.test(value)) {
          if (fieldRule.regex.source.includes("А-ЯA-Z")) {
            return this.createError({ message: "Только цифры и заглавные буквы" });
          }
          return this.createError({ message: "Только цифры" });
        }
        // Проверка длины
        if (fieldRule.exactLength) {
          if (value.length > fieldRule.exactLength) {
            return this.createError({
              message: `Максимум ${fieldRule.exactLength} ${fieldRule.exactLength === 3 ? "цифры" : "символа"}`,
            });
          }
          if (value.length < fieldRule.exactLength) {
            return this.createError({ message: fieldRule.message });
          }
        }
        // Специальная проверка для Кода ПС - проверка в справочнике
        if (fieldRule.checkInList && value.length === fieldRule.exactLength) {
          const result = validateNetworkCode(value);
          if (!result.valid) {
            return this.createError({ message: result.message });
          }
        }
        return true;
      });
  };

  return yup.object().shape({
    // === Обязательные поля из справочников ===
    "Подразделение (МПЭС)": requiredFromList(mpesList, "МПЭС"),
    РКЭС: requiredFromList(rkesList, "РКЭС"),
    "Мастерский участок": requiredFromList(masterUnitsList, "Мастерский участок"),
    "Населенный пункт": requiredFromList(settlementList, "Населенный пункт"),

    // Улица - зависит от населенного пункта
    Улица: yup
      .string()
      .trim()
      .required(REQUIRED_MSG)
      .test("street-validation", SELECT_FROM_LIST_MSG, function (value) {
        if (!value) return false;
        const settlement = this.parent["Населенный пункт"];

        // Если населенный пункт правильный - проверяем улицу по его списку
        if (settlement && settlementList.includes(settlement)) {
          const streets = streetsBySettlement[settlement] || [];
          if (streets.length === 0) {
            return this.createError({ message: "Нет улиц для выбранного населенного пункта" });
          }
          // Строгое сравнение - значение должно точно совпадать со списком
          return streets.includes(value);
        }

        // Если населенный пункт неправильный - всегда помечаем улицу как ошибку
        // чтобы пользователь мог исправить оба поля сразу
        return this.createError({ message: "Сначала исправьте населенный пункт" });
      }),

    "Тип абонента": requiredFromList(subscriberList, "Тип абонента"),
    "Статус счета": requiredFromList(statusList, "Статус счета"),
    "Модель счетчика": requiredFromList(deviceList, "Модель счетчика"),

    // === Необязательные поля с форматом (используем единые правила) ===
    Дом: optionalWithRule("digits"),
    "Квартира (офис)": optionalWithRule("digits"),
    "Корпус (литера)": optionalWithRule("uppercaseLetters"),
    "Кол-во фаз": optionalWithRule("twoDigits"),
    "Заводской номер": optionalWithRule("serialNumber"),
    "Дата поверки": optionalWithRule("dateFormat"),
    "Дата установки": optionalWithRule("dateFormat"),
    "Межповерочный интервал, лет": optionalWithRule("intervals"),
    "Коэффициент (итоговый)": optionalWithRule("coefficients"),
    Порт: optionalWithRule("port"),
    "Номер коммуникатора (для счетчиков РиМ)": yup
      .string()
      .trim()
      .test("communicator-required-for-rim", "Обязательно для счетчиков РиМ", function (value) {
        const deviceModel = this.parent["Модель счетчика"];
        const isRimModel = isRimModelRequiringCommunicator(deviceModel);
        
        // Если это модель РиМ, поле обязательно
        if (isRimModel && (!value || value === "")) {
          return this.createError({ message: "Обязательно для счетчиков РиМ" });
        }
        
        // Если значение есть, проверяем формат (только цифры)
        if (value && value !== "") {
          const rule = VALIDATION_RULES.communicatorNumber;
          if (!rule.regex.test(value)) {
            return this.createError({ message: rule.message });
          }
        }
        
        return true;
      }),
    "Максимальная мощность, кВт": optionalWithRule("maxPower"),
    "Номер сим карты (короткий)": yup
      .string()
      .trim()
      .test("sim-short", "Заполните короткий или полный номер", function (value) {
        const fullSimValue = this.parent["Номер сим карты (полный)"];
        const hasFullSim = fullSimValue && fullSimValue.trim() !== "";
        const hasShortSim = value && value.trim() !== "";

        // Если оба пустые - ошибка
        if (!hasShortSim && !hasFullSim) {
          return this.createError({ message: "Заполните короткий или полный номер" });
        }

        // Если это поле пустое, но полный номер заполнен - ок
        if (!hasShortSim) return true;

        // Используем правило из единого источника
        const rule = VALIDATION_RULES.simCardShort;
        if (!rule.regex.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > rule.maxLength) {
          return this.createError({ message: `Максимум ${rule.maxLength} цифр` });
        }
        return true;
      }),
    "Номер сим карты (полный)": yup
      .string()
      .trim()
      .test("sim-full", "Заполните короткий или полный номер", function (value) {
        const shortSimValue = this.parent["Номер сим карты (короткий)"];
        const hasShortSim = shortSimValue && shortSimValue.trim() !== "";
        const hasFullSim = value && value.trim() !== "";

        // Если оба пустые - ошибка
        if (!hasFullSim && !hasShortSim) {
          return this.createError({ message: "Заполните короткий или полный номер" });
        }

        // Если это поле пустое, но короткий номер заполнен - ок
        if (!hasFullSim) return true;

        // Используем функцию полной валидации из единого источника
        const validation = VALIDATION_RULES.simCardFull.validateFull(value);
        if (!validation.valid) {
          return this.createError({ message: validation.message });
        }
        return true;
      }),

    // === Поля сетевого кода (если хотя бы одно заполнено - все обязательны) ===
    "Код ПС ((220)110/35-10(6)кВ": networkCodeFieldValidation("Код ПС ((220)110/35-10(6)кВ"),

    "Номер фидера 10(6)(3) кВ": networkCodeFieldValidation("Номер фидера 10(6)(3) кВ"),

    "Номер ТП 10(6)/0,4 кВ": networkCodeFieldValidation("Номер ТП 10(6)/0,4 кВ"),

    "Номер фидера 0,4 кВ": networkCodeFieldValidation("Номер фидера 0,4 кВ"),

    "Код потребителя 3х-значный": networkCodeFieldValidation("Код потребителя 3х-значный"),

    // Номер трансформаторной подстанции - обязательное поле из списка
    "Номер трансформаторной подстанции": requiredFromList(numberTPList, "Номер трансформаторной подстанции"),
  });
};

/**
 * Валидирует одну строку данных Excel.
 *
 * @param {Object} row - Данные строки
 * @param {yup.ObjectSchema} schema - Схема валидации
 * @returns {Promise<Object|null>} - Объект ошибок {поле: сообщение} или null если валидно
 */
export const validateRow = async (row, schema) => {
  try {
    await schema.validate(row, { abortEarly: false });
    return null;
  } catch (err) {
    if (err.inner) {
      const fieldErrors = {};
      err.inner.forEach((e) => {
        if (e.path && !fieldErrors[e.path]) {
          fieldErrors[e.path] = e.message;
        }
      });
      return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
    }
    return null;
  }
};

/**
 * Валидирует все строки данных Excel.
 *
 * @param {Array<Object>} rows - Массив строк данных
 * @param {yup.ObjectSchema} schema - Схема валидации
 * @returns {Promise<Object>} - Объект ошибок {индекс_строки: {поле: сообщение}}
 */
export const validateAllRows = async (rows, schema) => {
  const allErrors = {};

  await Promise.all(
    rows.map(async (row, index) => {
      const rowErrors = await validateRow(row, schema);
      if (rowErrors) {
        allErrors[index] = rowErrors;
      }
    })
  );

  return allErrors;
};
