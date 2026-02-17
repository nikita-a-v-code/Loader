import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../../services/api";
import { validators, useValidationErrors } from "../../../../utils/Validation/Validation";
import { calculateNetworkAddress } from "../../../../utils/networkAdress";
import { isRimModelRequiringCommunicator } from "../../../../utils/Validation/validationRules";

/**
 * Начальное состояние точки подключения
 * Если модель изменилась (lastDeviceModel != deviceModel) - берём значения из новой модели
 * Если модель та же - сохраняем значения из connectionData
 */
const createInitialPoint = (
  connectionData,
  index,
  defaultIp = "",
  defaultProtocol = "",
  defaultRequests = "",
  defaultAdvSettings = "",
  deviceModel = ""
) => {
  const savedModel = connectionData[index]?.lastDeviceModel;
  const modelChanged = savedModel && savedModel !== deviceModel;

  return {
    networkAddress: connectionData[index]?.networkAddress || "",
    simCardShort: connectionData[index]?.simCardShort || "",
    simCardFull: connectionData[index]?.simCardFull || "",
    // Если модель изменилась - берём из новой модели, иначе из сохранённых данных
    ipAddress: modelChanged ? defaultIp : connectionData[index]?.ipAddress || defaultIp,
    protocol: connectionData[index]?.protocol || defaultProtocol,
    communicatorNumber: connectionData[index]?.communicatorNumber || "",
    comPorts: connectionData[index]?.comPorts || "",
    port: connectionData[index]?.port || "",
    portSaved: false,
    advSettings: modelChanged ? defaultAdvSettings : connectionData[index]?.advSettings || defaultAdvSettings,
    advSettingsEdited: modelChanged ? false : connectionData[index]?.advSettingsEdited || false,
    nameConnection: connectionData[index]?.nameConnection || "",
    requests: modelChanged ? defaultRequests : connectionData[index]?.requests || defaultRequests,
    requestsEdited: modelChanged ? false : connectionData[index]?.requestsEdited || false,
    lastDeviceModel: deviceModel,
    nameUSPD: connectionData[index]?.nameUSPD || "",
    typeUSPD: connectionData[index]?.typeUSPD || "",
    numberUSPD: connectionData[index]?.numberUSPD || "",
    userUSPD: connectionData[index]?.userUSPD || "",
    passwordUSPD: connectionData[index]?.passwordUSPD || "",
    showUSPD: connectionData[index]?.showUSPD || false,
  };
};

/**
 * Хук для управления данными подключения
 */
