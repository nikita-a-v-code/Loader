import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";

const Device = ({
  onNext,
  onBack,
  currentStep,
  deviceData = {},
  onDeviceChange = () => {},
  pointsCount = 1,
  consumerData = {},
}) => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ApiService.getDevices();
      setDeviceTypes(data);
    } catch (err) {
      console.error("Error loading device:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const phaseOptions = [
    { value: "1", label: "1" },
    { value: "3", label: "3" },
  ];

  // Получение опций для моделей счетчиков из API
  const getDeviceTypeOptions = () => {
    return deviceTypes.map((device) => device.name);
  };

  const { errors: validationErrors, showError, clearError } = useValidationErrors();
  const [devicePoints, setDevicePoints] = React.useState(() => {
    const device = [];
    for (let i = 0; i < pointsCount; i++) {
      device.push({
        typeDevice: deviceData[i]?.typeDevice || "",
        serialNumber: deviceData[i]?.serialNumber || "",
        numberPhases: deviceData[i]?.numberPhases || "",
        verificationDate: deviceData[i]?.verificationDate || "",
        verificationInterval: deviceData[i]?.verificationInterval || "",
        dateInstallation: deviceData[i]?.dateInstallation || "",
        numberTerminal: deviceData[i]?.numberTerminal || "",
        numberCasing: deviceData[i]?.numberCasing || "",
        password: deviceData[i]?.password || "",
        note: deviceData[i]?.note || "",
      });
    }
    return device;
  });

  // Сохранение данных потребителей в родительский компонент
  const updateDeviceData = () => {
    onDeviceChange(devicePoints);
  };

  // Проверка заполненности всех обязательных полей (тип абонента и статус счета)
  const allFilled = devicePoints.every((point) => point.typeDevice && point.serialNumber && point.password);

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    /* Валидация полей */

    if (fieldName === "verificationInterval") {
      const threeDigitsRegex = /^\d{0,2}$/;
      if (!threeDigitsRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    if (fieldName === "serialNumber") {
      const digitsOnlyRegex = /^\d*$/;
      if (!digitsOnlyRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    if (fieldName === "numberFeeder04" || fieldName === "numberTP") {
      const twoCharsRegex = /^[\dА-ЯA-Z]{0,2}$/;
      if (!twoCharsRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    if (fieldName === "dateInstallation" || fieldName === "verificationDate") {
      // Проверяем, есть ли недопустимые символы
      if (!/^[\d.]*$/.test(value)) {
        showError(errorKey);
        return;
      }

      // Получаем текущее значение для сравнения
      const currentValue = devicePoints[pointIndex][fieldName] || "";

      // Если длина уменьшается (удаление), не форматируем
      if (value.length >= currentValue.length) {
        // Автоформатирование при добавлении символов
        let formattedValue = value.replace(/\D/g, ""); // Убираем все не-цифры
        if (formattedValue.length >= 2) {
          formattedValue = formattedValue.substring(0, 2) + "." + formattedValue.substring(2);
        }
        if (formattedValue.length >= 5) {
          formattedValue = formattedValue.substring(0, 5) + "." + formattedValue.substring(5, 9);
        }
        if (formattedValue.length > 10) {
          formattedValue = formattedValue.substring(0, 10);
        }
        value = formattedValue;
      }
      clearError(errorKey);
    }

    const newPoints = [...devicePoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };

    // Автоматическая подстановка пароля при выборе модели счетчика
    if (fieldName === "typeDevice") {
      const selectedDevice = deviceTypes.find((device) => device.name === value);
      if (selectedDevice) {
        newPoints[pointIndex].password = selectedDevice.password;
      }
    }

    setDevicePoints(newPoints);
    onDeviceChange(newPoints);
  };

  // Применение значения поля ко всем точкам потребителей (синяя кнопка)
  const applyToAll = (sourceIndex, fieldName) => {
    const sourceValue = devicePoints[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = devicePoints.map((device) => ({
      ...device,
      [fieldName]: sourceValue,
    }));

    // При копировании модели счетчика также копируем пароль
    if (fieldName === "typeDevice") {
      const selectedDevice = deviceTypes.find((device) => device.name === sourceValue);
      if (selectedDevice) {
        newPoints.forEach((point) => {
          point.password = selectedDevice.password;
        });
      }
    }

    setDevicePoints(newPoints);
    onDeviceChange(newPoints);
  };

  // Копирование значения поля в следующую строку (зеленая кнопка)
  const applyToNext = (sourceIndex, fieldName) => {
    const sourceValue = devicePoints[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= devicePoints.length - 1) return;

    const newPoints = [...devicePoints];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };

    // При копировании модели счетчика также копируем пароль
    if (fieldName === "typeDevice") {
      const selectedDevice = deviceTypes.find((device) => device.name === sourceValue);
      if (selectedDevice) {
        newPoints[sourceIndex + 1].password = selectedDevice.password;
      }
    }

    setDevicePoints(newPoints);
    onDeviceChange(newPoints);
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    /* Главный контейнер - организует вертикальную структуру. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {error && <ErrorAlert error={error} onRetry={loadDeviceTypes} title="Ошибка загрузки данных из базы" />}
      {/* Контейнер однотипных полей - располагает однотипные поля горизонтально в ряд */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {devicePoints.map((device, index) => {
          return (
            /* Контейнер для отдельной точки учета - визуальное выделение*/
            <Box key={index} sx={{ mb: 2, border: "2px solid black", borderRadius: 2, p: 2 }}>
              {/* Контейнер одной точки учета - все поля формы */}
              <Box key={index} sx={{ mb: 1 }}>
                {/* Вывод номера точки учета */}
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    maxWidth: 240,
                  }}
                >
                  {/* Поле для выбора модели счетчика */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <EnSelect
                      id={`typeDevice-${index}`}
                      label={"Модель счетчика"}
                      options={getDeviceTypeOptions()}
                      value={device.typeDevice}
                      onChange={(e) => handleFieldChange(index, "typeDevice", e.target.value)}
                      required={true}
                      helperText="Обязательное поле"
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.typeDevice}
                      onApplyToAll={() => applyToAll(index, "typeDevice")}
                      onApplyToNext={() => applyToNext(index, "typeDevice")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода серийного номера */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <EnSelect
                      id={`serialNumber-${index}`}
                      label={"Серийный номер"}
                      value={device.serialNumber}
                      onChange={(e) => handleFieldChange(index, "serialNumber", e.target.value)}
                      required={true}
                      freeInput={true}
                      error={validationErrors[`serialNumber-${index}`]}
                      helperText={validationErrors[`serialNumber-${index}`] ? "Только цифры" : "Обязательное поле"}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                  </Box>

                  {/* Поле для выбора количества фаз */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <EnSelect
                      id={`numberPhases-${index}`}
                      label="Кол-во фаз"
                      options={phaseOptions}
                      value={device.numberPhases}
                      onChange={(e) => handleFieldChange(index, "numberPhases", e.target.value)}
                      required={false}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.numberPhases}
                      onApplyToAll={() => applyToAll(index, "numberPhases")}
                      onApplyToNext={() => applyToNext(index, "numberPhases")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода даты поверки */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <EnSelect
                      id={`verificationDate-${index}`}
                      label="Дата поверки"
                      value={device.verificationDate}
                      onChange={(e) => handleFieldChange(index, "verificationDate", e.target.value)}
                      freeInput={true}
                      required={false}
                      error={validationErrors[`verificationDate-${index}`]}
                      helperText={validationErrors[`verificationDate-${index}`] ? "Только формат ДД.ММ.ГГГГ" : ""}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.verificationDate}
                      onApplyToAll={() => applyToAll(index, "verificationDate")}
                      onApplyToNext={() => applyToNext(index, "verificationDate")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода межповерочного интервала */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`verificationInterval-${index}`}
                      label="Межповерочный интервал (лет)"
                      value={device.verificationInterval}
                      onChange={(e) => handleFieldChange(index, "verificationInterval", e.target.value)}
                      freeInput={true}
                      required={false}
                      error={validationErrors[`verificationInterval-${index}`]}
                      helperText={validationErrors[`verificationInterval-${index}`] ? "Только 2 цифры" : ""}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.verificationInterval}
                      onApplyToAll={() => applyToAll(index, "verificationInterval")}
                      onApplyToNext={() => applyToNext(index, "verificationInterval")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода даты установки */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`dateInstallation-${index}`}
                      label="Дата установки"
                      value={device.dateInstallation}
                      onChange={(e) => handleFieldChange(index, "dateInstallation", e.target.value)}
                      freeInput={true}
                      required={false}
                      error={validationErrors[`dateInstallation-${index}`]}
                      helperText={validationErrors[`dateInstallation-${index}`] ? "Только формат ДД.ММ.ГГГГ" : ""}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <Box>
                      <CopyButtons
                        pointsCount={pointsCount}
                        index={index}
                        fieldValue={device.dateInstallation}
                        onApplyToAll={() => applyToAll(index, "dateInstallation")}
                        onApplyToNext={() => applyToNext(index, "dateInstallation")}
                        totalPoints={devicePoints.length}
                        arrowDirection="right"
                      />
                    </Box>
                  </Box>

                  {/* Поле для ввода номера пломбы на клемной крышке */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`numberTerminal-${index}`}
                      label="Номер пломбы на клемной крышке"
                      value={device.numberTerminal}
                      onChange={(e) => handleFieldChange(index, "numberTerminal", e.target.value)}
                      freeInput={true}
                      required={false}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.numberTerminal}
                      onApplyToAll={() => applyToAll(index, "numberTerminal")}
                      onApplyToNext={() => applyToNext(index, "numberTerminal")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода номера пломбы на корпусе счетчика */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`numberCasing-${index}`}
                      label="Номер пломбы на корпусе счетчика"
                      value={device.numberCasing}
                      onChange={(e) => handleFieldChange(index, "numberCasing", e.target.value)}
                      freeInput={true}
                      required={false}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.numberCasing}
                      onApplyToAll={() => applyToAll(index, "numberCasing")}
                      onApplyToNext={() => applyToNext(index, "numberCasing")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для вывода пароля в зависимости от выбранной модели счетчика */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`password-${index}`}
                      label="Пароль на конфигурирование"
                      value={device.password}
                      onChange={(e) => handleFieldChange(index, "password", e.target.value)}
                      required={true}
                      freeInput={true}
                      helperText="Обязательное поле"
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={device.password}
                      onApplyToAll={() => applyToAll(index, "password")}
                      onApplyToNext={() => applyToNext(index, "password")}
                      totalPoints={devicePoints.length}
                      arrowDirection="right"
                    />
                  </Box>

                  {/* Поле для ввода примечания */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <EnSelect
                      id={`note-${index}`}
                      label="Примечание"
                      value={device.note}
                      onChange={(e) => handleFieldChange(index, "note", e.target.value)}
                      freeInput={true}
                      required={false}
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mt: 2,
          width: "100%",
        }}
      >
        <Button
          variant="outlined"
          onClick={() => typeof onBack === "function" && onBack()}
          disabled={currentStep === 0}
        >
          Назад
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            updateDeviceData(); // Сохраняем данные перед переходом
            typeof onNext === "function" && onNext();
          }}
          disabled={!allFilled}
          color={allFilled ? "success" : "primary"}
        >
          Далее
        </Button>
      </Box>
    </Box>
  );
};

export default Device;
