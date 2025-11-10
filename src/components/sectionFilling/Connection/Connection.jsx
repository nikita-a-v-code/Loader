import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { useValidationErrors } from "../../../utils/Validation/Validation";
import { IpAddresses, Protocols } from "../../../data/dataBase";

const Connection = ({
  onNext,
  onBack,
  connectionData = {},
  onConnectionChange = () => {},
  pointsCount = 1,
  transformData = {},
  deviceData = {},
  consumerData = {},
}) => {
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

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                  options={IpAddresses}
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
                  options={Protocols}
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

              {/* Поле для выбора номера ком портов */}
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
            </Box>
          </Box>
        ))}
      </Box>

      {/* Кнопки навигации вне обводки */}
      <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={() => typeof onBack === "function" && onBack()}>
          Назад
        </Button>
        <Button
          variant="contained"
          onClick={() => typeof onNext === "function" && onNext()}
          color="success"
          disabled={!allFilled()}
        >
          Далее
        </Button>
      </Box>
    </Box>
  );
};

export default Connection;
