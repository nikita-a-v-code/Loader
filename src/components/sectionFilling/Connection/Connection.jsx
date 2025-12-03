import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { useValidationErrors } from "../../../utils/Validation/Validation";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";
import { useExportData } from "../../../hooks/useExportData";

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
  const [ipAddresses, setIpAddresses] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ipData, protocolData] = await Promise.all([ApiService.getIpAddresses(), ApiService.getProtocols()]);

      setIpAddresses(ipData);
      setProtocols(protocolData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const { errors: validationErrors, showError, clearError } = useValidationErrors();

  const calculateFinalCoeff = (pointIndex) => {
    const ttCoeff = parseFloat(transformData[pointIndex]?.ttCoeff) || 1;
    const tnCoeff = parseFloat(transformData[pointIndex]?.tnCoeff) || 1;
    return (ttCoeff * tnCoeff).toString();
  };

  const calculateNetworkAddress = (pointIndex) => {
    const deviceModel = deviceData[pointIndex]?.typeDevice;
    const serialNumber = deviceData[pointIndex]?.serialNumber;

    if (!deviceModel || !serialNumber) return "";

    // CE серия: все цифры кроме первых 6
    if (["CE 208", "CE 307", "CE 308"].includes(deviceModel)) {
      return serialNumber.substring(6);
    }

    // Милур серия: последние 4 цифры + 16
    if (["Милур 107", "Милур 307"].includes(deviceModel)) {
      const lastFour = serialNumber.slice(-4);
      const result = parseInt(lastFour) + 16;
      return result.toString();
    }

    // МИР серия: последние 4 цифры
    if (["МИР С-04", "МИР С-05", "МИР С-07"].includes(deviceModel)) {
      return serialNumber.slice(-4);
    }

    // РиМ серия: всегда 0
    if (deviceModel.includes("РиМ") || deviceModel.includes("Рим")) {
      return "0";
    }

    // Меркурий серия: 2 последние цифры + логика с +10
    if (deviceModel.includes("Меркурий")) {
      let lastTwo = parseInt(serialNumber.slice(-2));
      while (lastTwo < 17) {
        lastTwo += 10;
      }
      return lastTwo.toString();
    }

    return "";
  };

  const [connectionPoints, setConnectionPoints] = React.useState(() => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        networkAddress: connectionData[i]?.networkAddress || "",
        simCardShort: connectionData[i]?.simCardShort || "",
        simCardFull: connectionData[i]?.simCardFull || "",
        ipAddress: connectionData[i]?.ipAddress || "192.168.0.73",
        protocol: connectionData[i]?.protocol || "TCP",
        communicatorNumber: connectionData[i]?.communicatorNumber || "",
        comPorts: connectionData[i]?.comPorts || "",
        port: connectionData[i]?.port || "",
        advSettings: connectionData[i]?.advSettings || "",
        nameConnection: connectionData[i]?.nameConnection || "",
        requests: connectionData[i]?.requests || "",
        nameUSPD: connectionData[i]?.nameUSPD || "",
        typeUSPD: connectionData[i]?.typeUSPD || "",
        numberUSPD: connectionData[i]?.numberUSPD || "",
        userUSPD: connectionData[i]?.userUSPD || "",
        passwordUSPD: connectionData[i]?.passwordUSPD || "",
      });
    }
    return points;
  });

  // Проверка заполненности всех обязательных полей
  const allFilled = () => {
    return connectionPoints.every(
      (point, index) =>
        (calculateNetworkAddress(index) || point.networkAddress) &&
        point.ipAddress &&
        point.port &&
        point.protocol &&
        (point.simCardShort || point.simCardFull)
    );
  };

  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    // Валидация для номера сим карты (короткий) - только цифры
    if (fieldName === "simCardShort") {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    // Валидация для номера сим карты (полный) - должен начинаться с 89 и максимум 11 цифр
    if (fieldName === "simCardFull") {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      }
      if (value.length > 11) {
        showError(errorKey);
        return;
      }
      if (value.length >= 2 && !value.startsWith("89")) {
        showError(errorKey);
        return;
      }
      clearError(errorKey);
    }

    // Валидация для номера коммуникатора - только цифры
    if (fieldName === "communicatorNumber") {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    // Валидация для порта - только цифры
    if (fieldName === "port") {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    const newPoints = [...connectionPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };
    setConnectionPoints(newPoints);
    onConnectionChange(newPoints);
  };

  const applyToAll = (sourceIndex, fieldName) => {
    const sourceValue = connectionPoints[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = connectionPoints.map((point) => ({
      ...point,
      [fieldName]: sourceValue,
    }));
    setConnectionPoints(newPoints);
    onConnectionChange(newPoints);
  };

  const applyToNext = (sourceIndex, fieldName) => {
    const sourceValue = connectionPoints[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= connectionPoints.length - 1) return;

    const newPoints = [...connectionPoints];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };
    setConnectionPoints(newPoints);
    onConnectionChange(newPoints);
  };

  /* Используем хук для получения данных экспорта */
  const exportData = useExportData({
    pointsCount,
    structureData,
    addressData,
    consumerData,
    networkData,
    deviceData,
    transformData,
    connectionData: connectionPoints,
    calculateNetworkAddress,
    calculateFinalCoeff,
  });

  const handleExportToExcel = async () => {
    try {
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
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {error && <ErrorAlert error={error} onRetry={loadData} title="Ошибка загрузки данных из базы" />}
      {/* Контейнер однотипных полей - располагает однотипные поля горизонтально в ряд */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 3, flexWrap: "wrap" }}>
        {connectionPoints.map((connection, index) => (
          /* Контейнер для отдельной точки учета - визуальное выделение*/
          <Box key={index} sx={{ mb: 2, border: "2px solid black", borderRadius: 2, p: 2 }}>
            {/* Контейнер  для заголовка */}
            <Box
              sx={{
                mb: 1,
                minWidth: 240,
                maxWidth: 240,
                fontWeight: "bold",
                fontSize: "16px",
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {consumerData[index]?.consumerName || "Точка учета"}
            </Box>
            {/* Контейнер,  организующий вертикальную структуру полей внутри каждой точки учета */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 240 }}>
              {/* Поле для выбора IP адреса */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`ipAddress-${index}`}
                  label="IP адрес"
                  options={Array.isArray(ipAddresses) ? ipAddresses.map((ip) => ip.address) : []}
                  value={connection.ipAddress}
                  onChange={(e) => handleFieldChange(index, "ipAddress", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  size="small"
                  sx={{ width: 210 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.ipAddress}
                  onApplyToAll={() => applyToAll(index, "ipAddress")}
                  onApplyToNext={() => applyToNext(index, "ipAddress")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для вывода номера порта */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`port-${index}`}
                  label="Порт"
                  value={connection.port}
                  onChange={(e) => handleFieldChange(index, "port", e.target.value)}
                  freeInput={true}
                  required={true}
                  error={validationErrors[`port-${index}`]}
                  helperText={validationErrors[`port-${index}`] ? "Только цифры" : "Обязательное поле"}
                  size="small"
                  sx={{ width: 210 }}
                />
              </Box>

              {/* Поле для вывода сетевого адреса */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <TextField
                  id={`networkAddress-${index}`}
                  label="Сетевой адрес (не редактируемый)"
                  value={calculateNetworkAddress(index) || connection.networkAddress}
                  InputProps={{ readOnly: true }}
                  helperText="Обязательное поле"
                  size="small"
                  sx={{
                    width: 210,
                    "& .MuiInputBase-root": {
                      height: "55px",
                    },
                  }}
                />
              </Box>

              {/* Поле для ввода номера сим карты (короткого) */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`simCardShort-${index}`}
                  label="Номер сим карты (короткий)"
                  value={connection.simCardShort}
                  onChange={(e) => handleFieldChange(index, "simCardShort", e.target.value)}
                  freeInput={true}
                  required={true}
                  error={validationErrors[`simCardShort-${index}`]}
                  helperText={validationErrors[`simCardShort-${index}`] ? "Только цифры" : "Обязательное поле"}
                  size="small"
                  sx={{ width: 210 }}
                />
              </Box>

              {/* Поле для ввода номера сим карты (полного) */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`simCardFull-${index}`}
                  label="Номер сим карты (полный)"
                  value={connection.simCardFull}
                  onChange={(e) => handleFieldChange(index, "simCardFull", e.target.value)}
                  freeInput={true}
                  required={true}
                  error={validationErrors[`simCardFull-${index}`]}
                  helperText={
                    validationErrors[`simCardFull-${index}`] ? "11 цифр, начинается с восьмерки" : "Обязательное поле"
                  }
                  size="small"
                  sx={{ width: 210 }}
                />
              </Box>

              {/* Поле для выбора типа протокола */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`protocol-${index}`}
                  label="Протокол"
                  options={Array.isArray(protocols) ? protocols.map((p) => p.name) : []}
                  value={connection.protocol}
                  onChange={(e) => handleFieldChange(index, "protocol", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  size="small"
                  sx={{ width: 210 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.protocol}
                  onApplyToAll={() => applyToAll(index, "protocol")}
                  onApplyToNext={() => applyToNext(index, "protocol")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для вывода коэффициента итогового (нередактируемого, рассчитывается по формуле) */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <TextField
                  id={`finalCoeff-${index}`}
                  label="Коэффициент итоговый (не редактируемый)"
                  value={calculateFinalCoeff(index)}
                  InputProps={{ readOnly: true }}
                  helperText="Обязательное поле"
                  size="small"
                  sx={{
                    width: 210,
                    "& .MuiInputBase-root": {
                      height: "55px",
                    },
                  }}
                />
              </Box>

              {/* Поле для ввода номера коммуникатора */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, marginTop: 10 }}>
                <EnSelect
                  id={`communicatorNumber-${index}`}
                  label="Номер коммуникатора (для счетчиков РиМ)"
                  value={connection.communicatorNumber}
                  onChange={(e) => handleFieldChange(index, "communicatorNumber", e.target.value)}
                  freeInput={true}
                  error={validationErrors[`communicatorNumber-${index}`]}
                  helperText={
                    validationErrors[`communicatorNumber-${index}`] ? "Только цифры" : "Обязательное поле (для РиМ)"
                  }
                  size="small"
                  sx={{ width: 210 }}
                />
              </Box>

              {/* Поле для ввода номера ком портов */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`comPorts-${index}`}
                  label="Номера ком портов"
                  value={connection.comPorts}
                  onChange={(e) => handleFieldChange(index, "comPorts", e.target.value)}
                  freeInput={true}
                  helperText="Обязательное поле (для CSD)"
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.comPorts}
                  onApplyToAll={() => applyToAll(index, "comPorts")}
                  onApplyToNext={() => applyToNext(index, "comPorts")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода дополнительных параметров */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`advSettings-${index}`}
                  label="Дополнительные параметры счетчика"
                  value={connection.advSettings}
                  onChange={(e) => handleFieldChange(index, "advSettings", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.advSettings}
                  onApplyToAll={() => applyToAll(index, "advSettings")}
                  onApplyToNext={() => applyToNext(index, "advSettings")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода наименования соединения */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`nameConnection-${index}`}
                  label="Наименование соединения"
                  value={connection.nameConnection}
                  onChange={(e) => handleFieldChange(index, "nameConnection", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.nameConnection}
                  onApplyToAll={() => applyToAll(index, "nameConnection")}
                  onApplyToNext={() => applyToNext(index, "nameConnection")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода запросов */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`requests-${index}`}
                  label="Запросы"
                  value={connection.requests}
                  onChange={(e) => handleFieldChange(index, "requests", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.requests}
                  onApplyToAll={() => applyToAll(index, "requests")}
                  onApplyToNext={() => applyToNext(index, "requests")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода наименования УСПД */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`nameUSPD-${index}`}
                  label="Наименование УСПД"
                  value={connection.nameUSPD}
                  onChange={(e) => handleFieldChange(index, "nameUSPD", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.nameUSPD}
                  onApplyToAll={() => applyToAll(index, "nameUSPD")}
                  onApplyToNext={() => applyToNext(index, "nameUSPD")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода типа УСПД */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`typeUSPD-${index}`}
                  label="Тип УСПД"
                  value={connection.typeUSPD}
                  onChange={(e) => handleFieldChange(index, "typeUSPD", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.typeUSPD}
                  onApplyToAll={() => applyToAll(index, "typeUSPD")}
                  onApplyToNext={() => applyToNext(index, "typeUSPD")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода серийного номера УСПД */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`numberUSPD-${index}`}
                  label="Серийный номер УСПД"
                  value={connection.numberUSPD}
                  onChange={(e) => handleFieldChange(index, "numberUSPD", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.numberUSPD}
                  onApplyToAll={() => applyToAll(index, "numberUSPD")}
                  onApplyToNext={() => applyToNext(index, "numberUSPD")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода пользователя УСПД */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`userUSPD-${index}`}
                  label="Пользователь УСПД"
                  value={connection.userUSPD}
                  onChange={(e) => handleFieldChange(index, "userUSPD", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.userUSPD}
                  onApplyToAll={() => applyToAll(index, "userUSPD")}
                  onApplyToNext={() => applyToNext(index, "userUSPD")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>

              {/* Поле для ввода пароля УСПД */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`passwordUSPD-${index}`}
                  label="Пароль УСПД"
                  value={connection.passwordUSPD}
                  onChange={(e) => handleFieldChange(index, "passwordUSPD", e.target.value)}
                  freeInput={true}
                  size="small"
                  sx={{ width: 360 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={connection.passwordUSPD}
                  onApplyToAll={() => applyToAll(index, "passwordUSPD")}
                  onApplyToNext={() => applyToNext(index, "passwordUSPD")}
                  totalPoints={connectionPoints.length}
                  arrowDirection="right"
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Кнопки навигации вне обводки */}
      <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={() => typeof onBack === "function" && onBack()}>
          Назад
        </Button>
        <Button variant="contained" onClick={handleExportToExcel} color="success" disabled={!allFilled()}>
          Выгрузить в Excel
        </Button>
      </Box>
    </Box>
  );
};

export default Connection;
