import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ErrorAlert from "../../ui/ErrorAlert";
import EmailSenderDialog from "../../ui/EmailSenderDialog";
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
  const [portsAssigned, setPortsAssigned] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessages, setErrorMessages] = React.useState({});
  const [email, setEmail] = useState("");
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });

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
        ApiService.getProtocols(),
      ]);

      setMpes(mpesData);
      setSettl(settlData);
      setAbonentTypes(abonentData);
      setStatuses(statusData);
      setDeviceTypes(deviceData);
      setIpAddresses(ipData);
      setProtocols(protocolData);
      
      // Получаем дефолтные значения из справочников
      const defaultIp = ipData.find((item) => item.is_default)?.address || ipData[0]?.address || "";
      const defaultProtocol = protocolData.find((item) => item.is_default)?.name || protocolData[0]?.name || "";
      
      // Обновляем дефолтные значения в форме, если они еще не заполнены
      setFormData(prev => ({
        ...prev,
        ipAddress: prev.ipAddress || defaultIp,
        protocol: prev.protocol || defaultProtocol,
      }));
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    ApiService.getDefaultEmail()
      .then((resp) => {
        if (active && resp?.defaultEmail) {
          setEmail(resp.defaultEmail);
        }
      })
      .catch((err) => {
        console.error("Не удалось получить дефолтный email:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Преобразование s1, s2, s3 в имена для экспорта
  // Универсальное преобразование: если в formData хранится id, ищем name по id, если name — используем name
  const getExportFormData = (includePort = false) => {
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

    // Собираем объект для экспорта с правильными ключами
    const exportObj = {
      ...formData,
      mpes: mpesName || "",
      rkes: rkesName || "",
      masterUnit: muName || "",
      deviceModel: formData.typeDevice || "",
      networkAddress: getNetworkAddress() || "",
      ...(includePort ? {} : { port: undefined }), // Если не includePort, удаляем port
    };
    // Удаляем s1, s2, s3, typeDevice чтобы не было мусора
    delete exportObj.s1;
    delete exportObj.s2;
    delete exportObj.s3;
    delete exportObj.typeDevice;
    if (!includePort) delete exportObj.port;
    return exportObj;
  };

  const handleSendToEmail = async () => {
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }

    try {
      let exportObj;
      if (!portsAssigned) {
        const port = await assignPortToConnections();
        exportObj = { ...getExportFormData(true), port };
      } else {
        exportObj = getExportFormData(true);
      }
      setEmailSending(true);
      setEmailMessage({ text: "", type: "success" }); // Очистить предыдущее сообщение
      await ApiService.sendExcelToEmail([exportObj], email);
      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
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

    // Валидация networkCode ПЕРЕД обновлением состояния
    if (fieldName === "networkCode") {
      const validation = validateNetworkCode(value);

      if (!validation.valid) {
        setErrorMessages({ ...errorMessages, [errorKey]: validation.message });
        showError(errorKey);

        // Автокоррекция для неверного кода ПС
        if (validation.shouldCorrect) {
          const correctedFormatted = formatNetworkCode(validation.correctedValue);
          setFormData((prev) => ({ ...prev, [fieldName]: correctedFormatted }));
        }
        // Блокируем ввод невалидных символов
        return;
      }

      // Форматируем и обновляем значение
      const formattedValue = formatNetworkCode(value);
      setFormData((prev) => ({ ...prev, [fieldName]: formattedValue }));
      clearError(errorKey);
      return;
    }

    // Валидация полей
    if (fieldName === "house" || fieldName === "apartment" || fieldName === "transformerSubstationNumber") {
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

    if (fieldName === "simCardFull") {
      if (!validateField(value, validators.simCardFull, errorKey)) return;
    }

    if (fieldName === "simCardShort") {
      if (!validateField(value, validators.simCardShort, errorKey)) return;
    }

    if (fieldName === "communicatorNumber") {
      if (!validateField(value, validators.communicatorNumber, errorKey)) return;
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

  // Автоматическое назначение порта для одиночной формы
  const assignPortToConnections = async () => {
    try {
      if (portsAssigned) return formData.port;

      // Если порт уже заполнен в форме, ничего не делаем
      if (formData.port && formData.port.toString().trim() !== "") {
        setPortsAssigned(true);
        return formData.port;
      }

      // Получаем следующий доступный порт
      const { nextPort } = await ApiService.getNextPort();
      const portStr = String(nextPort);

      // Обновляем значение в форме и ждем применения
      await new Promise((resolve) => {
        setFormData((prev) => {
          resolve();
          return { ...prev, port: portStr };
        });
      });

      // Сохраняем порт в базу данных
      await ApiService.createPort({
        portNumber: portStr,
        description: `Автоматически назначен для ${formData.consumerName || "пользователя"}`,
      });

      setPortsAssigned(true);
      return portStr;
    } catch (err) {
      console.error("Error assigning port:", err);
      setPortsAssigned(true);
      return formData.port;
    }
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
      formData.transformerSubstationNumber,
      formData.ttCoeff,
      formData.tnCoeff,
      formData.ipAddress,
      formData.simCardShort || formData.simCardFull,
      formData.protocol,
    ];
    return required.every((field) => field && field.toString().trim() !== "");
  };

  const allRequiredFilled = checkRequiredFields();

  const handleExport = async () => {
    try {
      const exportData = [getExportFormData(false)];
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

      <NetworkSection
        formData={formData}
        handleFieldChange={handleFieldChange}
        validationErrors={validationErrors}
        errorMessages={errorMessages}
      />

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
        validationErrors={validationErrors}
        errorMessages={errorMessages}
      />

      {/* Кнопка экспорта */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!allRequiredFilled}
          color={allRequiredFilled ? "success" : "primary"}
          size="large"
          sx={{ mr: 2 }}
        >
          Выгрузить в Excel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setEmailDialog(true);
            setEmailMessage({ text: "", type: "success" });
          }}
          color={allRequiredFilled ? "success" : "primary"}
          disabled={!allRequiredFilled}
        >
          Отправить на Email
        </Button>
        {/* Диалог для ввода email */}
        <EmailSenderDialog
          open={emailDialog}
          onClose={() => setEmailDialog(false)}
          email={email}
          onEmailChange={(value) => {
            setEmail(value);
            setEmailMessage({ text: "", type: "success" });
          }}
          onSend={handleSendToEmail}
          sending={emailSending}
          message={emailMessage}
        />
      </Box>
    </Box>
  );
};

export default SingleForm;
