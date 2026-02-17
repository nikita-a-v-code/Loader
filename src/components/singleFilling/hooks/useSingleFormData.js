import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../services/api";

// Начальное состояние формы
export const initialFormData = {
  // Структура организации
  s1: "",
  s2: "",
  s3: "",
  // Адрес
  settlement: "",
  microdistrict: "",
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

// Хук для загрузки справочных данных из API
const useSingleFormData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Справочные данные из API
  const [mpes, setMpes] = useState([]);
  const [rkesOptions, setRkesOptions] = useState({});
  const [muOptions, setMuOptions] = useState({});
  const [settl, setSettl] = useState([]);
  const [str, setStr] = useState({});
  const [abonentTypes, setAbonentTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [defaultEmail, setDefaultEmail] = useState("");
  const [numberTP, setNumberTP] = useState([]);

  // Дефолтные значения для новых карточек
  const [defaults, setDefaults] = useState({ protocol: "" });

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [mpesData, settlData, abonentData, statusData, deviceData, protocolData, numberTPData] =
        await Promise.all([
          ApiService.getMpes(),
          ApiService.getSettlements(),
          ApiService.getAbonentTypes(),
          ApiService.getStatuses(),
          ApiService.getDevices(),
          ApiService.getProtocols(),
          ApiService.getNumberTP(),
        ]);

      setMpes(mpesData);
      setSettl(settlData);
      setAbonentTypes(abonentData);
      setStatuses(statusData);
      setDeviceTypes(deviceData);
      setProtocols(protocolData);
      setNumberTP(numberTPData);

      // Получаем дефолтный протокол
      const defaultProtocol = protocolData.find((item) => item.is_default)?.name || protocolData[0]?.name || "";

      setDefaults({ protocol: defaultProtocol });
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка дефолтного email
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

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Загрузка РКЭС по МПЭС
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

  // Загрузка МУ по РКЭС
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

  // Загрузка улиц по населенному пункту
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

  // Добавление нового населенного пункта
  const addSettlement = useCallback((settlement) => {
    setSettl((prev) => [...prev, settlement]);
  }, []);

  // Добавление новой улицы
  const addStreet = useCallback((settlementId, street) => {
    setStr((prev) => ({
      ...prev,
      [settlementId]: [...(prev[settlementId] || []), street],
    }));
  }, []);

  // Добавление нового номера ТП
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
