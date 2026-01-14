import React from "react";
import Box from "@mui/material/Box";
import ErrorAlert from "../../../ui/ErrorAlert";
import EmailSenderDialog from "../../../ui/EmailSenderDialog";
import { useExportData } from "../../../hooks/useExportData";
import { useConnectionData, useEmailSender } from "./hooks";
import { ConnectionPointCard, ConnectionActions } from "./components";

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
  // Хук для управления данными подключения
  const {
    ipAddresses,
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
    assignPortsToConnections,
  } = useConnectionData({
    connectionData,
    onConnectionChange,
    pointsCount,
    transformData,
    deviceData,
    consumerData,
  });

  // Данные для экспорта (без порта)
  const exportDataWithoutPort = useExportData({
    pointsCount,
    structureData,
    addressData,
    consumerData,
    networkData,
    deviceData,
    transformData,
    connectionData: connectionPoints,
    calculateNetworkAddress: getNetworkAddress,
    calculateFinalCoeff,
    includePort: false,
  });

  // Данные для экспорта (с портом)
  const exportDataWithPort = useExportData({
    pointsCount,
    structureData,
    addressData,
    consumerData,
    networkData,
    deviceData,
    transformData,
    connectionData: connectionPoints,
    calculateNetworkAddress: getNetworkAddress,
    calculateFinalCoeff,
    includePort: true,
  });

  // Хук для управления отправкой на email
  const {
    emailDialog,
    email,
    emailSending,
    emailMessage,
    openDialog,
    closeDialog,
    handleEmailChange,
    handleSendToEmail,
    handleExportToExcel,
  } = useEmailSender({
    exportDataWithPort,
    assignPortsToConnections,
    portsAssigned,
  });

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
            pointsCount={pointsCount}
            ipAddresses={ipAddresses}
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
        onExport={() => handleExportToExcel(exportDataWithoutPort)}
        onSendEmail={openDialog}
        allFilled={allFilled()}
      />

      {/* Диалог отправки на email */}
      <EmailSenderDialog
        open={emailDialog}
        onClose={closeDialog}
        email={email}
        onEmailChange={handleEmailChange}
        onSend={handleSendToEmail}
        sending={emailSending}
        message={emailMessage}
      />
    </Box>
  );
};

export default Connection;
