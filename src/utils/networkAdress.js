/**
 * Вычисляет сетевой адрес на основе модели устройства и серийного номера
 * @param {string} deviceModel - Модель устройства
 * @param {string} serialNumber - Серийный номер устройства
 * @returns {string} Вычисленный сетевой адрес
 */
export const calculateNetworkAddress = (deviceModel, serialNumber) => {
  if (!deviceModel || !serialNumber) return "";

  // CE серия: все цифры кроме первых 6
  if (["CE 208", "CE 307", "CE 308"].includes(deviceModel)) {
    return serialNumber.substring(6);
  }

  // Милур серия: последние 4 цифры + 16
  if (["Милур 107", "Милур 307"].includes(deviceModel)) {
    const lastFour = serialNumber.slice(-4);
    const result = parseInt(lastFour) + 16;
    return result.toString();
  }

  // МИР серия: последние 4 цифры
  if (["МИР С-04", "МИР С-05", "МИР С-07"].includes(deviceModel)) {
    return serialNumber.slice(-4);
  }

  // РиМ серия: всегда 0
  if (deviceModel.includes("РиМ") || deviceModel.includes("Рим")) {
    return "0";
  }

  // Меркурий серия: 2 последние цифры + логика с +10
  if (deviceModel.includes("Меркурий")) {
    let lastTwo = parseInt(serialNumber.slice(-2));
    while (lastTwo < 17) {
      lastTwo += 10;
    }
    return lastTwo.toString();
  }

  return "";
};
