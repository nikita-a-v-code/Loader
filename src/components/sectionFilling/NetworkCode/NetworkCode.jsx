import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import AddNewElement from "../../../ui/Buttons/AddNewElement";
import ApiService from "../../../services/api";
import { Manual, SubstationCode } from "../../../data/dataBase";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";
import { formatNetworkCode, validateNetworkCode, validateDigitsOnly } from "../../../utils/networkCodeValidation";
import { useAuth } from "../../../context/AuthContext";

const NetworkCode = ({
  onNext,
  onBack,
  currentStep,
  networkData = {},
  onNetworkChange = () => {},
  pointsCount = 1,
  consumerData = {},
}) => {
  const { user } = useAuth();
  const { errors: validationErrors, showError, clearError } = useValidationErrors();
  const [errorMessages, setErrorMessages] = React.useState({});
  const [numberTP, setNumberTP] = React.useState([]);
  const [loadingTP, setLoadingTP] = React.useState(false);
  const [networkPoints, setNetworkPoints] = React.useState(() => {
    const code = [];
    for (let i = 0; i < pointsCount; i++) {
      code.push({
        networkCode: networkData[i]?.networkCode || "",
        transformerSubstationNumber: networkData[i]?.transformerSubstationNumber || "",
        numberSupport04: networkData[i]?.numberSupport04 || "",
        maxPower: networkData[i]?.maxPower || "",
      });
    }
    return code;
  });

  // Сохранение данных потребителей в родительский компонент
  const updateNetworkData = () => {
    onNetworkChange(networkPoints);
  };

  // Проверка заполненности всех обязательных полей (номер ТП)
  const allFilled = networkPoints.every((point) => point.transformerSubstationNumber);

  // Загрузка списка номеров ТП
  React.useEffect(() => {
    const loadNumberTP = async () => {
      try {
        setLoadingTP(true);
        const response = await ApiService.getNumberTP();
        setNumberTP(response || []);
      } catch (error) {
        console.error("Ошибка загрузки номеров ТП:", error);
        setNumberTP([]);
      } finally {
        setLoadingTP(false);
      }
    };
    loadNumberTP();
  }, []);

  // Функция создания нового номера ТП
  const createNumberTp = async (name) => {
    try {
      const newTP = await ApiService.createNumberTP({ 
        name, 
        userId: user?.id,
        source: "section_filling"
      });
      setNumberTP((prev) => [...prev, newTP]);
      return newTP;
    } catch (error) {
      console.error("Ошибка создания номера ТП:", error);
      throw error;
    }
  };

  // Опции для выпадающего списка номеров ТП
  const numberTPOptions = numberTP.map((item) => item.name);

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    if (fieldName === "networkCode") {
      const validation = validateNetworkCode(value);

      if (!validation.valid) {
        setErrorMessages({ ...errorMessages, [errorKey]: validation.message });
        showError(errorKey);

        // Автокоррекция для неверного кода ПС
        if (validation.shouldCorrect) {
          const correctedFormatted = formatNetworkCode(validation.correctedValue);
          updateNetworkPoint(pointIndex, fieldName, correctedFormatted);
        }
        return;
      }

      // Форматируем и обновляем значение
      const formattedValue = formatNetworkCode(value);
      updateNetworkPoint(pointIndex, fieldName, formattedValue);
      clearError(errorKey);
      return;
    }

    if (fieldName === "maxPower") {
      if (!validateDigitsOnly(value)) {
        showError(errorKey);
        return;
      }
      clearError(errorKey);
    }

    if (fieldName === "transformerSubstationNumber") {
      if (!value || value.trim() === "") {
        showError(errorKey);
        return;
      }
      clearError(errorKey);
    }

    updateNetworkPoint(pointIndex, fieldName, value);
  };

  // Вспомогательная функция для обновления точки
  const updateNetworkPoint = (pointIndex, fieldName, value) => {
    const newPoints = [...networkPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };
    setNetworkPoints(newPoints);
    onNetworkChange(newPoints);
  };

  // Применение значения поля ко всем точкам потребителей (синяя кнопка)
  const applyToAll = (sourceIndex, fieldName) => {
    const sourceValue = networkPoints[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = networkPoints.map((code) => ({
      ...code,
      [fieldName]: sourceValue,
    }));
    setNetworkPoints(newPoints);
    onNetworkChange(newPoints);
  };

  // Копирование значения поля в следующую строку (зеленая кнопка)
  const applyToNext = (sourceIndex, fieldName) => {
    const sourceValue = networkPoints[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= networkPoints.length - 1) return;

    const newPoints = [...networkPoints];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };
    setNetworkPoints(newPoints);
    onNetworkChange(newPoints);
  };

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Контейнер однотипных полей - располагает однотипные поля горизонтально в ряд */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {networkPoints.map((code, index) => {
          return (
            /* Контейнер для отдельной точки учета - визуальное выделение*/
            <Box key={index} sx={{ mb: 1, border: "2px solid black", borderRadius: 2, p: 2 }}>
              {/* Контейнер  для заголовка */}
              <Box
                sx={{
                  mb: 1,
                  minWidth: 240,
                  maxWidth: 240,
                  fontWeight: "bold",
                  fontSize: "16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {consumerData[index]?.consumerName || "Точка учета"}
              </Box>
              {/* Контейнер,  организующий вертикальную структуру полей внутри каждой точки учета */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  maxWidth: 240,
                }}
              >
                {/* Контейнер общий для ввода сетевого кода и отображения ошибки под полем */}
                <Box>
                  {/* Поле для ввода сетевого кода */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <EnSelect
                      id={`networkCode-${index}`}
                      label="Сетевой код"
                      placeholder="ААА-БВВ-ГГ-ДЕ-ЖЖЖ"
                      value={code.networkCode}
                      onChange={(e) => handleFieldChange(index, "networkCode", e.target.value)}
                      freeInput={true}
                      required={false}
                      helperText="Формат: ААА-БВВ-ГГ-ДЕ-ЖЖЖ"
                      size="small"
                      sx={{ minWidth: 210 }}
                    />
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={code.networkCode}
                      onApplyToAll={() => applyToAll(index, "networkCode")}
                      onApplyToNext={() => applyToNext(index, "networkCode")}
                      totalPoints={networkPoints.length}
                      arrowDirection="right"
                    />
                  </Box>
                  {/* Отображение ошибки под полем */}
                  {validationErrors[`networkCode-${index}`] && (
                    <Box sx={{ color: "error.main", fontSize: "14px", mt: 1, ml: 0 }}>
                      {errorMessages[`networkCode-${index}`] || "Неверный формат"}
                    </Box>
                  )}
                </Box>

                {/* Поле для ввода номера трансформаторной подстанции */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <EnSelect
                    id={`transformerSubstationNumber-${index}`}
                    label="Номер трансформаторной подстанции"
                    value={code.transformerSubstationNumber}
                    onChange={(e) => handleFieldChange(index, "transformerSubstationNumber", e.target.value)}
                    options={numberTPOptions}
                    required={true}
                    searchable
                    size="small"
                    error={validationErrors[`transformerSubstationNumber-${index}`]}
                    helperText={
                      validationErrors[`transformerSubstationNumber-${index}`]
                        ? "Выберите номер ТП"
                        : "Обязательное поле"
                    }
                    sx={{ minWidth: 210, marginTop: 2 }}
                  />
                  <Box sx={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={code.transformerSubstationNumber}
                      onApplyToAll={() => applyToAll(index, "transformerSubstationNumber")}
                      onApplyToNext={() => applyToNext(index, "transformerSubstationNumber")}
                      totalPoints={networkPoints.length}
                      arrowDirection="right"
                    />
                    <AddNewElement
                      onAdd={createNumberTp}
                      title="Добавить трансформаторную подстанцию"
                      label="Название трансформаторной подстанции"
                      placeholder="например: ТП-1"
                      validateTPNumber={true}
                      existingItems={numberTP}
                    />
                  </Box>
                </Box>

                {/* Поле для ввода номера опоры 0,4 */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <EnSelect
                    id={`numberSupport04-${index}`}
                    label="Номер опоры 0,4 кВ"
                    value={code.numberSupport04}
                    onChange={(e) => handleFieldChange(index, "numberSupport04", e.target.value)}
                    freeInput={true}
                    required={false}
                    size="small"
                    sx={{ minWidth: 210, marginTop: 2 }}
                  />
                  <Box>
                    <CopyButtons
                      pointsCount={pointsCount}
                      index={index}
                      fieldValue={code.numberSupport04}
                      onApplyToAll={() => applyToAll(index, "numberSupport04")}
                      onApplyToNext={() => applyToNext(index, "numberSupport04")}
                      totalPoints={networkPoints.length}
                      arrowDirection="right"
                    />
                  </Box>
                </Box>

                {/* Поле для ввода максимальной мощности */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    width: "100%",
                    mt: 2,
                  }}
                >
                  <EnSelect
                    id={`maxPower-${index}`}
                    label="Максимальная мощность, кВт"
                    value={code.maxPower}
                    onChange={(e) => handleFieldChange(index, "maxPower", e.target.value)}
                    freeInput={true}
                    required={false}
                    error={validationErrors[`maxPower-${index}`]}
                    helperText={validationErrors[`maxPower-${index}`] ? "Только цифры" : ""}
                    size="small"
                    sx={{ minWidth: 210 }}
                  />

                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.maxPower}
                    onApplyToAll={() => applyToAll(index, "maxPower")}
                    onApplyToNext={() => applyToNext(index, "maxPower")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Кнопки навигации вне обводки */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mt: 2,
          width: "100%",
        }}
      >
        <Button variant="outlined" onClick={() => typeof onBack === "function" && onBack()}>
          Назад
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            updateNetworkData(); // Сохраняем данные перед переходом
            typeof onNext === "function" && onNext();
          }}
          disabled={!allFilled}
          color={allFilled ? "success" : "primary"}
        >
          Далее
        </Button>
      </Box>

      {/* Контейнер общий для справочника кодов подстанций и инструкции по заполнению */}
      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        {/* Справочник кодов подстанций */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            textAlign: "left",
          }}
        >
          <Box sx={{ fontWeight: "bold", mb: 1, fontSize: "16px" }}>Справочник кодов подстанций:</Box>
          {SubstationCode.map((station, index) => (
            <Box key={index} sx={{ mb: 0.5, fontSize: "12px" }}>
              {station.label}
            </Box>
          ))}
        </Box>

        {/* Инструкция по заполнению */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 1,
            textAlign: "left",
          }}
        >
          <Box sx={{ fontWeight: "bold", mb: 1, fontSize: "16px" }}>Инструкция по заполнению:</Box>
          {Manual.map((instruction, index) => (
            <Box key={index} sx={{ mb: 1, fontSize: "14px" }}>
              {instruction}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default NetworkCode;
