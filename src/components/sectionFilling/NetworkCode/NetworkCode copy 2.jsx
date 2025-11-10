import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { Manual, SubstationCode } from "../../../data/dataBase";
import { validators, useValidationErrors, validateField } from "../../../ui/Validation/Validation";

const NetworkCode = ({
  onNext,
  onBack,
  currentStep,
  networkData = {},
  onNetworkChange = () => {},
  pointsCount = 1,
}) => {
  const { errors: validationErrors, showError, clearError } = useValidationErrors();
  const [errorMessages, setErrorMessages] = React.useState({});
  const [networkPoints, setNetworkPoints] = React.useState(() => {
    const code = [];
    for (let i = 0; i < pointsCount; i++) {
      code.push({
        networkCode: networkData[i]?.networkCode || "",
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

  // Автоматическое форматирование сетевого кода
  const formatNetworkCode = (value) => {
    // Убираем все дефисы для чистого ввода
    const cleanValue = value.replace(/-/g, "");
    let formatted = cleanValue;

    // Добавляем дефисы в нужных позициях: ААА-БВВ-ГГ-ДЕ-ЖЖЖ
    if (cleanValue.length > 3) {
      formatted = cleanValue.substring(0, 3) + "-" + cleanValue.substring(3);
    }
    if (cleanValue.length > 6) {
      formatted = cleanValue.substring(0, 3) + "-" + cleanValue.substring(3, 6) + "-" + cleanValue.substring(6);
    }
    if (cleanValue.length > 8) {
      formatted =
        cleanValue.substring(0, 3) +
        "-" +
        cleanValue.substring(3, 6) +
        "-" +
        cleanValue.substring(6, 8) +
        "-" +
        cleanValue.substring(8);
    }
    if (cleanValue.length > 10) {
      formatted =
        cleanValue.substring(0, 3) +
        "-" +
        cleanValue.substring(3, 6) +
        "-" +
        cleanValue.substring(6, 8) +
        "-" +
        cleanValue.substring(8, 10) +
        "-" +
        cleanValue.substring(10);
    }

    return formatted;
  };

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    /* Валидация полей */
    if (fieldName === "networkCode") {
      // Проверяем каждую часть кода по отдельности
      const cleanInput = value.replace(/-/g, "");

      // Проверяем каждую часть по позиции
      for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i];
        if (i < 3) {
          // Первые 3 символа - только цифры
          if (!/\d/.test(char)) {
            setErrorMessages({ ...errorMessages, [errorKey]: "Несуществующий код ПС - найдите нужный в списке ниже" });
            showError(errorKey);
            return;
          }
        } else if (i >= 3 && i < 6) {
          // 4-6 символы - только цифры
          if (!/\d/.test(char)) {
            setErrorMessages({ ...errorMessages, [errorKey]: "Номер фидера 10кВ: только цифры (3 символа)" });
            showError(errorKey);
            return;
          }
        } else if (i >= 6 && i < 8) {
          // 7-8 символы - цифры и заглавные буквы
          if (!/[\dА-ЯA-Z]/.test(char)) {
            setErrorMessages({ ...errorMessages, [errorKey]: "Номер ТП: цифры и заглавные буквы (2 символа)" });
            showError(errorKey);
            return;
          }
        } else if (i >= 8 && i < 10) {
          // 9-10 символы - цифры и заглавные буквы
          if (!/[\dА-ЯA-Z]/.test(char)) {
            setErrorMessages({
              ...errorMessages,
              [errorKey]: "Номер фидера 0,4кВ: цифры и заглавные буквы (2 символа)",
            });
            showError(errorKey);
            return;
          }
        } else if (i >= 10 && i < 13) {
          // 11-13 символы - только цифры, максимум 3 символа
          if (!/\d/.test(char)) {
            setErrorMessages({ ...errorMessages, [errorKey]: "Код потребителя: только цифры (3 символа)" });
            showError(errorKey);
            return;
          }
        } else if (i >= 13) {
          // Не разрешаем больше 13 символов
          setErrorMessages({ ...errorMessages, [errorKey]: "Максимальная длина кода: 13 символов" });
          showError(errorKey);
          return;
        }
      }

      // Форматируем ввод с автоматическими дефисами
      const formattedValue = formatNetworkCode(value);

      // Обновляем значение с форматированием
      const newPoints = [...networkPoints];
      newPoints[pointIndex] = {
        ...newPoints[pointIndex],
        networkCode: formattedValue,
      };
      setNetworkPoints(newPoints);
      onNetworkChange(newPoints);

      value = formattedValue;
      // Проверяем формат ААА-БВВ-ГГ-ДЕ-ЖЖЖ
      const parts = value.split("-");
      if (parts.length === 5) {
        // Валидация каждой части
        const [codePS, numberFeeder10, numberTP, numberFeeder04, codeConsumer3x] = parts;

        // Проверяем код ПС (должен быть в списке SubstationCode)
        const validPS = SubstationCode.some((ps) => ps.value === codePS);
        if (!validPS) {
          showError(errorKey);
          return;
        }

        // Проверяем номер фидера 10кВ (3 цифры)
        if (!/^\d{0,3}$/.test(numberFeeder10)) {
          showError(errorKey);
          return;
        }

        // Проверяем номер ТП (2 символа: цифры и заглавные буквы)
        if (!/^[\dА-ЯA-Z]{0,2}$/.test(numberTP)) {
          showError(errorKey);
          return;
        }

        // Проверяем номер фидера 0,4кВ (2 символа: цифры и заглавные буквы)
        if (!/^[\dА-ЯA-Z]{0,2}$/.test(numberFeeder04)) {
          showError(errorKey);
          return;
        }

        // Проверяем код потребителя (3 цифры)
        if (!/^\d{0,3}$/.test(codeConsumer3x)) {
          showError(errorKey);
          return;
        }

        clearError(errorKey);
      } else {
        // Проверяем первые 3 символа (код ПС) если они введены
        const cleanValue = value.replace(/-/g, "");
        if (cleanValue.length >= 3) {
          const firstThree = cleanValue.substring(0, 3);
          const validPS = SubstationCode.some((ps) => ps.value === firstThree);
          if (!validPS) {
            // Автоматически удаляем неверный код ПС
            const correctedValue = cleanValue.substring(0, 2);
            const correctedFormatted = formatNetworkCode(correctedValue);

            const newPoints = [...networkPoints];
            newPoints[pointIndex] = {
              ...newPoints[pointIndex],
              networkCode: correctedFormatted,
            };
            setNetworkPoints(newPoints);
            onNetworkChange(newPoints);

            showError(errorKey);
            return;
          }
        }

        // Проверяем последнюю часть (код потребителя) - только цифры
        if (cleanValue.length > 10) {
          const lastPart = cleanValue.substring(10);
          if (!/^\d*$/.test(lastPart)) {
            showError(errorKey);
            return;
          }
        }

        clearError(errorKey);
      }
    }

    if (fieldName === "maxPower") {
      const digitsOnlyRegex = /^\d*$/;
      if (!digitsOnlyRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    if (fieldName !== "networkCode") {
      const newPoints = [...networkPoints];
      newPoints[pointIndex] = {
        ...newPoints[pointIndex],
        [fieldName]: value,
      };
      setNetworkPoints(newPoints);
      onNetworkChange(newPoints);
    }
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {networkPoints.map((code, index) => {
          return (
            <Box key={index} sx={{ mb: 1 }}>
              {/* Вывод номера точки учета */}
              <Box sx={{ mb: 1, fontWeight: "bold", fontSize: "16px" }}>Точка учета {index + 1}</Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  maxWidth: 210,
                }}
              >
                {/* Поле для ввода сетевого кода */}
                <Box>
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
                    sx={{ minWidth: 210, marginTop: 10 }}
                  />
                  <Box sx={{ marginTop: 10 }}>
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
          color={"success"}
        >
          Далее
        </Button>
      </Box>

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