const useConnectionData = ({
  connectionData = {},
  onConnectionChange = () => {},
  pointsCount = 1,
  transformData = {},
  deviceData = {},
  consumerData = {},
  deviceTypes = [], // Справочник моделей счетчиков с IP адресами
}) => {
  // Справочники
  const [protocols, setProtocols] = useState([]);

  // Состояние загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portsAssigned, setPortsAssigned] = useState(false);

  // Валидация
  const { errors: validationErrors, showError, clearError, validateField } = useValidationErrors();

  // Точки подключения (инициализируем пустым массивом, заполним после загрузки справочников)
  const [connectionPoints, setConnectionPoints] = useState([]);

  /**
   * Получение IP адреса из модели счетчика
   */
  const getIpFromDeviceModel = useCallback(
    (deviceModel) => {
      if (!deviceModel || !deviceTypes.length) return "";
      const device = deviceTypes.find((d) => d.name === deviceModel);
      return device?.ip_address || "";
    },
    [deviceTypes]
  );

  /**
   * Получение запросов из модели счетчика
   */
  const getRequestsFromDeviceModel = useCallback(
    (deviceModel) => {
      if (!deviceModel || !deviceTypes.length) return "";
      const device = deviceTypes.find((d) => d.name === deviceModel);
      return device?.requests || "";
    },
    [deviceTypes]
  );

  /**
   * Получение доп. параметров из модели счетчика
   */
  const getAdvSettingsFromDeviceModel = useCallback(
    (deviceModel) => {
      if (!deviceModel || !deviceTypes.length) return "";
      const device = deviceTypes.find((d) => d.name === deviceModel);
      return device?.adv_settings || "";
    },
    [deviceTypes]
  );

  /**
   * Загрузка справочников и инициализация точек с дефолтными значениями
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const protocolData = await ApiService.getProtocols();
      setProtocols(protocolData);

      // Получаем дефолтный протокол
      const defaultProtocol = protocolData.find((item) => item.is_default)?.name || protocolData[0]?.name || "";

      // Инициализируем точки подключения только при первом запуске
      // Последующие обновления обрабатываются в useEffect для deviceData
      if (connectionPoints.length === 0) {
        const points = [];
        for (let i = 0; i < pointsCount; i++) {
          // Данные из модели счетчика (IP, запросы, доп. параметры)
          const deviceModel = deviceData[i]?.typeDevice || "";
          const device = deviceTypes.find((d) => d.name === deviceModel);
          const defaultIp = device?.ip_address || "";
          const defaultRequests = device?.requests || "";
          const defaultAdvSettings = device?.adv_settings || "";
          // Если deviceTypes пуст - ставим lastDeviceModel = null, чтобы потом при загрузке deviceTypes сработало обновление
          const lastModel = deviceTypes.length > 0 ? deviceModel : null;
          points.push(
            createInitialPoint(
              connectionData,
              i,
              defaultIp,
              defaultProtocol,
              defaultRequests,
              defaultAdvSettings,
              lastModel
            )
          );
        }
        setConnectionPoints(points);
        onConnectionChange(points);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [pointsCount, connectionData, onConnectionChange, deviceData, deviceTypes, connectionPoints.length]);

  /**
   * Назначение портов при монтировании
   */
  // const assignPortsOnMount = useCallback(async () => {
  //   try {
  //     const hasEmptyPorts = connectionPoints.some((point) => !point.port);
  //     if (!hasEmptyPorts) return;

  //     const newPoints = [...connectionPoints];
  //     let currentPort = null;

  //     for (let i = 0; i < newPoints.length; i++) {
  //       if (!newPoints[i].port) {
  //         if (currentPort === null) {
  //           const { nextPort } = await ApiService.getNextPort();
  //           currentPort = nextPort;
  //         } else {
  //           currentPort += 1;
  //         }
  //         newPoints[i] = { ...newPoints[i], port: String(currentPort), portSaved: false };
  //       }
  //     }

  //     setConnectionPoints(newPoints);
  //     onConnectionChange(newPoints);
  //   } catch (err) {
  //     console.error("Error assigning ports on mount:", err);
  //   }
  // }, [connectionPoints, onConnectionChange]);

  /**
   * Сохранение портов в базу с проверкой на занятость
   * Возвращает обновленные точки подключения
   */
  // const assignPortsToConnections = useCallback(async () => {
  //   try {
  //     // Получаем актуальный список существующих портов
  //     const existingPorts = await ApiService.getPorts();
  //     // Приводим к строке для корректного сравнения
  //     const existingPortNumbers = new Set(existingPorts.map((p) => String(p.port_number)));

  //     // Работаем с локальной копией, чтобы избежать проблем с асинхронным обновлением состояния
  //     const updatedPoints = [...connectionPoints];
  //     let hasChanges = false;

  //     for (let i = 0; i < updatedPoints.length; i++) {
  //       if (!updatedPoints[i].port) continue;

  //       let portToSave = String(updatedPoints[i].port);
  //       let needSave = !updatedPoints[i].portSaved;

  //       // Проверяем, занят ли порт
  //       if (existingPortNumbers.has(portToSave)) {
  //         // Порт занят, получаем новый
  //         const { nextPort } = await ApiService.getNextPort();
  //         portToSave = String(nextPort);
  //         updatedPoints[i] = { ...updatedPoints[i], port: portToSave };
  //         hasChanges = true;
  //         needSave = true; // Новый порт нужно сохранить
  //       }

  //       // Если порт нужно сохранить
  //       if (needSave) {
  //         // Сохраняем порт в базу
  //         await ApiService.createPort({
  //           portNumber: portToSave,
  //           description: `Автоматически назначен для ${consumerData[i]?.consumerName || `Точка ${i + 1}`}`,
  //         });

  //         // Добавляем в set, чтобы следующие точки не использовали этот порт
  //         existingPortNumbers.add(portToSave);

  //         // Помечаем порт как сохраненный
  //         updatedPoints[i] = { ...updatedPoints[i], port: portToSave, portSaved: true };
  //         hasChanges = true;
  //       }
  //     }

  //     // Обновляем состояние один раз в конце
  //     if (hasChanges) {
  //       setConnectionPoints(updatedPoints);
  //       onConnectionChange(updatedPoints);
  //     }

  //     setPortsAssigned(true);
  //     return updatedPoints;
  //   } catch (err) {
  //     console.error("Error saving ports:", err);
  //     setPortsAssigned(true);
  //     return connectionPoints;
  //   }
  // }, [connectionPoints, consumerData, onConnectionChange]);

  /**
   * Расчет итогового коэффициента
   */
  const calculateFinalCoeff = useCallback(
    (pointIndex) => {
      const ttCoeff = parseFloat(transformData[pointIndex]?.ttCoeff) || 1;
      const tnCoeff = parseFloat(transformData[pointIndex]?.tnCoeff) || 1;
      return (ttCoeff * tnCoeff).toString();
    },
    [transformData]
  );

  /**
   * Получение сетевого адреса
   */
  const getNetworkAddress = useCallback(
    (pointIndex) => {
      const deviceModel = deviceData[pointIndex]?.typeDevice;
      const serialNumber = deviceData[pointIndex]?.serialNumber;
      return calculateNetworkAddress(deviceModel, serialNumber);
    },
    [deviceData]
  );

  /**
   * Обработка изменения поля
   */
  const handleFieldChange = useCallback(
    (pointIndex, fieldName, value) => {
      const errorKey = `${fieldName}-${pointIndex}`;

      // Валидация полей
      if (fieldName === "simCardShort") {
        if (!validateField(value, validators.simCardShort, errorKey)) return;
      }
      if (fieldName === "simCardFull") {
        if (!validateField(value, validators.simCardFull, errorKey)) return;
      }
      if (fieldName === "communicatorNumber") {
        if (!validateField(value, validators.communicatorNumber, errorKey)) return;
      }
      if (fieldName === "port") {
        if (!validateField(value, validators.port, errorKey)) return;
      }

      const newPoints = [...connectionPoints];
      newPoints[pointIndex] = {
        ...newPoints[pointIndex],
        [fieldName]: value,
        ...(fieldName === "port" ? { portSaved: false } : {}),
        ...(fieldName === "requests" ? { requestsEdited: true } : {}),
        ...(fieldName === "advSettings" ? { advSettingsEdited: true } : {}),
      };
      setConnectionPoints(newPoints);
      onConnectionChange(newPoints);
    },
    [connectionPoints, onConnectionChange, validateField]
  );

  /**
   * Переключение УСПД
   */
  const handleUSPDToggle = useCallback(
    (pointIndex, checked) => {
      const newPoints = [...connectionPoints];
      newPoints[pointIndex] = {
        ...newPoints[pointIndex],
        showUSPD: checked,
      };
      setConnectionPoints(newPoints);
      onConnectionChange(newPoints);
    },
    [connectionPoints, onConnectionChange]
  );

  /**
   * Применить значение ко всем точкам
   */
  const applyToAll = useCallback(
    (sourceIndex, fieldName) => {
      const sourceValue = connectionPoints[sourceIndex][fieldName];
      if (!sourceValue) return;

      const newPoints = connectionPoints.map((point) => ({
        ...point,
        [fieldName]: sourceValue,
      }));
      setConnectionPoints(newPoints);
      onConnectionChange(newPoints);
    },
    [connectionPoints, onConnectionChange]
  );

  /**
   * Применить значение к следующей точке
   */
  const applyToNext = useCallback(
    (sourceIndex, fieldName) => {
      const sourceValue = connectionPoints[sourceIndex][fieldName];
      if (!sourceValue || sourceIndex >= connectionPoints.length - 1) return;

      const newPoints = [...connectionPoints];
      newPoints[sourceIndex + 1] = {
        ...newPoints[sourceIndex + 1],
        [fieldName]: sourceValue,
      };
      setConnectionPoints(newPoints);
      onConnectionChange(newPoints);
    },
    [connectionPoints, onConnectionChange]
  );

  /**
   * Проверка заполненности обязательных полей
   */
  const allFilled = useCallback(() => {
    return connectionPoints.every((point, index) => {
      // Получаем requests и advSettings: если поле редактировалось - берем из connection, иначе из deviceData
      const requests = point.requestsEdited ? point.requests : point.requests || deviceData[index]?.requests;
      const advSettings = point.advSettingsEdited
        ? point.advSettings
        : point.advSettings || deviceData[index]?.advSettings;

      const baseFieldsFilled =
        (getNetworkAddress(index) || point.networkAddress) &&
        point.protocol &&
        (point.simCardShort || point.simCardFull) &&
        requests &&
        advSettings;

      // Если базовые поля не заполнены, сразу возвращаем false
      if (!baseFieldsFilled) return false;

      // Проверяем номер коммуникатора для моделей РиМ
      const deviceModel = deviceData[index]?.typeDevice;
      if (isRimModelRequiringCommunicator(deviceModel)) {
        return point.communicatorNumber && point.communicatorNumber.trim() !== "";
      }

      return true;
    });
  }, [connectionPoints, getNetworkAddress, deviceData]);

  // Загрузка при монтировании и при изменении deviceTypes
  useEffect(() => {
    loadData();
  }, [deviceTypes]);

  // Обновление данных из модели счетчика при изменении модели
  // Создаем строку с моделями для отслеживания изменений
  const deviceModelsKey = Array.from({ length: pointsCount }, (_, i) => deviceData[i]?.typeDevice || "").join(",");

  useEffect(() => {
    if (!deviceTypes.length || !connectionPoints.length) return;

    const updatedPoints = connectionPoints.map((point, index) => {
      const deviceModel = deviceData[index]?.typeDevice;
      if (!deviceModel || point.lastDeviceModel === deviceModel) return point;

      const device = deviceTypes.find((d) => d.name === deviceModel);
      return {
        ...point,
        ipAddress: device?.ip_address || "",
        requests: device?.requests || "",
        advSettings: device?.adv_settings || "",
        lastDeviceModel: deviceModel,
        requestsEdited: false,
        advSettingsEdited: false,
      };
    });

    // Проверяем, изменились ли данные (сравниваем по ссылке - если точка не менялась, ссылка та же)
    const hasChanges = updatedPoints.some((point, index) => point !== connectionPoints[index]);
    if (hasChanges) {
      setConnectionPoints(updatedPoints);
      onConnectionChange(updatedPoints);
    }
  }, [deviceModelsKey, deviceTypes, connectionPoints]);

  // Назначение портов после загрузки данных (когда connectionPoints заполнены)
  // useEffect(() => {
  //   if (connectionPoints.length > 0) {
  //     assignPortsOnMount();
  //   }
  // }, [connectionPoints.length]);

  return {
    // Справочники
    protocols,

    // Состояние
    loading,
    error,
    connectionPoints,
    validationErrors,
    portsAssigned,

    // Методы
    loadData,
    handleFieldChange,
    handleUSPDToggle,
    applyToAll,
    applyToNext,
    allFilled,
    calculateFinalCoeff,
    getNetworkAddress,
    getIpFromDeviceModel,
    getRequestsFromDeviceModel,
    getAdvSettingsFromDeviceModel,
    // assignPortsToConnections,
  };
};

export default useConnectionData;
