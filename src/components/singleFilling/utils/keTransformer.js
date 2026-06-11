/**
 * Утилита для трансформации данных в KE версию
 * KE версия содержит:
 * - Заводские номера с префиксом "кэ-"
 * - Альтернативные запросы (requests_ke)
 */

/**
 * Трансформирует один объект данных в KE версию
 * @param {Object} data - Объект данных для экспорта
 * @param {Array} deviceListFull - Полный список моделей устройств с информацией о запросах
 * @returns {Object} - Трансформированный объект
 */
export const transformToKe = (data, deviceListFull = []) => {
  const keData = { ...data };

  // Добавляем префикс к заводскому номеру
  if (keData.serialNumber && keData.serialNumber.trim() !== "") {
    keData.serialNumber = `кэ-${keData.serialNumber}`;
  }

  // Используем альтернативные запросы если доступны
  if (keData.deviceModel && deviceListFull.length > 0) {
    const device = deviceListFull.find((d) => d.name === keData.deviceModel);
    if (device && device.requests_ke && device.requests_ke.trim() !== "") {
      keData.requests = device.requests_ke;
    }
  }

  // Удаляем objectID из KE файла, так как счетчики с КЭ не используют идентификаторы
  delete keData.objectID;

  return keData;
};

/**
 * Трансформирует массив объектов данных в KE версию
 * @param {Array} dataArray - Массив объектов для экспорта
 * @param {Array} deviceListFull - Полный список моделей устройств
 * @returns {Array} - Массив трансформированных объектов
 */
export const transformToKeArray = (dataArray, deviceListFull = []) => {
  return dataArray.map((data) => transformToKe(data, deviceListFull));
};

/**
 * Форматирует имя файла для KE версии
 * @param {string} originalFilename - Оригинальное имя файла
 * @returns {string} - Имя файла с маркером KE
 */
export const getKeFilename = (originalFilename) => {
  // Пример: loader_data_2024-01-15.xlsx -> loader_data_KE_2024-01-15.xlsx
  const parts = originalFilename.split(".");
  const ext = parts.pop();
  return `${parts.join(".")}_KE.${ext}`;
};
