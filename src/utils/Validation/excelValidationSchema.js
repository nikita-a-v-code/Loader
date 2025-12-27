import * as yup from "yup";
import { validateNetworkCode } from "../networkCodeValidation";

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

  // Хелпер: необязательное поле с regex (валидируем только если заполнено)
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

    // === Необязательные поля с форматом ===
    Дом: optionalWithRegex(/^\d*$/, "Только цифры"),
    "Квартира (офис)": optionalWithRegex(/^\d*$/, "Только цифры"),
    "Корпус (литера)": optionalWithRegex(/^[А-ЯA-Z]*$/, "Только заглавные буквы"),
    "Кол-во фаз": optionalWithRegex(/^\d{0,2}$/, "Максимум 1 цифра"),
    "Заводской номер": optionalWithRegex(/^\d*$/, "Только цифры"),
    "Дата поверки": optionalWithRegex(/^\d{2}\.\d{2}\.\d{4}$/, "Формат ДД.ММ.ГГГГ"),
    "Дата установки": optionalWithRegex(/^\d{2}\.\d{2}\.\d{4}$/, "Формат ДД.ММ.ГГГГ"),
    "Межповерочный интервал, лет": optionalWithRegex(/^\d{1,2}$/, "Только цифры, максимум 2"),
    "Коэффициент (итоговый)": optionalWithRegex(/^\d*$/, "Только цифры"),
    Порт: optionalWithRegex(/^\d*$/, "Только цифры"),
    "Номер коммуникатора (для счетчиков РиМ)": optionalWithRegex(/^\d*$/, "Только цифры"),
    "Максимальная мощность, кВт": optionalWithRegex(/^\d*$/, "Только цифры"),
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

        // Проверяем формат если заполнено
        if (!/^\d*$/.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > 5) {
          return this.createError({ message: "Максимум 5 цифр" });
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

        // Проверяем формат если заполнено
        if (!/^\d*$/.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > 11) {
          return this.createError({ message: "Максимум 11 цифр" });
        }
        if (value.length >= 2 && !value.startsWith("89")) {
          return this.createError({ message: "Должен начинаться с 89" });
        }
        if (value.length < 11) {
          return this.createError({ message: "Введите 11 цифр" });
        }
        return true;
      }),

    // === Поля сетевого кода (если хотя бы одно заполнено - все обязательны) ===
    "Код ПС ((220)110/35-10(6)кВ": yup
      .string()
      .trim()
      .test("ps-code", "Ошибка в коде ПС", function (value) {
        const parent = this.parent;
        const networkCodeFields = [
          "Код ПС ((220)110/35-10(6)кВ",
          "Номер фидера 10(6)(3) кВ",
          "Номер ТП 10(6)/0,4 кВ",
          "Номер фидера 0,4 кВ",
          "Код потребителя 3х-значный",
        ];
        const hasAnyValue = networkCodeFields.some((f) => parent[f] && parent[f].trim() !== "");

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
        // Код ПС: только цифры, ровно 3 символа
        if (!/^\d*$/.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > 3) {
          return this.createError({ message: "Максимум 3 цифры" });
        }
        if (value.length < 3) {
          return this.createError({ message: "Введите 3 цифры" });
        }
        // Проверка в справочнике при полном коде
        if (value.length === 3) {
          const result = validateNetworkCode(value);
          if (!result.valid) {
            return this.createError({ message: result.message });
          }
        }
        return true;
      }),

    "Номер фидера 10(6)(3) кВ": yup
      .string()
      .trim()
      .test("feeder-10", "Ошибка в номере фидера 10кВ", function (value) {
        const parent = this.parent;
        const networkCodeFields = [
          "Код ПС ((220)110/35-10(6)кВ",
          "Номер фидера 10(6)(3) кВ",
          "Номер ТП 10(6)/0,4 кВ",
          "Номер фидера 0,4 кВ",
          "Код потребителя 3х-значный",
        ];
        const hasAnyValue = networkCodeFields.some((f) => parent[f] && parent[f].trim() !== "");

        if (!hasAnyValue) return true;

        if (!value || value === "") {
          return this.createError({ message: "Заполните поле" });
        }
        // Проверка на пробелы
        if (value.includes(" ")) {
          return this.createError({ message: "Пробелы не допускаются" });
        }
        // Только цифры, ровно 3 символа
        if (!/^\d*$/.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > 3) {
          return this.createError({ message: "Максимум 3 цифры" });
        }
        if (value.length < 3) {
          return this.createError({ message: "Введите 3 цифры" });
        }
        return true;
      }),

    "Номер ТП 10(6)/0,4 кВ": yup
      .string()
      .trim()
      .test("tp-number", "Ошибка в номере ТП", function (value) {
        const parent = this.parent;
        const networkCodeFields = [
          "Код ПС ((220)110/35-10(6)кВ",
          "Номер фидера 10(6)(3) кВ",
          "Номер ТП 10(6)/0,4 кВ",
          "Номер фидера 0,4 кВ",
          "Код потребителя 3х-значный",
        ];
        const hasAnyValue = networkCodeFields.some((f) => parent[f] && parent[f].trim() !== "");

        if (!hasAnyValue) return true;

        if (!value || value === "") {
          return this.createError({ message: "Заполните поле" });
        }
        // Проверка на пробелы
        if (value.includes(" ")) {
          return this.createError({ message: "Пробелы не допускаются" });
        }
        // Цифры и заглавные буквы, ровно 2 символа
        if (!/^[\dА-ЯA-Z]*$/.test(value)) {
          return this.createError({ message: "Только цифры и заглавные буквы" });
        }
        if (value.length > 2) {
          return this.createError({ message: "Максимум 2 символа" });
        }
        if (value.length < 2) {
          return this.createError({ message: "Введите 2 символа" });
        }
        return true;
      }),

    "Номер фидера 0,4 кВ": yup
      .string()
      .trim()
      .test("feeder-04", "Ошибка в номере фидера 0,4кВ", function (value) {
        const parent = this.parent;
        const networkCodeFields = [
          "Код ПС ((220)110/35-10(6)кВ",
          "Номер фидера 10(6)(3) кВ",
          "Номер ТП 10(6)/0,4 кВ",
          "Номер фидера 0,4 кВ",
          "Код потребителя 3х-значный",
        ];
        const hasAnyValue = networkCodeFields.some((f) => parent[f] && parent[f].trim() !== "");

        if (!hasAnyValue) return true;

        if (!value || value === "") {
          return this.createError({ message: "Заполните поле" });
        }
        // Проверка на пробелы
        if (value.includes(" ")) {
          return this.createError({ message: "Пробелы не допускаются" });
        }
        // Цифры и заглавные буквы, ровно 2 символа
        if (!/^[\dА-ЯA-Z]*$/.test(value)) {
          return this.createError({ message: "Только цифры и заглавные буквы" });
        }
        if (value.length > 2) {
          return this.createError({ message: "Максимум 2 символа" });
        }
        if (value.length < 2) {
          return this.createError({ message: "Введите 2 символа" });
        }
        return true;
      }),

    "Код потребителя 3х-значный": yup
      .string()
      .trim()
      .test("consumer-code", "Ошибка в коде потребителя", function (value) {
        const parent = this.parent;
        const networkCodeFields = [
          "Код ПС ((220)110/35-10(6)кВ",
          "Номер фидера 10(6)(3) кВ",
          "Номер ТП 10(6)/0,4 кВ",
          "Номер фидера 0,4 кВ",
          "Код потребителя 3х-значный",
        ];
        const hasAnyValue = networkCodeFields.some((f) => parent[f] && parent[f].trim() !== "");

        if (!hasAnyValue) return true;

        if (!value || value === "") {
          return this.createError({ message: "Заполните поле" });
        }
        // Проверка на пробелы
        if (value.includes(" ")) {
          return this.createError({ message: "Пробелы не допускаются" });
        }
        // Только цифры, ровно 3 символа
        if (!/^\d*$/.test(value)) {
          return this.createError({ message: "Только цифры" });
        }
        if (value.length > 3) {
          return this.createError({ message: "Максимум 3 цифры" });
        }
        if (value.length < 3) {
          return this.createError({ message: "Введите 3 цифры" });
        }
        return true;
      }),
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
