import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../../services/api";
import { validators, useValidationErrors } from "../../../../utils/Validation/Validation";
import { calculateNetworkAddress } from "../../../../utils/networkAdress";

/**
 * Начальное состояние точки подключения
 */
const createInitialPoint = (connectionData, index, defaultIp = "", defaultProtocol = "") => ({
  networkAddress: connectionData[index]?.networkAddress || "",
  simCardShort: connectionData[index]?.simCardShort || "",
  simCardFull: connectionData[index]?.simCardFull || "",
  ipAddress: connectionData[index]?.ipAddress || defaultIp,
  protocol: connectionData[index]?.protocol || defaultProtocol,
  communicatorNumber: connectionData[index]?.communicatorNumber || "",
  comPorts: connectionData[index]?.comPorts || "",
  port: connectionData[index]?.port || "",
  portSaved: false,
  advSettings: connectionData[index]?.advSettings || "",
  nameConnection: connectionData[index]?.nameConnection || "",
  requests: connectionData[index]?.requests || "",
  nameUSPD: connectionData[index]?.nameUSPD || "",
  typeUSPD: connectionData[index]?.typeUSPD || "",
  numberUSPD: connectionData[index]?.numberUSPD || "",
  userUSPD: connectionData[index]?.userUSPD || "",
  passwordUSPD: connectionData[index]?.passwordUSPD || "",
  showUSPD: connectionData[index]?.showUSPD || false,
});

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
}) => {
  // Справочники
  const [ipAddresses, setIpAddresses] = useState([]);
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
   * Загрузка справочников и инициализация точек с дефолтными значениями
   */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ipData, protocolData] = await Promise.all([ApiService.getIpAddresses(), ApiService.getProtocols()]);

      setIpAddresses(ipData);
      setProtocols(protocolData);

      // Получаем дефолтные значения из справочников
      const defaultIp = ipData.find((item) => item.is_default)?.address || ipData[0]?.address || "";
      const defaultProtocol = protocolData.find((item) => item.is_default)?.name || protocolData[0]?.name || "";

      // Инициализируем точки подключения с дефолтными значениями
      const points = [];
      for (let i = 0; i < pointsCount; i++) {
        points.push(createInitialPoint(connectionData, i, defaultIp, defaultProtocol));
      }
      setConnectionPoints(points);
      onConnectionChange(points);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [pointsCount, connectionData, onConnectionChange]);

  /**
   * Назначение портов при монтировании
   */
  const assignPortsOnMount = useCallback(async () => {
    try {
      const hasEmptyPorts = connectionPoints.some((point) => !point.port);
      if (!hasEmptyPorts) return;

      const { nextPort } = await ApiService.getNextPort();

      const newPoints = connectionPoints.map((point, index) => {
        if (!point.port) {
          return { ...point, port: String(nextPort + index), portSaved: false };
        }
        return point;
      });

      setConnectionPoints(newPoints);
      onConnectionChange(newPoints);
    } catch (err) {
      console.error("Error assigning ports on mount:", err);
    }
  }, [connectionPoints, onConnectionChange]);

  /**
   * Сохранение портов в базу
   */
  const assignPortsToConnections = useCallback(async () => {
    try {
      if (portsAssigned) return;

      for (let i = 0; i < connectionPoints.length; i++) {
        if (connectionPoints[i].port && !connectionPoints[i].portSaved) {
          await ApiService.createPort({
            portNumber: connectionPoints[i].port,
            description: `Автоматически назначен для ${consumerData[i]?.consumerName || `Точка ${i + 1}`}`,
          });

          const newPoints = [...connectionPoints];
          newPoints[i] = { ...newPoints[i], portSaved: true };
          setConnectionPoints(newPoints);
          onConnectionChange(newPoints);
        }
      }

      setPortsAssigned(true);
    } catch (err) {
      console.error("Error saving ports:", err);
      setPortsAssigned(true);
    }
  }, [connectionPoints, consumerData, onConnectionChange, portsAssigned]);

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
    return connectionPoints.every(
      (point, index) =>
        (getNetworkAddress(index) || point.networkAddress) &&
        point.ipAddress &&
        point.port &&
        point.protocol &&
        (point.simCardShort || point.simCardFull)
    );
  }, [connectionPoints, getNetworkAddress]);

  // Загрузка при монтировании
  useEffect(() => {
    loadData();
  }, []);

  // Назначение портов после загрузки данных (когда connectionPoints заполнены)
  useEffect(() => {
    if (connectionPoints.length > 0) {
      assignPortsOnMount();
    }
  }, [connectionPoints.length]);

  return {
    // Справочники
    ipAddresses,
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
    assignPortsToConnections,
  };
};

export default useConnectionData;
