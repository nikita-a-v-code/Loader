import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { validators, useValidationErrors } from "../../../utils/Validation/Validation";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";
import { useExportData } from "../../../hooks/useExportData";
import { calculateNetworkAddress } from "../../../utils/networkAdress";

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
  const [portsAssigned, setPortsAssigned] = useState(false);

  useEffect(() => {
    loadData();
    assignPortsOnMount();
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

  const assignPortsOnMount = async () => {
    try {
      // Проверяем, есть ли уже порты
      const hasEmptyPorts = connectionPoints.some((point) => !point.port);
      if (!hasEmptyPorts) return;

      // Получаем следующий доступный порт
      const { nextPort } = await ApiService.getNextPort();

      // Обновляем порты для всех точек, у которых порт пустой, но НЕ сохраняем в базу
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
  };

  const assignPortsToConnections = async () => {
    try {
      if (portsAssigned) return;

      // Сохраняем порты в базу только для тех, у которых порт есть
      for (let i = 0; i < connectionPoints.length; i++) {
        if (connectionPoints[i].port && !connectionPoints[i].portSaved) {
          await ApiService.createPort({
            portNumber: connectionPoints[i].port,
            description: `Автоматически назначен для ${consumerData[i]?.consumerName || `Точка ${i + 1}`}`,
          });
          // Отмечаем, что порт сохранен
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
  };

  const calculateFinalCoeff = (pointIndex) => {
    const ttCoeff = parseFloat(transformData[pointIndex]?.ttCoeff) || 1;
    const tnCoeff = parseFloat(transformData[pointIndex]?.tnCoeff) || 1;
    return (ttCoeff * tnCoeff).toString();
  };

  const getNetworkAddress = (pointIndex) => {
    const deviceModel = deviceData[pointIndex]?.typeDevice;
    const serialNumber = deviceData[pointIndex]?.serialNumber;
    return calculateNetworkAddress(deviceModel, serialNumber);
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
        portSaved: false, // Флаг, сохранен ли порт в базе
        advSettings: connectionData[i]?.advSettings || "",
        nameConnection: connectionData[i]?.nameConnection || "",
        requests: connectionData[i]?.requests || "",
        nameUSPD: connectionData[i]?.nameUSPD || "",
        typeUSPD: connectionData[i]?.typeUSPD || "",
        numberUSPD: connectionData[i]?.numberUSPD || "",
        userUSPD: connectionData[i]?.userUSPD || "",
        passwordUSPD: connectionData[i]?.passwordUSPD || "",
        showUSPD: connectionData[i]?.showUSPD || false,
      });
    }
    return points;
  });

  // Обработчик переключения тумблера УСПД
  const handleUSPDToggle = (pointIndex, checked) => {
    const newPoints = [...connectionPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      showUSPD: checked,
    };
    setConnectionPoints(newPoints);
    onConnectionChange(newPoints);
  };

  // Проверка заполненности всех обязательных полей
  const allFilled = () => {
    return connectionPoints.every(
      (point, index) =>
        (getNetworkAddress(index) || point.networkAddress) &&
        point.ipAddress &&
        point.port &&
        point.protocol &&
        (point.simCardShort || point.simCardFull)
    );
  };

  const { errors: validationErrors, showError, clearError, validateField } = useValidationErrors();
  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);

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

  const handleFieldChange = (pointIndex, fieldName, value) => {
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
      ...(fieldName === "port" ? { portSaved: false } : {}), // Если порт изменен, отметить как не сохраненный
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

  const handleExportToExcel = async () => {
    try {
      await ApiService.exportToExcel(exportDataWithoutPort);
    } catch (error) {
      console.error("Ошибка при выгрузке в Excel:", error);
      alert("Ошибка при создании Excel файла");
    }
  };

  const handleSendToEmail = async () => {
    if (!email || !email.includes("@")) {
      alert("Введите корректный email адрес");
      return;
    }

    try {
      setEmailSending(true);
      if (!portsAssigned) {
        assignPortsToConnections();
      }
      await ApiService.sendExcelToEmail(exportDataWithPort, email);
      alert(`Файл успешно отправлен на ${email}`);
      setEmailDialog(false);
      setEmail("");
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      alert("Ошибка при отправке на email");
    } finally {
      setEmailSending(false);
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
              {/* Тумблер для полей УСПД */}
              <FormControlLabel
                control={
                  <Switch
                    checked={connection.showUSPD}
                    onChange={(e) => handleUSPDToggle(index, e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Опрос через УСПД
                  </Typography>
                }
                sx={{ mb: 1 }}
              />
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
                <EnSelect
                  id={`networkAddress-${index}`}
                  label="Сетевой адрес"
                  value={getNetworkAddress(index) || connection.networkAddress}
                  onChange={(e) => handleFieldChange(index, "networkAddress", e.target.value)}
                  freeInput={true}
                  required={true}
                  helperText="Обязательное поле"
                  size="small"
                  sx={{ width: 210 }}
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

              {/* Поля УСПД - показываются только при включенном тумблере */}
              {connection.showUSPD && (
                <>
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
                </>
              )}
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
        <Button variant="contained" onClick={() => setEmailDialog(true)} color="primary" disabled={!allFilled()}>
          Отправить на Email
        </Button>
      </Box>

      {/* Диалог для ввода email */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отправить Excel файл на электронную почту</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email адрес"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)}>Отмена</Button>
          <Button onClick={handleSendToEmail} variant="contained" disabled={emailSending}>
            {emailSending ? "Отправляем..." : "Отправить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Connection;
