import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../services/api";
import { createExcelValidationSchema, validateAllRows } from "../../../utils/Validation/excelValidationSchema";
import { calculateNetworkAddress } from "../../../utils/networkAdress";

/**
 * Хук для управления данными Excel импорта.
 * Загружает справочники, обрабатывает данные, валидирует.
 */
const useExcelData = () => {
  // === State для данных из Excel ===
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  // === State для валидации ===
  const [errors, setErrors] = useState({});
  const [validationSuccess, setValidationSuccess] = useState(false);

  // === State для отслеживания редактируемых полей ===
  // Формат: { rowIndex: Set(['Дом', 'Квартира (офис)', ...]) }
  const [touchedFields, setTouchedFields] = useState({});

  // === State для справочников ===
  const [mpesList, setMpesList] = useState([]);
  const [rkesList, setRkesList] = useState([]);
  const [masterUnitsList, setMasterUnitsList] = useState([]);
  const [settlementList, setSettlementList] = useState([]);
  const [settlementListFull, setSettlementListFull] = useState([]);
  const [streetsBySettlement, setStreetsBySettlement] = useState({});
  const [subscriberList, setSubscriberList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [deviceList, setDeviceList] = useState([]);
  const [deviceListFull, setDeviceListFull] = useState([]);
  const [protocolsList, setProtocolsList] = useState([]);
  const [protocolsListFull, setProtocolsListFull] = useState([]);
  const [numberTPList, setNumberTPList] = useState([]);

  /**
   * Загружает все справочники с сервера.
   */
  const loadData = useCallback(async () => {
    try {
      const [mpes, rkes, mu, settlements, subscriberType, accountStatus, deviceModel, protocols, numberTP] =
        await Promise.all([
          ApiService.getMpes(),
          ApiService.getRkes(),
          ApiService.getMasterUnits(),
          ApiService.getSettlements(),
          ApiService.getAbonentTypes(),
          ApiService.getStatuses(),
          ApiService.getDevices(),
          ApiService.getProtocols(),
          ApiService.getNumberTP(),
        ]);
      setMpesList(mpes.map((item) => item.name));
      setRkesList(rkes.map((item) => item.name));
      setMasterUnitsList(mu.map((item) => item.name));
      setSettlementList(settlements.map((item) => item.name));
      setSettlementListFull(settlements);
      setSubscriberList(subscriberType.map((item) => item.name));
      setStatusList(accountStatus.map((item) => item.name));
      setDeviceList(deviceModel.map((item) => item.name));
      setDeviceListFull(deviceModel);
      setProtocolsListFull(protocols);
      setProtocolsList(protocols.map((item) => item.name));
      setNumberTPList(numberTP.map((item) => item.name));
    } catch (error) {
      console.error("Ошибка при загрузке структурных данных:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Загружает улицы для конкретного населенного пункта.
   * Возвращает объект {settlementName: streets[]} для использования в валидации.
   */
  const loadStreetsForSettlement = useCallback(
    async (settlementName) => {
      if (!settlementName) return null;

      // Если уже загружены - возвращаем из кэша
      if (streetsBySettlement[settlementName]) {
        return { [settlementName]: streetsBySettlement[settlementName] };
      }

      try {
        const settlement = settlementListFull.find((s) => s.name === settlementName);
        if (!settlement) return null;

        const streets = await ApiService.getStreetsBySettlement(settlement.id);
        const streetNames = streets.map((s) => s.name);

        setStreetsBySettlement((prev) => ({
          ...prev,
          [settlementName]: streetNames,
        }));

        return { [settlementName]: streetNames };
      } catch (error) {
        console.error("Ошибка при загрузке улиц:", error);
        return null;
      }
    },
    [settlementListFull, streetsBySettlement]
  );

  /**
   * Автоматически заполняет все поля из модели счетчика:
   * - Пароль на конфигурирование
   * - Запросы
   * - Дополнительные параметры счетчика
   * - IP адрес
   */
  const autofillFromDeviceModel = useCallback(
    (dataRows = null) => {
      const rowsToProcess = dataRows || rows;

      const updated = rowsToProcess.map((row) => {
        const modelValue = row["Модель счетчика"];
        if (!modelValue) return row;

        const device = deviceListFull.find((d) => d.name === modelValue);
        if (!device) return row;

        const newRow = { ...row };

        // Заполняем пароль если пустое
        const passwordValue = row["Пароль на конфигурирование"] || "";
        if (passwordValue.trim() === "" && device.password) {
          newRow["Пароль на конфигурирование"] = device.password;
        }

        // Заполняем запросы если пустое
        const requestsValue = row["Запросы"] || "";
        if (requestsValue.trim() === "" && device.requests) {
          newRow["Запросы"] = device.requests;
        }

        // Заполняем доп. параметры если пустое
        const advSettingsValue = row["Дополнительные параметры счетчика"] || "";
        if (advSettingsValue.trim() === "" && device.adv_settings) {
          newRow["Дополнительные параметры счетчика"] = device.adv_settings;
        }

        // Заполняем IP адрес если пустое
        const ipValue = row["IP адрес"] || "";
        if (ipValue.trim() === "" && device.ip_address) {
          newRow["IP адрес"] = device.ip_address;
        }

        return newRow;
      });

      if (!dataRows) {
        setRows(updated);
      }

      return updated;
    },
    [rows, deviceListFull]
  );

  /**
   * Рассчитывает сетевые адреса на основе модели счетчика и заводского номера.
   */
  const calculateNetworkAddresses = useCallback(
    (dataRows = null) => {
      const rowsToProcess = dataRows || rows;

      const updated = rowsToProcess.map((row) => {
        const modelValue = row["Модель счетчика"];
        const serialNumber = row["Заводской номер"];

        if (modelValue && serialNumber) {
          const networkAddress = calculateNetworkAddress(modelValue, serialNumber);
          return {
            ...row,
            "Сетевой адрес": networkAddress,
          };
        }
        return row;
      });

      return updated;
    },
    [rows]
  );

  /**
   * Автоматически заполняет протокол.
   */
  const autofillProtocols = useCallback(
    (dataRows = null) => {
      const rowsToProcess = dataRows || rows;
      const defaultProtocol =
        protocolsListFull.find((item) => item.is_default)?.name || protocolsListFull[0]?.name || "";

      if (!defaultProtocol) {
        return rowsToProcess;
      }

      const updated = rowsToProcess.map((row) => {
        const protocolValue = row["Протокол"] || "";

        if (protocolValue.trim() === "") {
          return {
            ...row,
            Протокол: defaultProtocol,
          };
        }
        return row;
      });

      if (!dataRows) {
        setRows(updated);
      }

      return updated;
    },
    [rows, protocolsListFull]
  );

  /**
   * Автоматически заполняет коэффициенты ТТ и ТН единицами, если не заполнены.
   * Также рассчитывает итоговый коэффициент (ТТ * ТН).
   */
  const autofillTransformerCoefficients = useCallback(
    (dataRows = null) => {
      const rowsToProcess = dataRows || rows;

      const updated = rowsToProcess.map((row) => {
        const ttCoeff = row["Коэффициент трансформации ТТ"] || "";
        const tnCoeff = row["Коэффициент трансформации ТН"] || "";

        const ttCoeffValue = ttCoeff.trim() === "" ? "1" : ttCoeff;
        const tnCoeffValue = tnCoeff.trim() === "" ? "1" : tnCoeff;

        // Рассчитываем итоговый коэффициент
        const ttNum = parseFloat(ttCoeffValue) || 1;
        const tnNum = parseFloat(tnCoeffValue) || 1;
        const finalCoeff = (ttNum * tnNum).toString();

        return {
          ...row,
          "Коэффициент трансформации ТТ": ttCoeffValue,
          "Коэффициент трансформации ТН": tnCoeffValue,
          "Коэффициент (итоговый)": finalCoeff,
        };
      });

      if (!dataRows) {
        setRows(updated);
      }

      return updated;
    },
    [rows]
  );

  /**
   * Автоматически назначает порты.
   */
  const assignPortsToRows = useCallback(
    async (dataRows = null) => {
      const rowsToProcess = dataRows || rows;
      const updated = [];

      for (let i = 0; i < rowsToProcess.length; i++) {
        const row = rowsToProcess[i];
        const portValue = row["Порт"] || "";

        if (portValue.trim() === "") {
          try {
            const { nextPort } = await ApiService.getNextPort();
            const portStr = String(nextPort);

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
            updated.push(row);
          }
        } else {
          updated.push(row);
        }
      }

      if (!dataRows) {
        setRows(updated);
      }

      return updated;
    },
    [rows]
  );

  /**
   * Валидирует все строки данных.
   */
  const validateAll = useCallback(async () => {
    const uniqueSettlements = [...new Set(rows.map((row) => row["Населенный пункт"]).filter(Boolean))];

    // Загружаем улицы и собираем результаты напрямую (не ждём обновления state).
    // Promise.all дает параллельную загрузку для оптимизации для всех населенных пунктов загрузка идет параллельно.
    const streetsResults = await Promise.all(
      uniqueSettlements.map((settlementName) => loadStreetsForSettlement(settlementName))
    );

    // Объединяем загруженные улицы с уже имеющимися
    const allStreets = { ...streetsBySettlement };
    streetsResults.forEach((result) => {
      if (result) {
        Object.assign(allStreets, result);
      }
    });

    const schema = createExcelValidationSchema({
      mpesList,
      rkesList,
      masterUnitsList,
      settlementList,
      streetsBySettlement: allStreets,
      subscriberList,
      statusList,
      deviceList,
      numberTPList,
    });

    const newErrors = await validateAllRows(rows, schema);

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setValidationSuccess(false);
    } else {
      setValidationSuccess(true);
    }
    return newErrors;
  }, [
    rows,
    mpesList,
    rkesList,
    masterUnitsList,
    settlementList,
    streetsBySettlement,
    subscriberList,
    statusList,
    deviceList,
    numberTPList,
    loadStreetsForSettlement,
  ]);

  /**
   * Возвращает список опций для Autocomplete поля.
   */
  const getOptionsForField = useCallback(
    (header, row = {}) => {
      // Убираем из заголовков лишние символы если есть
      const h = (header || "").trim();

      const optionsMap = {
        "Подразделение (МПЭС)": mpesList,
        РКЭС: rkesList,
        "Мастерский участок": masterUnitsList,
        "Населенный пункт": settlementList,
        "Тип абонента": subscriberList,
        "Статус счета": statusList,
        "Модель счетчика": deviceList,
        "Номер трансформаторной подстанции": numberTPList,
      };

      if (optionsMap[h]) return optionsMap[h];

      if (h === "Улица") {
        const settlementName = row["Населенный пункт"];
        return settlementName && streetsBySettlement[settlementName] ? streetsBySettlement[settlementName] : [];
      }

      return [];
    },
    [
      mpesList,
      rkesList,
      masterUnitsList,
      settlementList,
      streetsBySettlement,
      subscriberList,
      statusList,
      deviceList,
      numberTPList,
    ]
  );

  return {
    // State
    headers,
    setHeaders,
    rows,
    setRows,
    errors,
    setErrors,
    validationSuccess,
    setValidationSuccess,
    touchedFields,
    setTouchedFields,

    // Справочники
    deviceListFull,
    protocolsList,
    protocolsListFull,
    streetsBySettlement,
    numberTPList,

    // Методы
    loadStreetsForSettlement,
    autofillFromDeviceModel,
    calculateNetworkAddresses,
    autofillProtocols,
    autofillTransformerCoefficients,
    validateAll,
    getOptionsForField,
  };
};

export default useExcelData;
