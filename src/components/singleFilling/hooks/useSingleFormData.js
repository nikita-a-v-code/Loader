/**
 * useSingleFormData - хук для загрузки справочных данных из API
 *
 * Загружает при инициализации:
 * - mpes: МПЭС
 * - rkesOptions: РКЭС по МПЭС
 * - muOptions: МУ по РКЭС
 * - settl: населенные пункты
 * - str: улицы по населенным пунктам
 * - abonentTypes: типы абонентов
 * - statuses: статусы абонентов
 * - deviceTypes: модели счетчиков с параметрами (requests_ke и т.д.)
 * - protocols: протоколы связи
 * - numberTP: номера трансформаторных подстанций
 * - defaults: дефолтные значения (протокол)
 * - defaultEmail: дефолтный email для отправки файлов
 *
 * Предоставляет функции:
 * - loadAllData: загрузка всех справочников
 * - loadRkesByMpes: загрузка РКЭС по МПЭС (ленивая загрузка)
 * - loadMuByRkes: загрузка МУ по РКЭС (ленивая загрузка)
 * - loadStreetsBySettlements: загрузка улиц по населенному пункту (ленивая загрузка)
 * - addSettlement: добавление нового населенного пункта
 * - addStreet: добавление новой улицы
 * - addNumberTp: добавление новой ТП
 */
import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../services/api";

/**
 * Начальное состояние формы для новой карточки
 * Содержит все поля для заполнения по секциям:
 * - Структура: s1, s2, s3
 * - Адрес: settlement, street, house, building, apartment
 * - Потребитель: consumerName, deliveryPoint, contractNumber, subscriberType, accountStatus
 * - Сетевой код: networkCode, transformerSubstationNumber, numberSupport04, maxPower
 * - Прибор учета: typeDevice, serialNumber, numberPhases, verificationDate, verificationInterval, dateInstallation, numberTerminal, numberCasing, password, note
 * - ТТ: ttType, ttSerialA/B/C, ttDateA/B/C, ttIntervalA/B/C, ttCoeff, ttSealA/B/C
 * - ТН: tnType, tnSerialA/B/C, tnDateA/B/C, tnIntervalA/B/C, tnCoeff, tnSealA/B/C
 * - Соединение: finalCoeff, networkAddress, simCardShort, simCardFull, ipAddress, protocol, communicatorNumber, comPorts, port, advSettings, nameConnection, requests, nameUSPD, typeUSPD, numberUSPD, userUSPD, passwordUSPD, showUSPD
 */
export const initialFormData = {
  // Структура организации
  s1: "",
  s2: "",
  s3: "",
  // Адрес
  settlement: "",
  street: "",
  house: "",
  building: "",
  apartment: "",
  // Потребитель
  consumerName: "",
  deliveryPoint: "",
  contractNumber: "",
  subscriberType: "",
  accountStatus: "",
  // Сетевой код
  networkCode: "",
  transformerSubstationNumber: "",
  numberSupport04: "",
  maxPower: "",
  // Прибор учета
  typeDevice: "",
  serialNumber: "",
  numberPhases: "",
  objectID: "",
  verificationDate: "",
  verificationInterval: "",
  dateInstallation: "",
  numberTerminal: "",
  numberCasing: "",
  password: "",
  note: "",
  // ТТ
  ttType: "",
  ttSerialA: "",
  ttSerialB: "",
  ttSerialC: "",
  ttDateA: "",
  ttIntervalA: "",
  ttDateB: "",
  ttIntervalB: "",
  ttDateC: "",
  ttIntervalC: "",
  ttCoeff: "1",
  ttSealA: "",
  ttSealB: "",
  ttSealC: "",
  // ТН
  tnType: "",
  tnSerialA: "",
  tnSerialB: "",
  tnSerialC: "",
  tnDateA: "",
  tnIntervalA: "",
  tnDateB: "",
  tnIntervalB: "",
  tnDateC: "",
  tnIntervalC: "",
  tnCoeff: "1",
  tnSealA: "",
  tnSealB: "",
  tnSealC: "",
  // Соединение
  finalCoeff: 1,
  networkAddress: "",
  simCardShort: "",
  simCardFull: "",
  ipAddress: "",
  protocol: "",
  communicatorNumber: "",
  comPorts: "",
  port: "",
  advSettings: "",
  nameConnection: "",
  requests: "",
  nameUSPD: "",
  typeUSPD: "",
  numberUSPD: "",
  userUSPD: "",
  passwordUSPD: "",
  showUSPD: false,
};

