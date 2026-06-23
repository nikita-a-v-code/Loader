/**
 * useExportUtils - утилиты для экспорта данных в Excel и отправки на email
 *
 * Основные функции:
 * 1. checkCardRequiredFields - проверка обязательных полей в одной карточке
 * 2. checkAllCardsRequiredFields - проверка всех карточек
 * 3. countFilledCards - подсчет заполненных карточек
 * 4. getExportFormData - преобразование formData для экспорта
 * 5. exportCardsToExcel - экспорт всех карточек в Excel файл
 * 6. sendCardsToEmail - отправка Excel файлов на email
 *
 * ObjectID логика:
 * - В момент экспорта/отправки все использованные objectID помечаются как is_used = TRUE в БД
 * - ObjectID привязан к пользователю (userId) для аудита
 * - В режиме KE: objectID остается в основном файле, удаляется из КЭ-файла (счетчики с КЭ не используют objectID)
 */
import ApiService from "../../../services/api";
import { calculateNetworkAddress } from "../../../utils/networkAdress";
import { isRimModelRequiringCommunicator } from "../../../utils/Validation/validationRules";
import { transformToKe, getKeFilename } from "../utils/keTransformer";

/**
 * Список обязательных полей для валидации
 */
export const REQUIRED_FIELDS = [
  "s1",
  "s2",
  "s3",
  "settlement",
  "street",
  "consumerName",
  "subscriberType",
  "accountStatus",
  "typeDevice",
  "serialNumber",
  "password",
  "transformerSubstationNumber",
  "ttCoeff",
  "tnCoeff",
  "protocol",
  "advSettings",
  "requests",
];

/**
 * Проверка заполненности обязательных полей для одной карточки
 *
 * Обязательные поля:
 * - Структура: s1, s2, s3
 * - Адрес: settlement, street
 * - Потребитель: consumerName, subscriberType, accountStatus
 * - Прибор учета: typeDevice, serialNumber, password
 * - Сетевой код: transformerSubstationNumber
 * - Коэффициенты: ttCoeff, tnCoeff
 * - Связь: simCardShort или simCardFull, protocol, advSettings, requests
 *
 * Дополнительно: если модель счетчика РиМ, проверяется номер коммуникатора
 *
 * @param {Object} formData - данные формы карточки
 * @returns {boolean} - true если все обязательные поля заполнены
 */
export const checkCardRequiredFields = (formData) => {
  const required = [
    formData.s1,
    formData.s2,
    formData.s3,
    formData.settlement,
    formData.street,
    formData.consumerName,
    formData.subscriberType,
    formData.accountStatus,
    formData.typeDevice,
    formData.serialNumber,
    formData.password,
    formData.transformerSubstationNumber,
    formData.ttCoeff,
    formData.tnCoeff,
    formData.simCardShort || formData.simCardFull,
    formData.protocol,
    formData.advSettings,
    formData.requests,
  ];

  // Проверяем базовые обязательные поля
  const baseFieldsFilled = required.every((field) => field && field.toString().trim() !== "");

  // Если модель счетчика РиМ, проверяем номер коммуникатора
  if (baseFieldsFilled && isRimModelRequiringCommunicator(formData.typeDevice)) {
    const communicatorFilled = formData.communicatorNumber && formData.communicatorNumber.toString().trim() !== "";
    return communicatorFilled;
  }

  return baseFieldsFilled;
};

/**
 * Проверка заполненности обязательных полей во всех карточках
 * @param {Array} cards - массив карточек
 * @returns {boolean} - true если все карточки заполнены
 */
export const checkAllCardsRequiredFields = (cards) => {
  return cards.every((card) => checkCardRequiredFields(card.formData));
};

/**
 * Подсчет количества полностью заполненных карточек
 * @param {Array} cards - массив карточек
 * @returns {number} - количество заполненных карточек
 */
export const countFilledCards = (cards) => {
  return cards.filter((card) => checkCardRequiredFields(card.formData)).length;
};

