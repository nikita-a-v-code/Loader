import ApiService from "../../../services/api";
import { calculateNetworkAddress } from "../../../utils/networkAdress";
import { isRimModelRequiringCommunicator } from "../../../utils/Validation/validationRules";

// Список обязательных полей
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

// Проверка заполненности обязательных полей карточки
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

// Проверка всех карточек
export const checkAllCardsRequiredFields = (cards) => {
  return cards.every((card) => checkCardRequiredFields(card.formData));
};

// Подсчет заполненных карточек
export const countFilledCards = (cards) => {
  return cards.filter((card) => checkCardRequiredFields(card.formData)).length;
};

// Преобразование formData в объект для экспорта
export const getExportFormData = (
  formData,
  mpes,
  rkesOptions,
  muOptions,
  includePort = false,
  isAdminExport = false
) => {
  // МПЭС
  let mpesName = formData.s1;
  if (mpes.length > 0) {
    const foundMpes = mpes.find((m) => m.id === formData.s1 || m.name === formData.s1);
    if (foundMpes) mpesName = foundMpes.name;
  }

  // РКЭС
  let rkesName = formData.s2;
  let selectedMpes = mpes.find((m) => m.id === formData.s1 || m.name === formData.s1);
  if (selectedMpes && rkesOptions[selectedMpes.id]) {
    const foundRkes = rkesOptions[selectedMpes.id].find((r) => r.id === formData.s2 || r.name === formData.s2);
    if (foundRkes) rkesName = foundRkes.name;
  }

  // МУ
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

  // Сетевой адрес
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
  }

  return exportObj;
};

// // Сохранение порта в БД
// export const savePortToDatabase = async (portStr, consumerName) => {
//   try {
//     const existingPorts = await ApiService.getPorts();
//     const portExists = existingPorts.some((port) => port.port_number === portStr);

//     if (portExists) {
//       const { nextPort } = await ApiService.getNextPort();
//       const newPortStr = String(nextPort);
//       await ApiService.createPort({
//         portNumber: newPortStr,
//         description: `Автоматически назначен для ${consumerName || "пользователя"}`,
//       });
//       return newPortStr;
//     }

//     await ApiService.createPort({
//       portNumber: portStr,
//       description: `Автоматически назначен для ${consumerName || "пользователя"}`,
//     });
//     return portStr;
//   } catch (error) {
//     console.error("Error saving port:", error);
//     throw error;
//   }
// };

// Экспорт карточек в Excel
export const exportCardsToExcel = async (cards, user, mpes, rkesOptions, muOptions) => {
  const isAdmin = user?.role_name === "admin";
  const exportData = [];

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
  }

  await ApiService.exportToExcel(exportData);
};

// Отправка карточек на email
export const sendCardsToEmail = async (cards, email, userId, mpes, rkesOptions, muOptions) => {
  const exportData = [];

  for (const card of cards) {
    let exportObj;
    exportObj = {
      ...getExportFormData(card.formData, mpes, rkesOptions, muOptions, true, true),
      port: card.formData.port,
    };
    exportData.push(exportObj);
  }

  await ApiService.sendExcelToEmail(exportData, email, userId, "single_filling");
};