/**
 * Хук для загрузки справочных данных из API
 * @returns {Object} - объект с данными и методами
 */
const useSingleFormData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== СПРАЧОЧНЫЕ ДАННЫЕ ====================

  // МПЭС
  const [mpes, setMpes] = useState([]);
  // РКЭС по МПЭС (объект по ID МПЭС)
  const [rkesOptions, setRkesOptions] = useState({});
  // МУ по РКЭС (объект по ID РКЭС)
  const [muOptions, setMuOptions] = useState({});
  // Населенные пункты
  const [settl, setSettl] = useState([]);
  // Улицы по населенным пунктам (объект по ID населенного пункта)
  const [str, setStr] = useState({});
  // Типы абонентов
  const [abonentTypes, setAbonentTypes] = useState([]);
  // Статусы абонентов
  const [statuses, setStatuses] = useState([]);
  // Модели счетчиков (полные объекты с requests_ke)
  const [deviceTypes, setDeviceTypes] = useState([]);
  // Полный список устройств (для экспорта)
  const [deviceListFull, setDeviceListFull] = useState([]);
  // Протоколы связи
  const [protocols, setProtocols] = useState([]);
  // Дефолтный email
  const [defaultEmail, setDefaultEmail] = useState("");
  // Номера трансформаторных подстанций
  const [numberTP, setNumberTP] = useState([]);

  // ==================== ДЕФОЛТНЫЕ ЗНАЧЕНИЯ ====================

  /**
   * Дефолтные значения для новых карточек
   * - protocol: дефолтный протокол связи
   */
  const [defaults, setDefaults] = useState({ protocol: "" });

  // ==================== ЗАГРУЗКА ДАННЫХ ====================

  /**
   * Загрузка всех справочных данных из API параллельно
   *
   * Загружает:
   * - mpes, settl, abonentTypes, statuses, deviceTypes, protocols, numberTP
   * - Дополнительно: дефолтный протокол (используется в useCardManager)
   *
   * @returns {Promise<void>}
   */
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Параллельная загрузка всех справочников
      const [mpesData, settlData, abonentData, statusData, deviceData, protocolData, numberTPData] = await Promise.all([
        ApiService.getMpes(),
        ApiService.getSettlements(),
        ApiService.getAbonentTypes(),
        ApiService.getStatuses(),
        ApiService.getDevices(),
        ApiService.getProtocols(),
        ApiService.getNumberTP(),
      ]);

      // Сохраняем данные
      setMpes(mpesData);
      setSettl(settlData);
      setAbonentTypes(abonentData);
      setStatuses(statusData);
      // deviceTypes: полные объекты для использования в форме (с requests_ke)
      setDeviceTypes(deviceData);
      // deviceListFull: полные объекты с requests_ke для экспорта
      setDeviceListFull(deviceData);
      setProtocols(protocolData);
      setNumberTP(numberTPData);

      // Получаем дефолтный протокол (с флагом is_default или первый в списке)
      const defaultProtocol = protocolData.find((item) => item.is_default)?.name || protocolData[0]?.name || "";

      setDefaults({ protocol: defaultProtocol });
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Загрузка дефолтного email из настроек
   * Используется в SingleForm для автозаполнения поля email
   */
  useEffect(() => {
    let active = true;
    ApiService.getDefaultEmail()
      .then((resp) => {
        if (active && resp?.defaultEmail) {
          setDefaultEmail(resp.defaultEmail);
        }
      })
      .catch((err) => {
        console.error("Не удалось получить дефолтный email:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Автоматически загружаем данные при монтировании хука
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================== ЛЕНЕЙНАЯ ЗАГРУЗКА ОПЦИЙ ====================

  /**
   * Загрузка РКЭС по МПЭС (ленивая загрузка)
   * Выполняется только если данные для этого МПЭС еще не загружены
   *
   * @param {number} mpesId - ID МПЭС
   * @returns {Promise<void>}
   */
  const loadRkesByMpes = useCallback(
    async (mpesId) => {
      if (rkesOptions[mpesId]) return;
      try {
        const data = await ApiService.getRkesByMpes(mpesId);
        setRkesOptions((prev) => ({ ...prev, [mpesId]: data }));
      } catch (err) {
        console.error("Error loading rkes:", err);
      }
    },
    [rkesOptions]
  );

  /**
   * Загрузка МУ по РКЭС (ленивая загрузка)
   * Выполняется только если данные для этого РКЭС еще не загружены
   *
   * @param {number} rkesId - ID РКЭС
   * @returns {Promise<void>}
   */
  const loadMuByRkes = useCallback(
    async (rkesId) => {
      if (muOptions[rkesId]) return;
      try {
        const data = await ApiService.getMasterUnitsByRkes(rkesId);
        setMuOptions((prev) => ({ ...prev, [rkesId]: data }));
      } catch (err) {
        console.error("Error loading master units:", err);
      }
    },
    [muOptions]
  );

  /**
   * Загрузка улиц по населенному пункту (ленивая загрузка)
   * Выполняется только если данные для этого населенного пункта еще не загружены
   *
   * @param {number} settlementId - ID населенного пункта
   * @returns {Promise<void>}
   */
  const loadStreetsBySettlements = useCallback(
    async (settlementId) => {
      if (str[settlementId]) return;
      try {
        const data = await ApiService.getStreetsBySettlement(settlementId);
        setStr((prev) => ({ ...prev, [settlementId]: data }));
      } catch (err) {
        console.error("Error loading streets:", err);
      }
    },
    [str]
  );

  // ==================== ФУНКЦИИ ДОБАВЛЕНИЯ ====================

  /**
   * Добавление нового населенного пункта в локальное состояние
   * Используется при создании нового населенного пункта через API
   *
   * @param {Object} settlement - созданный населенный пункт
   */
  const addSettlement = useCallback((settlement) => {
    setSettl((prev) => [...prev, settlement]);
  }, []);

  /**
   * Добавление новой улицы в локальное состояние
   * Используется при создании новой улицы через API
   *
   * @param {number} settlementId - ID населенного пункта
   * @param {Object} street - созданная улица
   */
  const addStreet = useCallback((settlementId, street) => {
    setStr((prev) => ({
      ...prev,
      [settlementId]: [...(prev[settlementId] || []), street],
    }));
  }, []);

  /**
   * Добавление новой ТП в локальное состояние
   * Используется при создании новой ТП через API
   *
   * @param {Object} numberTpItem - созданная ТП
   */
  const addNumberTp = useCallback((numberTpItem) => {
    setNumberTP((prev) => [...prev, numberTpItem]);
  }, []);

  return {
    loading,
    error,
    mpes,
    rkesOptions,
    muOptions,
    settl,
    str,
    abonentTypes,
    statuses,
    deviceTypes,
    deviceListFull,
    protocols,
    numberTP,
    defaults,
    defaultEmail,
    loadAllData,
    loadRkesByMpes,
    loadMuByRkes,
    loadStreetsBySettlements,
    addSettlement,
    addStreet,
    addNumberTp,
  };
};

export default useSingleFormData;
