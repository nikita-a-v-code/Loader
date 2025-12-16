import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ErrorAlert from "../../ui/ErrorAlert";
import ApiService from "../../services/api";
import { useValidationErrors, validators } from "../../utils/Validation/Validation";
import { calculateNetworkAddress } from "../../utils/networkAdress";
import { formatNetworkCode, validateNetworkCode, validateDigitsOnly } from "../../utils/networkCodeValidation";
import StructureSection from "./sections/StructureSection";
import AddressSection from "./sections/AddressSection";
import ConsumerSection from "./sections/ConsumerSection";
import NetworkSection from "./sections/NetworkSection";
import DeviceSection from "./sections/DeviceSection";
import TransformSection from "./sections/TransformSection";
import ConnectionSection from "./sections/ConnectionSection";

const SingleForm = () => {
  // Состояние для всех данных
  const [formData, setFormData] = useState({
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
    ttType: "Отсутствует",
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
    tnType: "Отсутствует",
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
    networkAddress: "",
    simCardShort: "",
    simCardFull: "",
    ipAddress: "192.168.0.73",
    protocol: "TCP",
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
  });

  // Состояние для загрузки данных
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Данные из API
  const [mpes, setMpes] = useState([]);
  const [rkesOptions, setRkesOptions] = useState({});
  const [muOptions, setMuOptions] = useState({});
  const [settl, setSettl] = useState([]);
  const [str, setStr] = useState({});
  const [abonentTypes, setAbonentTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [ipAddresses, setIpAddresses] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessages, setErrorMessages] = React.useState({});

  const {
    errors: validationErrors,
    showError,
    clearError,
    validateField,
    validateAndFormatDateField,
  } = useValidationErrors();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mpesData, settlData, abonentData, statusData, deviceData, ipData, protocolData] = await Promise.all([
        ApiService.getMpes(),
        ApiService.getSettlements(),
        ApiService.getAbonentTypes(),
        ApiService.getStatuses(),
        ApiService.getDevices(),
        ApiService.getIpAddresses(),
        ApiService.getProtocols(),
      ]);

      setMpes(mpesData);
      setSettl(settlData);
      setAbonentTypes(abonentData);
      setStatuses(statusData);
      setDeviceTypes(deviceData);
      setIpAddresses(ipData);
      setProtocols(protocolData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для создания нового населенного пункта
  const createNewSettlement = async (name) => {
    try {
      const newSettlement = await ApiService.createSettlement({ name });
      setSettl((prev) => [...prev, newSettlement]);
      setSuccessMessage(`Населенный пункт "${name}" успешно создан, выберите его из списка`);
      setTimeout(() => setSuccessMessage(null), 3000);
      return newSettlement;
    } catch (err) {
      if (err.message.includes("409")) {
        alert("Населенный пункт уже существует");
        return null;
      }
      console.error("Error creating settlement:", err);
      setError(err);
      return null;
    }
  };

  // Функция для создания новой улицы
  const createNewStreet = async (name, settlementName) => {
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement) return null;

    try {
      const newStreet = await ApiService.createStreet({ name, settlement_id: selectedSettlement.id });
      setStr((prev) => ({
        ...prev,
        [selectedSettlement.id]: [...(prev[selectedSettlement.id] || []), newStreet],
      }));
      setSuccessMessage(`Улица "${name}" успешно создана, выберите ее из списка`);
      setTimeout(() => setSuccessMessage(null), 3000);
      return newStreet;
    } catch (err) {
      if (err.message.includes("409")) {
        alert("Улица уже существует в этом населенном пункте");
        return null;
      }
      console.error("Error creating street:", err);
      setError(err);
      return null;
    }
  };

  const handleFieldChange = (fieldName, value) => {
    const errorKey = fieldName;

    // Валидация полей
    if (fieldName === "house" || fieldName === "apartment") {
      if (!validateField(value, validators.digits, errorKey)) return;
    }

    if (fieldName === "building") {
      if (!validateField(value, validators.uppercaseLetters, errorKey)) return;
    }

    if (fieldName === "verificationInterval") {
      if (!validateField(value, validators.twoDigits, errorKey)) return;
    }

    if (fieldName === "serialNumber") {
      if (!validateField(value, validators.serialNumber, errorKey)) return;
    }

    if (fieldName === "dateInstallation" || fieldName === "verificationDate") {
      const currentValue = formData[fieldName] || "";
      const formattedValue = validateAndFormatDateField(value, currentValue, errorKey);
      if (formattedValue === null) return;
      value = formattedValue;
    }

    // Обновляем состояние
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Специальная логика для зависимых полей
    if (fieldName === "s1") {
      setFormData((prev) => ({ ...prev, s2: "", s3: "" }));
      const selectedMpes = mpes.find((m) => m.name === value);
      if (selectedMpes) {
        loadRkesByMpes(selectedMpes.id);
      }
    }

    if (fieldName === "s2") {
      setFormData((prev) => ({ ...prev, s3: "" }));
      const selectedMpes = mpes.find((m) => m.name === formData.s1);
      if (selectedMpes) {
        const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === value);
        if (selectedRkes) {
          loadMuByRkes(selectedRkes.id);
        }
      }
    }

    if (fieldName === "settlement") {
      setFormData((prev) => ({ ...prev, street: "" }));
      const selectedSettlement = settl.find((s) => s.name === value);
      if (selectedSettlement) {
        loadStreetsBySettlements(selectedSettlement.id);
      }
    }

    if (fieldName === "typeDevice") {
      const selectedDevice = deviceTypes.find((device) => device.name === value);
      if (selectedDevice) {
        setFormData((prev) => ({ ...prev, password: selectedDevice.password }));
      }
    }

    if (fieldName === "networkCode") {
      const validation = validateNetworkCode(value);

      if (!validation.valid) {
        setErrorMessages({ ...errorMessages, [errorKey]: validation.message });
        showError(errorKey);

        // Автокоррекция для неверного кода ПС
        if (validation.shouldCorrect) {
          const correctedFormatted = formatNetworkCode(validation.correctedValue);
          updateNetworkPoint(fieldName, correctedFormatted);
        }
        return;
      }

      // Форматируем и обновляем значение
      const formattedValue = formatNetworkCode(value);
      updateNetworkPoint(fieldName, formattedValue);
      clearError(errorKey);
      return;
    }
  };

  const loadRkesByMpes = async (mpesId) => {
    if (rkesOptions[mpesId]) return;
    try {
      const data = await ApiService.getRkesByMpes(mpesId);
      setRkesOptions((prev) => ({ ...prev, [mpesId]: data }));
    } catch (err) {
      console.error("Error loading rkes:", err);
    }
  };

  const loadMuByRkes = async (rkesId) => {
    if (muOptions[rkesId]) return;
    try {
      const data = await ApiService.getMasterUnitsByRkes(rkesId);
      setMuOptions((prev) => ({ ...prev, [rkesId]: data }));
    } catch (err) {
      console.error("Error loading master units:", err);
    }
  };

  const loadStreetsBySettlements = async (settlementId) => {
    if (str[settlementId]) return;
    try {
      const data = await ApiService.getStreetsBySettlement(settlementId);
      setStr((prev) => ({ ...prev, [settlementId]: data }));
    } catch (err) {
      console.error("Error loading streets:", err);
    }
  };

  const getStreetsForSettlement = (settlementName) => {
    if (!settlementName) return [];
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement || !str[selectedSettlement.id]) return [];
    return str[selectedSettlement.id].map((street) => street.name);
  };

  const getRkesOptions = () => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes || !rkesOptions[selectedMpes.id]) return [];
    return rkesOptions[selectedMpes.id].map((r) => r.name);
  };

  const getMuOptions = () => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes) return [];
    const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === formData.s2);
    if (!selectedRkes || !muOptions[selectedRkes.id]) return [];
    return muOptions[selectedRkes.id].map((mu) => mu.name);
  };

  // Вычисление сетевого адреса
  const getNetworkAddress = () => {
    return calculateNetworkAddress(formData.typeDevice, formData.serialNumber);
  };

  // Проверка обязательных полей
  const checkRequiredFields = () => {
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
      formData.ttCoeff,
      formData.tnCoeff,
      formData.ipAddress,
      formData.port,
      formData.simCardShort || formData.simCardFull,
      formData.protocol,
    ];
    return required.every((field) => field && field.toString().trim() !== "");
  };

  const allRequiredFilled = checkRequiredFields();

  const handleExport = async () => {
    try {
      const exportData = [formData];
      await ApiService.exportToExcel(exportData);
    } catch (error) {
      console.error("Ошибка при выгрузке в Excel:", error);
      alert("Ошибка при создании Excel файла");
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: "auto" }}>
      {error && <ErrorAlert error={error} onRetry={loadAllData} title="Ошибка загрузки данных из базы" />}
      {successMessage && (
        <Box sx={{ p: 2, bgcolor: "success.light", color: "success.contrastText", borderRadius: 1 }}>
          {successMessage}
        </Box>
      )}
      <StructureSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        mpes={mpes}
        getRkesOptions={getRkesOptions}
        getMuOptions={getMuOptions}
      />

      <AddressSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        settl={settl}
        getStreetsForSettlement={getStreetsForSettlement}
        createNewSettlement={createNewSettlement}
        createNewStreet={createNewStreet}
        validationErrors={validationErrors}
      />

      <ConsumerSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        abonentTypes={abonentTypes}
        statuses={statuses}
      />

      <NetworkSection formData={formData} handleFieldChange={handleFieldChange} />

      <DeviceSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        deviceTypes={deviceTypes}
        validationErrors={validationErrors}
      />

      <TransformSection formData={formData} handleFieldChange={handleFieldChange} />

      <ConnectionSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        ipAddresses={ipAddresses}
        protocols={protocols}
        getNetworkAddress={getNetworkAddress}
      />

      {/* Кнопка экспорта */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!allRequiredFilled}
          color={allRequiredFilled ? "success" : "primary"}
          size="large"
        >
          Выгрузить в Excel
        </Button>
      </Box>
    </Box>
  );
};

export default SingleForm;