/**
 * Преобразование formData в объект для экспорта в Excel
 *
 * Выполняет:
 * 1. Замену ID на имена (s1 -> mpesName, s2 -> rkesName и т.д.)
 * 2. Рассчет итогового коэффициента (ttCoeff * tnCoeff)
 * 3. Вычисление сетевого адреса
 * 4. Удаление служебных полей (s1, s2, s3, typeDevice, port)
 * 5. Для не-админов: удаление данных (ipAddress, password, protocol и т.д.)
 * 6. Для не-админов: удаление objectID
 *
 * @param {Object} formData - данные формы
 * @param {Array} mpes - массив МПЭС
 * @param {Object} rkesOptions - объект РКЭС по МПЭС
 * @param {Object} muOptions - объект МУ по РКЭС
 * @param {boolean} includePort - включать ли порт в экспорт
 * @param {boolean} isAdminExport - экспорт для админа (true) или обычного пользователя (false)
 * @returns {Object} - объект для экспорта
 */
export const getExportFormData = (
  formData,
  mpes,
  rkesOptions,
  muOptions,
  includePort = false,
  isAdminExport = false
) => {
  // Получаем имя МПЭС по ID
  let mpesName = formData.s1;
  if (mpes.length > 0) {
    const foundMpes = mpes.find((m) => m.id === formData.s1 || m.name === formData.s1);
    if (foundMpes) mpesName = foundMpes.name;
  }

  // Получаем имя РКЭС по ID
  let rkesName = formData.s2;
  let selectedMpes = mpes.find((m) => m.id === formData.s1 || m.name === formData.s1);
  if (selectedMpes && rkesOptions[selectedMpes.id]) {
    const foundRkes = rkesOptions[selectedMpes.id].find((r) => r.id === formData.s2 || r.name === formData.s2);
    if (foundRkes) rkesName = foundRkes.name;
  }

  // Получаем имя МУ по ID
  let muName = formData.s3;
  let selectedRkes = null;
  if (selectedMpes && rkesOptions[selectedMpes.id]) {
    selectedRkes = rkesOptions[selectedMpes.id].find((r) => r.id === formData.s2 || r.name === formData.s2);
    if (selectedRkes && muOptions[selectedRkes.id]) {
      const foundMu = muOptions[selectedRkes.id].find((mu) => mu.id === formData.s3 || mu.name === formData.s3);
      if (foundMu) muName = foundMu.name;
    }
  }

  // Рассчитываем итоговый коэффициент
  const ttCoeffNum = parseFloat(formData.ttCoeff) || 1;
  const tnCoeffNum = parseFloat(formData.tnCoeff) || 1;
  const finalCoeff = ttCoeffNum * tnCoeffNum;

  // Вычисляем сетевой адрес
  const networkAddress = calculateNetworkAddress(formData.typeDevice, formData.serialNumber);

  // Собираем объект для экспорта
  const exportObj = {
    ...formData,
    mpes: mpesName || "",
    rkes: rkesName || "",
    masterUnit: muName || "",
    deviceModel: formData.typeDevice || "",
    networkAddress: networkAddress || "",
    finalCoeff: finalCoeff,
    ...(includePort ? {} : { port: undefined }),
  };

  // Удаляем служебные поля
  delete exportObj.s1;
  delete exportObj.s2;
  delete exportObj.s3;
  delete exportObj.typeDevice;
  if (!includePort) delete exportObj.port;

  // Удаляем поля для не-админов
  if (!isAdminExport) {
    delete exportObj.networkAddress;
    delete exportObj.ipAddress;
    delete exportObj.password;
    delete exportObj.protocol;
    delete exportObj.advSettings;
    delete exportObj.requests;
    // Удаляем objectID для не-админов (виден только админам)
    delete exportObj.objectID;
  }

  return exportObj;
};

/**
 * Экспорт всех карточек в Excel файл
 *
 * Логика:
 * 1. Итерируемся по всем карточкам
 * 2. Формируем объекты для экспорта (с учетом прав пользователя)
 * 3. Собираем все objectID из карточек для пометки в БД
 * 4. Помечаем objectID как is_used = TRUE в базе данных
 * 5. Создаем основной файл Excel
 * 6. Если включен режим KE: создаем второй КЭ-файл
 *
 * @param {Array} cards - массив карточек
 * @param {Object} user - текущий пользователь
 * @param {Array} mpes - массив МПЭС
 * @param {Object} rkesOptions - объект РКЭС по МПЭС
 * @param {Object} muOptions - объект МУ по РКЭС
 * @param {Array} deviceListFull - полный список моделей устройств с requests_ke
 * @param {boolean} keFileModeEnabled - режим KE включен
 * @returns {Promise<void>}
 */
