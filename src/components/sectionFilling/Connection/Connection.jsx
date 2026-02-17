import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import ErrorAlert from "../../../ui/ErrorAlert";
import EmailSenderDialog from "../../../ui/EmailSenderDialog";
import ApiService from "../../../services/api";
import { useConnectionData } from "./hooks";
import { ConnectionPointCard, ConnectionActions } from "./components";
import { useAuth } from "../../../context/AuthContext";

/**
 * Компонент управления подключениями точек учета.
 */
const Connection = ({
  onNext,
  onBack,
  connectionData = {},
  onConnectionChange = () => {},
  pointsCount = 1,
  transformData = {},
  deviceData = {},
  consumerData = {},
  structureData = {},
  addressData = {},
  networkData = {},
}) => {
  const { user } = useAuth();
  
  // Загружаем справочник моделей счетчиков для получения IP адресов
  const [deviceTypes, setDeviceTypes] = useState([]);
  
  useEffect(() => {
    ApiService.getDevices()
      .then(setDeviceTypes)
      .catch((err) => console.error("Error loading device types:", err));
  }, []);
  
  // Хук для управления данными подключения
  const {
    protocols,
    loading,
    error,
    connectionPoints,
    validationErrors,
    portsAssigned,
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
  } = useConnectionData({
    connectionData,
    onConnectionChange,
    pointsCount,
    transformData,
    deviceData,
    consumerData,
    deviceTypes,
  });

  // Состояние для диалога email
  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });

  // Загрузка дефолтного email
  React.useEffect(() => {
    ApiService.getDefaultEmail()
      .then((resp) => {
        if (resp?.defaultEmail) {
          setEmail(resp.defaultEmail);
        }
      })
      .catch((err) => {
        console.error("Не удалось получить дефолтный email:", err);
      });
  }, []);

  // Функция для генерации данных экспорта с актуальными портами
  const generateExportData = (updatedPoints, includePort, isAdminExport) => {
    const data = [];
    for (let i = 0; i < pointsCount; i++) {
      const point = {
        mpes: structureData[i]?.s1 || "",
        rkes: structureData[i]?.s2 || "",
        masterUnit: structureData[i]?.s3 || "",
        settlement: addressData[i]?.settlement || "",
        microdistrict: addressData[i]?.microdistrict || "",
        street: addressData[i]?.street || "",
        house: addressData[i]?.house || "",
        building: addressData[i]?.building || "",
        apartment: addressData[i]?.apartment || "",
        consumerName: consumerData[i]?.consumerName || "",
        deliveryPoint: consumerData[i]?.deliveryPoint || "",
        subscriberType: consumerData[i]?.subscriberType || "",
        accountStatus: consumerData[i]?.accountStatus || "",
        contractNumber: consumerData[i]?.contractNumber || "",
        networkCode: networkData[i]?.networkCode || "",
        transformerSubstationNumber: networkData[i]?.transformerSubstationNumber || "",
        numberSupport04: networkData[i]?.numberSupport04 || "",
        maxPower: networkData[i]?.maxPower || "",
        deviceModel: deviceData[i]?.typeDevice || "",
        numberPhases: deviceData[i]?.numberPhases || "",
        serialNumber: deviceData[i]?.serialNumber || "",
        verificationDate: deviceData[i]?.verificationDate || "",
        verificationInterval: deviceData[i]?.verificationInterval || "",
        dateInstallation: deviceData[i]?.dateInstallation || "",
        numberTerminal: deviceData[i]?.numberTerminal || "",
        numberCasing: deviceData[i]?.numberCasing || "",
        password: deviceData[i]?.password || "",
        note: deviceData[i]?.note || "",
        ttType: transformData[i]?.ttType || "",
        ttSerialA: transformData[i]?.ttSerialA || "",
        ttSerialB: transformData[i]?.ttSerialB || "",
        ttSerialC: transformData[i]?.ttSerialC || "",
        ttDateA: transformData[i]?.ttDateA || "",
        ttIntervalA: transformData[i]?.ttIntervalA || "",
        ttDateB: transformData[i]?.ttDateB || "",
        ttIntervalB: transformData[i]?.ttIntervalB || "",
        ttDateC: transformData[i]?.ttDateC || "",
        ttIntervalC: transformData[i]?.ttIntervalC || "",
        ttCoeff: transformData[i]?.ttCoeff || "1",
        ttSealA: transformData[i]?.ttSealA || "",
        ttSealB: transformData[i]?.ttSealB || "",
        ttSealC: transformData[i]?.ttSealC || "",
        tnType: transformData[i]?.tnType || "",
        tnSerialA: transformData[i]?.tnSerialA || "",
        tnSerialB: transformData[i]?.tnSerialB || "",
        tnSerialC: transformData[i]?.tnSerialC || "",
        tnDateA: transformData[i]?.tnDateA || "",
        tnIntervalA: transformData[i]?.tnIntervalA || "",
        tnDateB: transformData[i]?.tnDateB || "",
        tnIntervalB: transformData[i]?.tnIntervalB || "",
        tnDateC: transformData[i]?.tnDateC || "",
        tnIntervalC: transformData[i]?.tnIntervalC || "",
        tnCoeff: transformData[i]?.tnCoeff || "1",
        tnSealA: transformData[i]?.tnSealA || "",
        tnSealB: transformData[i]?.tnSealB || "",
        tnSealC: transformData[i]?.tnSealC || "",
        networkAddress: getNetworkAddress(i) || updatedPoints[i]?.networkAddress || "",
        simCardFull: updatedPoints[i]?.simCardFull || "",
        simCardShort: updatedPoints[i]?.simCardShort || "",
        ipAddress: updatedPoints[i]?.ipAddress || getIpFromDeviceModel(deviceData[i]?.typeDevice) || "",
        ...(includePort || isAdminExport ? { port: updatedPoints[i]?.port || "" } : {}),
        communicatorNumber: updatedPoints[i]?.communicatorNumber || "",
        protocol: updatedPoints[i]?.protocol || "",
        finalCoeff: calculateFinalCoeff(i) || "",
        comPorts: updatedPoints[i]?.comPorts || "",
        advSettings: updatedPoints[i]?.advSettings || getAdvSettingsFromDeviceModel(deviceData[i]?.typeDevice) || "",
        nameConnection: updatedPoints[i]?.nameConnection || "",
        requests: updatedPoints[i]?.requests || getRequestsFromDeviceModel(deviceData[i]?.typeDevice) || "",
        nameUSPD: updatedPoints[i]?.nameUSPD || "",
        typeUSPD: updatedPoints[i]?.typeUSPD || "",
        numberUSPD: updatedPoints[i]?.numberUSPD || "",
        userUSPD: updatedPoints[i]?.userUSPD || "",
        passwordUSPD: updatedPoints[i]?.passwordUSPD || "",
      };

      // Удаляем поля для не-админов
      if (!isAdminExport) {
        delete point.networkAddress;
        delete point.ipAddress;
        delete point.password;
        delete point.protocol;
        delete point.port;
        delete point.requests;
        delete point.advSettings;
      }

      data.push(point);
    }
    return data;
  };

  // Функция для экспорта в Excel (порты создаются только для админа)
  const handleExport = async () => {
    try {
      const exportData = generateExportData(connectionPoints, false, user?.role_name === "admin");
      await ApiService.exportToExcel(exportData);
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Ошибка при экспорте в Excel");
    }
  };

  // Функция для отправки на email с актуальными портами (для всех пользователей)
  const handleSendToEmail = async () => {
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }
    try {
      setEmailSending(true);
      setEmailMessage({ text: "", type: "success" });
      const exportData = generateExportData(connectionPoints, true, true);
      await ApiService.sendExcelToEmail(exportData, email, user?.id, "section_filling");
      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
    }
  };

  // Состояние загрузки
  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Ошибка загрузки */}
      {error && <ErrorAlert error={error} onRetry={loadData} title="Ошибка загрузки данных из базы" />}

      {/* Список точек подключения */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 3, flexWrap: "wrap" }}>
        {connectionPoints.map((connection, index) => (
          <ConnectionPointCard
            key={index}
            index={index}
            connection={connection}
            consumerName={consumerData[index]?.consumerName}
            deviceModel={deviceData[index]?.typeDevice}
            deviceRequests={deviceData[index]?.requests}
            deviceAdvSettings={deviceData[index]?.advSettings}
            pointsCount={pointsCount}
            protocols={protocols}
            validationErrors={validationErrors}
            networkAddress={getNetworkAddress(index)}
            finalCoeff={calculateFinalCoeff(index)}
            onFieldChange={handleFieldChange}
            onUSPDToggle={handleUSPDToggle}
            onApplyToAll={applyToAll}
            onApplyToNext={applyToNext}
          />
        ))}
      </Box>

      {/* Кнопки действий */}
      <ConnectionActions
        onBack={onBack}
        onExport={handleExport}
        onSendEmail={() => setEmailDialog(true)}
        allFilled={allFilled()}
      />

      {/* Диалог отправки на email */}
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
  );
};

export default Connection;
