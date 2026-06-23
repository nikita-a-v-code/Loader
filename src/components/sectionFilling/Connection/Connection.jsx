import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import ErrorAlert from "../../../ui/ErrorAlert";
import EmailSenderDialog from "../../../ui/EmailSenderDialog";
import ApiService from "../../../services/api";
import { useConnectionData } from "./hooks";
import { ConnectionPointCard, ConnectionActions } from "./components";

/**
 * Компонент управления подключениями точек учета.
 * Отвечает только за данные подключения — параметры связи, порты, протоколы.
 * Логика экспорта и агрегации данных всех шагов находится в SectionFillingExporter.
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
  // Колбэки экспорта передаются из SectionFillingExporter
  onExport,
  onSendToEmail,
  emailDialog = false,
  onEmailDialogOpen = () => {},
  onEmailDialogClose = () => {},
  email = "",
  onEmailChange = () => {},
  emailSending = false,
  emailMessage = { text: "", type: "success" },
}) => {
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

  // Хелперы, передаваемые в SectionFillingExporter для генерации экспорта
  const exportHelpers = {
    getNetworkAddress,
    getIpFromDeviceModel,
    getRequestsFromDeviceModel,
    getAdvSettingsFromDeviceModel,
    calculateFinalCoeff,
  };

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
        onExport={() => onExport(connectionPoints, exportHelpers)}
        onSendEmail={onEmailDialogOpen}
        allFilled={allFilled()}
      />

      {/* Диалог отправки на email */}
      <EmailSenderDialog
        open={emailDialog}
        onClose={onEmailDialogClose}
        email={email}
        onEmailChange={onEmailChange}
        onSend={() => onSendToEmail(connectionPoints, exportHelpers)}
        freeinput={false}
        sending={emailSending}
        message={emailMessage}
      />
    </Box>
  );
};

export default Connection;