export const exportCardsToExcel = async (
  cards,
  user,
  mpes,
  rkesOptions,
  muOptions,
  deviceListFull = [],
  keFileModeEnabled = false
) => {
  const isAdmin = user?.role_name === "admin";
  const exportData = [];
  const objectIDsToMark = [];

  for (const card of cards) {
    let exportObj;
    if (isAdmin) {
      exportObj = {
        ...getExportFormData(card.formData, mpes, rkesOptions, muOptions, false, true),
        port: card.formData.port,
      };
    } else {
      exportObj = getExportFormData(card.formData, mpes, rkesOptions, muOptions, false, false);
    }
    exportData.push(exportObj);

    // Собираем objectID для пометки как использованные в БД
    if (card.formData.objectID) {
      objectIDsToMark.push(card.formData.objectID);
    }
  }

  // Помечаем objectID как использованные в базе данных
  if (objectIDsToMark.length > 0) {
    try {
      await ApiService.markObjectIDsAsUsed(objectIDsToMark);
    } catch (error) {
      console.error("Ошибка при пометке objectID:", error);
    }
  }

  // Создаем имя файла с текущей датой
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `loader_data_${dateStr}.xlsx`;
  await ApiService.exportToExcel(exportData, filename, false);

  // Если включен режим KE, создаем второй файл с КЭ- данными
  if (keFileModeEnabled) {
    const keExportData = exportData.map((data) => transformToKe(data, deviceListFull));
    const keFilename = getKeFilename(filename);
    await ApiService.exportToExcel(keExportData, keFilename, true);
  }
};

/**
 * Отправка всех карточек на email
 *
 * Логика:
 * 1. Итерируемся по всем карточкам
 * 2. Формируем объекты для экспорта (всегда для админа, с портами)
 * 3. Собираем все objectID из карточек для пометки в БД
 * 4. Помечаем objectID как is_used = TRUE в базе данных
 * 5. Отправляем основной файл через API
 * 6. Если включен режим KE: отправляем второй КЭ-файл
 *
 * @param {Array} cards - массив карточек
 * @param {string} email - email получателя
 * @param {number} userId - ID пользователя (для аудита)
 * @param {Array} mpes - массив МПЭС
 * @param {Object} rkesOptions - объект РКЭС по МПЭС
 * @param {Object} muOptions - объект МУ по РКЭС
 * @param {Array} deviceListFull - полный список моделей устройств
 * @param {boolean} keFileModeEnabled - режим KE включен
 * @returns {Promise<void>}
 */
export const sendCardsToEmail = async (
  cards,
  email,
  userId,
  mpes,
  rkesOptions,
  muOptions,
  deviceListFull = [],
  keFileModeEnabled = false
) => {
  const exportData = [];
  const objectIDsToMark = [];

  for (const card of cards) {
    let exportObj;
    exportObj = {
      ...getExportFormData(card.formData, mpes, rkesOptions, muOptions, true, true),
      port: card.formData.port,
    };
    exportData.push(exportObj);

    // Собираем objectID для пометки как использованные в БД
    if (card.formData.objectID) {
      objectIDsToMark.push(card.formData.objectID);
    }
  }

  // Помечаем objectID как использованные в базе данных
  if (objectIDsToMark.length > 0) {
    try {
      await ApiService.markObjectIDsAsUsed(objectIDsToMark);
    } catch (error) {
      console.error("Ошибка при пометке objectID:", error);
    }
  }

  // Отправляем основной файл на email
  await ApiService.sendExcelToEmail(exportData, email, userId, "single_filling", false);

  // Если включен режим KE, отправляем второй КЭ-файл
  if (keFileModeEnabled) {
    const keExportData = exportData.map((data) => transformToKe(data, deviceListFull));
    await ApiService.sendExcelToEmail(keExportData, email, userId, "single_filling_ke", true);
  }
};
