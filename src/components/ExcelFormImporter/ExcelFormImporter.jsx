import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Grid,
  Autocomplete,
} from "@mui/material";
import ApiService from "../../services/api";
import { validators, validateField } from "../../utils/Validation/Validation";

/*
  Загрузка Excel файла, валидация полей и исправление значений в UI.
  - Парсит первый лист Excel через библиотеку `xlsx` (динамический импорт).
  - Ожидает, что заголовки столбцов соответствуют именам полей формы (SingleForm).
  - Валидация выполняется для полей, для которых определены `validators`.
  - Пользователь может править значения прямо в таблице; некорректные значения подсвечиваются.
  - После исправления можно экспортировать скорректированные данные обратно (через `ApiService.exportToExcel`).
*/

const ExcelFormImporter = () => {
  // === State для данных из Excel ===
  const [headers, setHeaders] = useState([]); // Заголовки колонок из Excel файла (массив строк)
  const [rows, setRows] = useState([]); // Данные строк из Excel (массив объектов {заголовок: значение})

  // === State для валидации ===
  const [errors, setErrors] = useState({}); // Объект ошибок валидации {индекс_строки: {поле: сообщение_ошибки}}
  const [validationSuccess, setValidationSuccess] = useState(false); // Флаг успешной валидации всех данных

  // === State для UI и статуса загрузки ===
  const [loadError, setLoadError] = useState(null); // Ошибка при загрузке/парсинге Excel файла
  const [showOnlyErrors, setShowOnlyErrors] = useState(false); // Показывать только строки с ошибками (не используется)
  const [fileLoading, setFileLoading] = useState(false); // Индикатор загрузки файла

  // === State для отправки на email ===
  const [emailDialog, setEmailDialog] = useState(false); // Флаг открытия диалога отправки на email
  const [email, setEmail] = useState("nikitaav_oit@komenergo.kirov.ru"); // Email адрес для отправки
  const [emailSending, setEmailSending] = useState(false); // Индикатор отправки email

  // === State для справочников структуры (загружаются с сервера) ===
  const [mpesList, setMpesList] = useState([]); // Список МПЭС для выбора (массив названий)
  const [rkesList, setRkesList] = useState([]); // Список РКЭС для выбора (массив названий)
  const [masterUnitsList, setMasterUnitsList] = useState([]); // Список Мастерских участков для выбора (массив названий)

  // === State для населенных пунктов и улиц (загружаются с сервера) ===
  const [settlementList, setSettlementList] = useState([]); // Список населенных пунктов для выбора (массив названий)
  const [settlementListFull, setSettlementListFull] = useState([]); // Полные данные населенных пунктов (с id)
  const [streetsBySettlement, setStreetsBySettlement] = useState({}); // Улицы по населенным пунктам {settlementName: [streets]}

  // === State для типа абонента и статуса счета (загружаются с сервера) ===
  const [subscriberList, setSubscriberList] = useState([]); // Список типов абонентов для выбора (массив названий)
  const [statusList, setStatusList] = useState([]); // Список статусов счета для выбора (массив названий)

  // === State для моделей счетчиков и паролей (загружаются с сервера) ===
  const [deviceList, setDeviceList] = useState([]); // Список моделей счетчиков для выбора (массив названий)
  const [deviceListFull, setDeviceListFull] = useState([]); // Полные данные моделей счетчиков (с паролями)

  // === State для IP адресов (загружаются с сервера) ===
  const [ipAddressList, setIpAddressList] = useState([]); // Список IP адресов для автозаполнения (массив объектов)

  /**
   * Ожидаемые заголовки колонок в Excel файле (для справки).
   * Определяет правильную структуру импортируемого файла.
   */
  const expectedHeaders = [
    "Организация",
    "Подразделение (МПЭС)",
    "РКЭС",
    "Мастерский участок",
    "Населенный пункт",
    "Микрорайон/квартал",
    "Улица",
    "Дом",
    "Корпус (литера)",
    "Квартира (офис)",
    "Наименование потребителя",
    "Наименование точки поставки",
    "Тип абонента",
    "Статус счета",
    "Номер договора (лицевой счет)",
    "Код ПС ((220)110/35-10(6)кВ",
    "Номер фидера 10(6)(3) кВ",
    "Номер ТП 10(6)/0,4 кВ",
    "Номер фидера 0,4 кВ",
    "Код потребителя 3х-значный",
    "Номер опоры 0,4 кВ",
    "Максимальная мощность, кВт",
    "Модель счетчика",
    "Кол-во фаз",
    "Заводской номер",
    "Дата поверки",
    "Межповерочный интервал, лет",
    "Дата установки",
    "Номер пломбы на клеммной крышке",
    "Номер пломбы на корпусе счетчика",
    "Тип ТТ",
    'Заводской номер ТТ "А"',
    'Заводской номер ТТ "В"',
    'Заводской номер ТТ "С"',
    'Дата поверки ТТ "А"',
    "Межповерочный интервал, лет",
    'Дата поверки ТТ "В"',
    "Межповерочный интервал, лет",
    'Дата поверки ТТ "С"',
    "Межповерочный интервал, лет",
    "Коэффициент трансформации ТТ",
    '№ пломбы ТТ "А"',
    '№ пломбы ТТ "В"',
    '№ пломбы ТТ "С"',
    "Тип ТН",
    'Заводской номер ТН "А"',
    'Заводской номер ТН "В"',
    'Заводской номер ТН "С"',
    'Дата поверки ТН "А"',
    "Межповерочный интервал, лет",
    'Дата поверки ТН "В"',
    "Межповерочный интервал, лет",
    'Дата поверки ТН "С"',
    "Межповерочный интервал, лет",
    "Коэффициент трансформации ТН",
    '№ пломбы ТН "А"',
    '№ пломбы ТН "В"',
    '№ пломбы ТН "С"',
    "Примечание",
    "Сетевой адрес",
    "Номер сим карты (полный)",
    "Номер сим карты (короткий)",
    "IP адрес",
    "Номер коммуникатора (для счетчиков РиМ)",
    "Пароль на конфигурирование",
    "Дополнительные параметры счетчика",
    "Номера ком портов (указываем через запятую пример 3,4,5)",
    "Порт",
    "Наименование соединения",
    "Коэффициент (итоговый)",
    "Запросы",
    "Протокол",
    "Наименование УСПД",
    "Тип УСПД",
    "Серийный номер УСПД",
    "Пользователь УСПД",
    "Пароль УСПД",
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Автоматически заполняем пароли когда загружены модели счетчиков и есть данные
  useEffect(() => {
    if (deviceListFull.length > 0 && rows.length > 0) {
      autofillPasswords();
    }
  }, [deviceListFull]);

  // Автоматически заполняем IP адреса когда загружены IP адреса и есть данные
  useEffect(() => {
    if (ipAddressList.length > 0 && rows.length > 0) {
      autofillIpAddresses();
    }
  }, [ipAddressList]);

  /**
   * Загружает справочники структуры организации с сервера.
   * Вызывается один раз при монтировании компонента.
   * Загружает: МПЭС, РКЭС, Мастерские участки.
   * Результаты сохраняются в state для использования в Autocomplete полях.
   */
  const loadData = async () => {
    try {
      const [mpes, rkes, mu, settlements, subscriberType, accountStatus, deviceModel, ipAddresses] = await Promise.all([
        ApiService.getMpes(),
        ApiService.getRkes(),
        ApiService.getMasterUnits(),
        ApiService.getSettlements(),
        ApiService.getAbonentTypes(),
        ApiService.getStatuses(),
        ApiService.getDevices(),
        ApiService.getIpAddresses(),
      ]);
      setMpesList(mpes.map((item) => item.name));
      setRkesList(rkes.map((item) => item.name));
      setMasterUnitsList(mu.map((item) => item.name));
      setSettlementList(settlements.map((item) => item.name));
      setSettlementListFull(settlements); // Сохраняем полные данные с id
      setSubscriberList(subscriberType.map((item) => item.name));
      setStatusList(accountStatus.map((item) => item.name));
      setDeviceList(deviceModel.map((item) => item.name));
      setDeviceListFull(deviceModel); // Сохраняем полные данные с паролями
      setIpAddressList(ipAddresses); // Сохраняем список IP адресов
    } catch (error) {
      console.error("Ошибка при загрузке структурных данных:", error);
    }
  };

  /**
   * Загружает улицы для конкретного населенного пункта.
   * Кэширует результат в streetsBySettlement.
   * @param {string} settlementName - Название населенного пункта
   */
  const loadStreetsForSettlement = async (settlementName) => {
    if (!settlementName || streetsBySettlement[settlementName]) return;

    try {
      const settlement = settlementListFull.find((s) => s.name === settlementName);
      if (!settlement) return;

      const streets = await ApiService.getStreetsBySettlement(settlement.id);
      setStreetsBySettlement((prev) => ({
        ...prev,
        [settlementName]: streets.map((s) => s.name),
      }));
    } catch (error) {
      console.error("Ошибка при загрузке улиц:", error);
    }
  };

  /**
   * Маппинг русских заголовков Excel на ключи валидаторов.
   * Используется для определения, какой валидатор применить к конкретному полю.
   * Ключи с mpes/rkes/masterUnit/settlement/street - обязательные поля структуры.
   */
  const headerToValidatorKey = {
    "Номер сим карты (полный)": "simCardFull",
    "Номер сим карты (короткий)": "simCardShort",
    Порт: "port",
    "Номер коммуникатора (для счетчиков РиМ)": "communicatorNumber",
    "Заводской номер": "serialNumber",
    "Дата поверки": "dateFormat",
    "Дата установки": "dateFormat",
    "Межповерочный интервал, лет": "intervals",
    "Коэффициент (итоговый)": "coefficients",
    Дом: "digits",
    "Квартира (офис)": "digits",
    "Корпус (литера)": "uppercaseLetters",
    "Кол-во фаз": "twoDigits",
    "Подразделение (МПЭС)": "mpes",
    РКЭС: "rkes",
    "Мастерский участок": "masterUnit",
    "Населенный пункт": "settlement",
    Улица: "street",
    "Тип абонента": "subscriberType",
    "Статус счета": "accountStatus",
    "Модель счетчика": "deviceModel",
    "Пароль на конфигурирование": "password",
  };

  /**
   * Возвращает список опций для Autocomplete поля на основе заголовка.
   * Используется для структурных полей (МПЭС, РКЭС, МУ, населенный пункт, улица).
   * @param {string} header - Заголовок поля из Excel
   * @param {Object} row - Данные строки (для определения выбранного населенного пункта)
   * @returns {Array<string>} - Массив доступных опций или пустой массив
   */
  const getOptionsForField = (header, row = {}) => {
    const headerTrimmed = (header || "").trim();

    if (headerTrimmed === "Подразделение (МПЭС)") return mpesList;
    if (headerTrimmed === "РКЭС") return rkesList;
    if (headerTrimmed === "Мастерский участок") return masterUnitsList;
    if (headerTrimmed === "Населенный пункт") {
      return settlementList;
    }
    if (headerTrimmed === "Улица") {
      const settlementName = row["Населенный пункт"];
      return settlementName && streetsBySettlement[settlementName] ? streetsBySettlement[settlementName] : [];
    }
    if (headerTrimmed === "Тип абонента") return subscriberList;
    if (headerTrimmed === "Статус счета") {
      return statusList;
    }
    if (headerTrimmed === "Модель счетчика") return deviceList;

    // Дополнительная проверка через валидатор
    const validatorKey = headerToValidatorKey[headerTrimmed];
    if (validatorKey === "mpes") return mpesList;
    if (validatorKey === "rkes") return rkesList;
    if (validatorKey === "masterUnit") return masterUnitsList;
    if (validatorKey === "settlement") return settlementList;
    if (validatorKey === "street") {
      const settlementName = row["Населенный пункт"];
      return settlementName && streetsBySettlement[settlementName] ? streetsBySettlement[settlementName] : [];
    }
    if (validatorKey === "subscriberType") return subscriberList;
    if (validatorKey === "accountStatus") return statusList;
    if (validatorKey === "deviceModel") return deviceList;

    return [];
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
  const getSimilarOptions = (value, options) => {
    if (!value || value.trim() === "") return options;

    const searchValue = value.toLowerCase();
    // Нормализованная версия (без дефисов, пробелов, тире, точек и распространенных префиксов)
    const normalizeStreet = (str) => {
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

    const searchNormalized = normalizeStreet(searchValue);

    // Функция вычисления расстояния Левенштейна (для опечаток)
    const levenshteinDistance = (str1, str2) => {
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

  /**
   * Обработчик загрузки Excel файла.
   * Парсит файл через библиотеку xlsx, извлекает заголовки и данные.
   * Структура файла:
   * - Строка 0: Групповые заголовки (объединённые ячейки)
   * - Строка 1: Фактические названия полей
   * - Строка 2+: Данные
   *
   * @param {Event} e - Event от input file
   */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadError(null);
    setFileLoading(true);

    try {
      const XLSX = await import(/* webpackChunkName: "xlsx" */ "xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Получаем данные как массив массивов, чтобы сохранить заголовки
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!sheetData || sheetData.length === 0) {
        setLoadError("Пустой лист в файле");
        return;
      }

      // Excel, генерируемый сервером, содержит две заголовочные строки:
      // 0: групповые заголовки (section headers), 1: фактические имена колонок
      const rawHdrRow = sheetData[1] && sheetData[1].length > 0 ? sheetData[1] : sheetData[0];
      const hdrs = rawHdrRow.map((h) => String(h || "").trim());
      // Данные начинаются с индекса 2 (пропускаем обе строки заголовков)
      const content = sheetData
        .slice(2)
        .map((rowArr) => {
          const obj = {};
          hdrs.forEach((h, i) => {
            obj[h] = rowArr[i] !== undefined && rowArr[i] !== null ? String(rowArr[i]).trim() : "";
          });
          return obj;
        })
        .filter((row) => {
          // Фильтруем полностью пустые строки
          return Object.values(row).some((val) => val !== "");
        });

      // Если заголовки не совпадают с ожидаемыми, сохраняем всё равно — пользователь увидит столбцы
      // Сначала автоматически заполняем пароли и IP адреса
      let processedContent = content;
      if (deviceListFull.length > 0) {
        processedContent = autofillPasswords(processedContent);
      }
      if (ipAddressList.length > 0) {
        processedContent = autofillIpAddresses(processedContent);
      }

      setHeaders(hdrs);
      setRows(processedContent);
      setErrors({});
      setShowOnlyErrors(false);
      setValidationSuccess(false);

      // Сбрасываем значение input чтобы можно было загрузить тот же файл снова
      e.target.value = "";
    } catch (err) {
      console.error("Error parsing Excel:", err);
      setLoadError(String(err.message || err));
    } finally {
      setFileLoading(false);
    }
  };

  /**
   * Автоматически заполняет пароли для моделей счетчиков.
   * Если модель счетчика заполнена и найдена в списке, а пароль пустой - подставляет пароль.
   * @param {Array} dataRows - Массив строк данных (по умолчанию rows из state)
   * @returns {Array} - Обновленный массив с заполненными паролями
   */
  const autofillPasswords = (dataRows = null) => {
    const rowsToProcess = dataRows || rows;

    // Функция нормализации названия модели (убирает пробелы, дефисы, приводит к нижнему регистру)
    const normalizeModel = (str) => {
      if (!str) return "";
      return str.toLowerCase().replace(/[\s-]/g, "");
    };

    const updated = rowsToProcess.map((row, idx) => {
      const modelValue = row["Модель счетчика"];
      const passwordValue = row["Пароль на конфигурирование"] || "";

      // Если модель указана, пароль пустой, и модель есть в базе
      if (modelValue && passwordValue.trim() === "") {
        // Нечеткий поиск модели (игнорируем пробелы, дефисы, регистр)
        const normalizedInput = normalizeModel(modelValue);
        const device = deviceListFull.find((d) => normalizeModel(d.name) === normalizedInput);

        if (device && device.password) {
          return {
            ...row,
            "Модель счетчика": device.name, // Исправляем на правильное название из БД
            "Пароль на конфигурирование": device.password,
          };
        }
      }
      return row;
    });

    // Обновляем state только если не передали dataRows
    if (!dataRows) {
      setRows(updated);
    }

    return updated;
  };

  /**
   * Автоматически заполняет IP адреса для строк где они пустые.
   * Подставляет первый доступный IP адрес из списка.
   * @param {Array} dataRows - Массив строк данных (по умолчанию rows из state)
   * @returns {Array} - Обновленный массив с заполненными IP адресами
   */
  const autofillIpAddresses = (dataRows = null) => {
    const rowsToProcess = dataRows || rows;

    // Если нет IP адресов в списке, не заполняем
    if (!ipAddressList || ipAddressList.length === 0) {
      return rowsToProcess;
    }

    // Берем первый IP адрес из списка
    const defaultIpAddress = ipAddressList[0]?.address || "";

    const updated = rowsToProcess.map((row) => {
      const ipValue = row["IP адрес"] || "";

      // Если IP адрес пустой, подставляем значение по умолчанию
      if (ipValue.trim() === "" && defaultIpAddress) {
        return {
          ...row,
          "IP адрес": defaultIpAddress,
        };
      }
      return row;
    });

    // Обновляем state только если не передали dataRows
    if (!dataRows) {
      setRows(updated);
    }

    return updated;
  };

  /**
   * Автоматически назначает порты для всех строк где они пустые.
   * Для каждой строки с пустым портом получает следующий доступный порт и сохраняет его в БД.
   * @param {Array} dataRows - Массив строк данных (по умолчанию rows из state)
   * @returns {Array} - Обновленный массив с назначенными портами
   */
  const assignPortsToRows = async (dataRows = null) => {
    const rowsToProcess = dataRows || rows;

    const updated = [];

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const portValue = row["Порт"] || "";

      // Если порт пустой, назначаем новый
      if (portValue.trim() === "") {
        try {
          // Получаем следующий доступный порт
          const { nextPort } = await ApiService.getNextPort();
          const portStr = String(nextPort);

          // Сохраняем порт в базу данных
          await ApiService.createPort({
            portNumber: portStr,
            description: `Автоматически назначен для ${row["Наименование потребителя"] || "потребителя"}`,
          });

          updated.push({
            ...row,
            Порт: portStr,
          });
        } catch (err) {
          console.error("Error assigning port for row", i, ":", err);
          // Если ошибка - оставляем строку без изменений
          updated.push(row);
        }
      } else {
        // Порт уже заполнен - не меняем
        updated.push(row);
      }
    }

    // Обновляем state только если не передали dataRows
    if (!dataRows) {
      setRows(updated);
    }

    return updated;
  };

  /**
   * Валидирует все строки данных из Excel.
   * Проверяет:
   * 1. Структурные поля (МПЭС, РКЭС, МУ) - обязательны и должны быть из списка
   * 2. Остальные поля - валидация по правилам из validators (если заполнены)
   *
   * После валидации автоматически показывает только строки с ошибками.
   * @returns {Object} - Объект ошибок {индекс_строки: {поле: сообщение}}
   */
  const validateAll = async () => {
    // Сначала загружаем улицы для всех уникальных населенных пунктов
    const uniqueSettlements = [...new Set(rows.map((row) => row["Населенный пункт"]).filter(Boolean))];
    await Promise.all(uniqueSettlements.map((settlementName) => loadStreetsForSettlement(settlementName)));

    const newErrors = {};
    rows.forEach((row, ri) => {
      headers.forEach((header) => {
        const val = row[header] ?? "";
        const validatorKey = headerToValidatorKey[header];

        // Проверка структурных полей (обязательные для заполнения)
        if (validatorKey === "mpes") {
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!mpesList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "rkes") {
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!rkesList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "masterUnit") {
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!masterUnitsList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "settlement") {
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!settlementList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "street") {
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else {
            const settlementName = row["Населенный пункт"];
            const streetsForSettlement =
              settlementName && streetsBySettlement[settlementName] ? streetsBySettlement[settlementName] : [];
            if (settlementName && streetsForSettlement.length > 0 && !streetsForSettlement.includes(val)) {
              newErrors[ri] = newErrors[ri] || {};
              newErrors[ri][header] = "Неверное значение. Выберите из списка";
            } else if (settlementName && streetsForSettlement.length === 0) {
              // Если населенный пункт указан, но улиц не загружено - это ошибка
              newErrors[ri] = newErrors[ri] || {};
              newErrors[ri][header] = "Нет улиц для выбранного населенного пункта";
            }
          }
        } else if (validatorKey === "subscriberType") {
          // Тип абонента - обязательное поле
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!subscriberList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "accountStatus") {
          // Статус счета - обязательное поле
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!statusList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (validatorKey === "deviceModel") {
          // Модель счетчика - обязательное поле
          if (val.trim() === "") {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Поле обязательно для заполнения";
          } else if (!deviceList.includes(val)) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = "Неверное значение. Выберите из списка";
          }
        } else if (val.trim() !== "" && validatorKey && validators[validatorKey]) {
          // Для остальных полей валидируем только непустые
          const isValid = validateField(val, validators[validatorKey]);
          if (!isValid) {
            newErrors[ri] = newErrors[ri] || {};
            newErrors[ri][header] = validators[validatorKey].message || "Неверный формат";
          }
        }
      });
    });
    setErrors(newErrors);
    // Автоматически показываем только строки с ошибками
    if (Object.keys(newErrors).length > 0) {
      setShowOnlyErrors(true);
      setValidationSuccess(false);
    } else {
      setValidationSuccess(true);
    }
    return newErrors;
  };

  /**
   * Обработчик изменения значения в ячейке.
   * Обновляет данные строки и удаляет ошибку для изменённого поля.
   * При изменении населенного пункта - загружает улицы и ищет похожую улицу в новом НП.
   *
   * @param {number} ri - Индекс строки
   * @param {string} field - Название поля (заголовок)
   * @param {string} value - Новое значение
   */
  const handleCellChange = async (ri, field, value) => {
    // Если изменили модель счетчика - автоматически подставляем соответствующий пароль
    if (field === "Модель счетчика" && value) {
      const device = deviceListFull.find((d) => d.name === value);
      if (device && device.password) {
        setRows((prev) => {
          const copy = [...prev];
          copy[ri] = {
            ...copy[ri],
            [field]: value,
            "Пароль на конфигурирование": device.password,
          };
          return copy;
        });

        setErrors((prev) => {
          const copy = { ...prev };
          if (copy[ri]) {
            delete copy[ri][field];
            if (Object.keys(copy[ri]).length === 0) delete copy[ri];
          }
          return copy;
        });
        setValidationSuccess(false);
        return;
      }
    }

    // Если изменили населенный пункт - ищем похожую улицу в новом НП
    if (field === "Населенный пункт" && value) {
      const currentStreet = rows[ri]["Улица"];

      // Загружаем улицы нового населенного пункта
      await loadStreetsForSettlement(value);

      // Ищем похожую улицу в новом населенном пункте
      const newStreets = streetsBySettlement[value] || [];
      if (currentStreet && newStreets.length > 0) {
        // Используем существующий алгоритм нечеткого поиска
        const similarStreets = getSimilarOptions(currentStreet, newStreets);

        if (similarStreets.length > 0) {
          const bestMatch = similarStreets[0];

          // Функция нормализации улицы (та же что в getSimilarOptions)
          const normalizeStreet = (str) => {
            let normalized = str.toLowerCase();
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
            return normalized.replace(/[-\s—.]/g, "");
          };

          // Проверяем качество совпадения используя ту же нормализацию
          const currentLower = currentStreet.toLowerCase();
          const currentNormalized = normalizeStreet(currentStreet);
          const bestMatchLower = bestMatch.toLowerCase();
          const bestMatchNormalized = normalizeStreet(bestMatch);

          const isExactMatch = bestMatch === currentStreet;
          const isGoodMatch =
            isExactMatch ||
            bestMatchLower === currentLower ||
            bestMatchNormalized === currentNormalized ||
            ((bestMatchNormalized.startsWith(currentNormalized) || currentNormalized.startsWith(bestMatchNormalized)) &&
              Math.abs(bestMatchNormalized.length - currentNormalized.length) <= 10);

          if (isGoodMatch) {
            // Нашли хорошее совпадение - подставляем его
            setRows((prev) => {
              const copy = [...prev];
              copy[ri] = {
                ...copy[ri],
                [field]: value,
                Улица: bestMatch,
              };
              return copy;
            });

            setErrors((prev) => {
              const copy = { ...prev };
              if (copy[ri]) {
                delete copy[ri][field];
                // Удаляем ошибку улицы если нормализованные значения совпадают
                if (currentNormalized === bestMatchNormalized) {
                  delete copy[ri]["Улица"];
                }
                if (Object.keys(copy[ri]).length === 0) delete copy[ri];
              }
              return copy;
            });
            setValidationSuccess(false);
            return;
          }
        }
      }

      // Если не нашли хорошего совпадения - просто меняем населенный пункт, улицу оставляем как есть
      setRows((prev) => {
        const copy = [...prev];
        copy[ri] = {
          ...copy[ri],
          [field]: value,
        };
        return copy;
      });

      setErrors((prev) => {
        const copy = { ...prev };
        if (copy[ri]) {
          delete copy[ri][field];
          if (Object.keys(copy[ri]).length === 0) delete copy[ri];
        }
        return copy;
      });
      setValidationSuccess(false);
      return;
    }

    setRows((prev) => {
      const copy = [...prev];
      copy[ri] = { ...copy[ri], [field]: value };
      return copy;
    });

    // удаляем ошибку для этого поля при изменении
    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[ri]) {
        delete copy[ri][field];
        if (Object.keys(copy[ri]).length === 0) delete copy[ri];
      }
      return copy;
    });
    setValidationSuccess(false);
  };

  /**
   * Экспортирует исправленные данные в Excel файл.
   * Перед экспортом выполняет валидацию всех данных.
   * Отправляет данные с русскими заголовками - сервер сам преобразует через excelUtils.js.
   * После успешного экспорта браузер скачает файл.
   */
  const handleExport = async () => {
    // Перед экспортом прогоняем валидацию
    const validation = await validateAll();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед экспортом.");
      return;
    }

    try {
      // Экспортируем данные без автозаполнения паролей
      await ApiService.exportToExcel(rows);
    } catch (err) {
      console.error("Export error:", err);
      alert("Ошибка при экспорте: " + err.message);
    }
  };

  /**
   * Отправляет исправленный Excel файл на указанный email.
   * Перед отправкой:
   * 1. Проверяет корректность email адреса
   * 2. Валидирует все данные
   * Использует сервер для генерации и отправки файла через nodemailer.
   */
  const handleSendToEmail = async () => {
    if (!email || !email.includes("@")) {
      alert("Введите корректный email адрес");
      return;
    }

    // Перед отправкой прогоняем валидацию
    const validation = await validateAll();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед отправкой.");
      return;
    }

    try {
      setEmailSending(true);

      // Автоматически заполняем пароли для известных моделей счетчиков перед отправкой
      let processedData = autofillPasswords(rows);

      // Автоматически назначаем порты для всех строк с пустым полем "Порт"
      processedData = await assignPortsToRows(processedData);

      // Отправляем данные с заполненными паролями и портами
      await ApiService.sendExcelToEmail(processedData, email);
      alert(`Файл успешно отправлен на ${email}`);
      setEmailDialog(false);
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      alert("Ошибка при отправке на email");
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: "left" }}>
        Импорт Excel
      </Typography>

      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Button variant="outlined" component="label" disabled={fileLoading}>
          Выбрать файл
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} hidden />
        </Button>
        {fileLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Загрузка файла...
            </Typography>
          </Box>
        )}
        {!fileLoading && rows.length > 0 && (
          <Typography variant="body2" color="success.main">
            ✓ Файл загружен
          </Typography>
        )}
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка при загрузке файла: {loadError}
        </Alert>
      )}

      {rows.length > 0 && !validationSuccess && Object.keys(errors).length === 0 && (
        <Box sx={{ mb: 2, textAlign: "left" }}>
          <Button variant="outlined" onClick={validateAll} size="large">
            Проверить данные
          </Button>
        </Box>
      )}

      {validationSuccess && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Проверка пройдена успешно! Все данные корректны. Теперь вы можете экспортировать файл.
          </Alert>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleExport}>
              Экспортировать исправленный Excel
            </Button>
            <Button variant="contained" onClick={() => setEmailDialog(true)} color="primary">
              Отправить на Email
            </Button>
          </Box>
        </Box>
      )}

      {Object.keys(errors).length > 0 && (
        <>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Alert severity="error" sx={{ flex: 1 }}>
              Найдено ошибок: {Object.keys(errors).length} строк(и) из {rows.length}
            </Alert>
            <Button variant="outlined" onClick={validateAll}>
              Проверить повторно
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {rows
              .map((row, ri) => ({ row, ri }))
              .filter(({ ri }) => errors[ri])
              .map(({ row, ri }) => (
                <Card
                  key={ri}
                  variant="outlined"
                  sx={{
                    border: errors[ri] ? "2px solid #d32f2f" : "1px solid #e0e0e0",
                    backgroundColor: errors[ri] ? "#ffebee" : "#fff",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ mb: 1, color: "error.main" }}>
                      Точка учета #{ri + 1} (из Excel файла)
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2, color: "text.secondary" }}>
                      Ошибочные поля: {Object.keys(errors[ri] || {}).join(", ")}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {headers
                        .filter((h) => errors[ri]?.[h])
                        .map((h, idx) => {
                          const options = getOptionsForField(h, row);
                          const isStructureField =
                            options.length > 0 ||
                            h === "Улица" ||
                            h === "Тип абонента" ||
                            h === "Статус счета" ||
                            h === "Модель счетчика";

                          return (
                            <Grid item xs={12} sm={6} md={4} key={`${h}-${idx}`}>
                              {isStructureField ? (
                                <Autocomplete
                                  options={options}
                                  value={row[h] ?? ""}
                                  inputValue={row[h] ?? ""}
                                  filterOptions={(opts, state) => {
                                    // Для типа абонента, статуса счета и модели счетчика - стандартная фильтрация без fuzzy search
                                    if (h === "Тип абонента" || h === "Статус счета" || h === "Модель счетчика") {
                                      const searchValue = (state.inputValue || "").toLowerCase();
                                      return opts.filter((opt) => opt.toLowerCase().includes(searchValue));
                                    }
                                    // Для остальных полей используем fuzzy search
                                    const searchValue = state.inputValue || row[h] || "";
                                    return getSimilarOptions(searchValue, opts);
                                  }}
                                  onChange={(event, newValue) => {
                                    if (newValue) {
                                      handleCellChange(ri, h, newValue);
                                    }
                                  }}
                                  onInputChange={(event, newInputValue) => {
                                    if (event) {
                                      handleCellChange(ri, h, newInputValue);
                                    }
                                  }}
                                  freeSolo
                                  openOnFocus
                                  disableClearable
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      label={h}
                                      error={Boolean(errors[ri]?.[h])}
                                      helperText={errors[ri]?.[h] || ""}
                                      variant="outlined"
                                      size="small"
                                    />
                                  )}
                                />
                              ) : (
                                <TextField
                                  label={h}
                                  value={row[h] ?? ""}
                                  onChange={(e) => handleCellChange(ri, h, e.target.value)}
                                  error={Boolean(errors[ri]?.[h])}
                                  helperText={errors[ri]?.[h] || ""}
                                  variant="outlined"
                                  fullWidth
                                  size="small"
                                  multiline
                                  maxRows={3}
                                />
                              )}
                            </Grid>
                          );
                        })}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
          </Box>
        </>
      )}

      {/* Диалог для ввода email */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отправить Excel файл на электронную почту</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email адрес"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)}>Отмена</Button>
          <Button onClick={handleSendToEmail} variant="contained" disabled={emailSending}>
            {emailSending ? "Отправляем..." : "Отправить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExcelFormImporter;
