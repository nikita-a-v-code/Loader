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
  const [networkPoints, setNetworkPoints] = React.useState(() => {
    const code = [];
    for (let i = 0; i < pointsCount; i++) {
      code.push({
        codePS: networkData[i]?.codePS || "",
        numberFeeder10: networkData[i]?.numberFeeder10 || "",
        numberTP: networkData[i]?.numberTP || "",
        numberFeeder04: networkData[i]?.numberFeeder04 || "",
        codeConsumer3x: networkData[i]?.codeConsumer3x || "",
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

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    /* Валидация полей */

    if (fieldName === "numberFeeder10" || fieldName === "codeConsumer3x") {
      const threeDigitsRegex = /^\d{0,3}$/;
      if (!threeDigitsRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
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

    if (fieldName === "numberFeeder04" || fieldName === "numberTP") {
      const twoCharsRegex = /^[\dА-ЯA-Z]{0,2}$/;
      if (!twoCharsRegex.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

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
                {/* Поле для выбора кода подстанции */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <EnSelect
                    id={`codePS-${index}`}
                    label={"Код ПС ((220)110/35-10(6)кВ"}
                    options={SubstationCode}
                    value={code.codePS}
                    onChange={(e) => handleFieldChange(index, "codePS", e.target.value)}
                    required={false}
                    helperText="Обязательное поле"
                    size="small"
                    sx={{ minWidth: 210 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.codePS}
                    onApplyToAll={() => applyToAll(index, "codePS")}
                    onApplyToNext={() => applyToNext(index, "codePS")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
                </Box>

                {/* Поле для ввода номера фидера 10(6)(3) */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <EnSelect
                    id={`numberFeeder10-${index}`}
                    label="Номер фидера 10(6)(3) кВ"
                    value={code.numberFeeder10}
                    onChange={(e) => handleFieldChange(index, "numberFeeder10", e.target.value)}
                    freeInput={true}
                    required={false}
                    error={validationErrors[`numberFeeder10-${index}`]}
                    helperText={validationErrors[`numberFeeder10-${index}`] ? "Только 3 цифры" : "Обязательное поле"}
                    size="small"
                    sx={{ minWidth: 210 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.numberFeeder10}
                    onApplyToAll={() => applyToAll(index, "numberFeeder10")}
                    onApplyToNext={() => applyToNext(index, "numberFeeder10")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
                </Box>

                {/* Поле для ввода номера ТП 10(6)/0,4 */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <EnSelect
                    id={`numberTP-${index}`}
                    label="Номер ТП 10(6)/0,4 кВ"
                    value={code.numberTP}
                    onChange={(e) => handleFieldChange(index, "numberTP", e.target.value)}
                    freeInput={true}
                    required={false}
                    error={validationErrors[`numberTP-${index}`]}
                    helperText={
                      validationErrors[`numberTP-${index}`] ? "Цифры и заглавные буквы, 2 символа" : "Обязательное поле"
                    }
                    size="small"
                    sx={{ minWidth: 210 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.numberTP}
                    onApplyToAll={() => applyToAll(index, "numberTP")}
                    onApplyToNext={() => applyToNext(index, "numberTP")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
                </Box>

                {/* Поле для ввода номера фидера 0,4 кВ */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <EnSelect
                    id={`numberFeeder04-${index}`}
                    label="Номер фидера 0,4 кВ"
                    value={code.numberFeeder04}
                    onChange={(e) => handleFieldChange(index, "numberFeeder04", e.target.value)}
                    freeInput={true}
                    required={false}
                    error={validationErrors[`numberFeeder04-${index}`]}
                    helperText={
                      validationErrors[`numberFeeder04-${index}`]
                        ? "Цифры и заглавные буквы, 2 символа"
                        : "Обязательное поле"
                    }
                    size="small"
                    sx={{ minWidth: 210 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.numberFeeder04}
                    onApplyToAll={() => applyToAll(index, "numberFeeder04")}
                    onApplyToNext={() => applyToNext(index, "numberFeeder04")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
                </Box>

                {/* Поле для ввода кода потребителя */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <EnSelect
                    id={`codeConsumer3x-${index}`}
                    label="Код потребителя 3-х значный"
                    value={code.codeConsumer3x}
                    onChange={(e) => handleFieldChange(index, "codeConsumer3x", e.target.value)}
                    freeInput={true}
                    required={false}
                    error={validationErrors[`codeConsumer3x-${index}`]}
                    helperText={validationErrors[`codeConsumer3x-${index}`] ? "Только 3 цифры" : "Обязательное поле"}
                    size="small"
                    sx={{ minWidth: 210 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={code.codeConsumer3x}
                    onApplyToAll={() => applyToAll(index, "codeConsumer3x")}
                    onApplyToNext={() => applyToNext(index, "codeConsumer3x")}
                    totalPoints={networkPoints.length}
                    arrowDirection="right"
                  />
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

      <Box
        sx={{
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
  );
};

export default NetworkCode;
