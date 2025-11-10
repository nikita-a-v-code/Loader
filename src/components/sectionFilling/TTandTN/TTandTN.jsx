import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";

const TTandTN = ({
  onNext,
  onBack,
  currentStep,
  transformData = {},
  onTransformChange = () => {},
  pointsCount = 1,
  consumerData = {},
}) => {
  const { errors: validationErrors, showError, clearError } = useValidationErrors();

  // Проверка заполненности всех обязательных полей (Коэффициент трансформации ТТ и Коэффициент трансформации ТН)
  const allFilled = () => {
    return transformPoints.every((point) => point.ttCoeff && point.tnCoeff);
  };

  const [transformPoints, setTransformPoints] = React.useState(() => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        /* Данные ТТ */
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
        /* Данные ТН */
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
      });
    }
    return points;
  });

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    // Валидация для серийных номеров - только цифры
    if (fieldName.includes("Serial")) {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    // Валидация для межповерочного интервала - только цифры до 2 символов
    if (fieldName.includes("Interval")) {
      if (!/^\d{0,2}$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    // Валидация для коэффициентов - только цифры
    if (fieldName.includes("Coeff")) {
      if (!/^\d*$/.test(value)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    // Валидация для дат
    if (fieldName.includes("Date")) {
      if (!/^[\d.]*$/.test(value)) {
        showError(errorKey);
        return;
      }

      const currentValue = transformPoints[pointIndex][fieldName] || "";
      if (value.length >= currentValue.length) {
        let formattedValue = value.replace(/\D/g, "");
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

    const newPoints = [...transformPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };
    setTransformPoints(newPoints);
    onTransformChange(newPoints);
  };

  return (
    /* Главный контейнер - организует вертикальную структуру. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Контейнер однотипных полей - располагает однотипные поля горизонтально в ряд */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
        {transformPoints.map((point, index) => (
          /* Контейнер для отдельной точки учета - визуальное выделение*/
          <Box key={index} sx={{ mb: 2, border: "3px solid black", borderRadius: 2, p: 2, width: "100%" }}>
            {/* Контейнер общий для заголовка и кнопок*/}
            <Box sx={{ mb: 2, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              {/* Контейнер  для заголовка */}
              <Box sx={{ fontWeight: "bold", fontSize: "18px" }}>
                {consumerData[index]?.consumerName || "Точка учета"}
              </Box>
              {index === 0 && (
                /* Контейнер для кнопок*/
                <Box sx={{ display: "flex", gap: 1, position: "absolute", right: 0 }}>
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
              )}
            </Box>

            {/* Контейнер  для структуры: ТТ, разделительная линия, ТН */}
            <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
              {/* Контейнер для секции ТТ */}
              <Box sx={{ flex: 1, minWidth: 400 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main", fontWeight: "bold" }}>
                  Трансформатор тока (ТТ)
                </Typography>

                {/* Контейнер для полей ТТ */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {/* Поле для ввода типа ТТ */}
                  <EnSelect
                    id={`ttType-${index}`}
                    label="Тип ТТ"
                    value={point.ttType}
                    onChange={(e) => handleFieldChange(index, "ttType", e.target.value)}
                    freeInput={true}
                    size="small"
                    sx={{ gridColumn: "1 / -1" }}
                  />

                  {/* Поле для ввода серийного номера ТТ */}
                  {["A", "B", "C"].map((phase) => (
                    <EnSelect
                      key={phase}
                      id={`ttSerial${phase}-${index}`}
                      label={`Заводской номер ТТ "${phase}"`}
                      value={point[`ttSerial${phase}`]}
                      onChange={(e) => handleFieldChange(index, `ttSerial${phase}`, e.target.value)}
                      freeInput={true}
                      error={validationErrors[`ttSerial${phase}-${index}`]}
                      helperText={validationErrors[`ttSerial${phase}-${index}`] ? "Только цифры" : ""}
                      size="small"
                    />
                  ))}

                  {/* Общий контейнер для ввода даты поверки и интервала ТТ */}
                  {["A", "B", "C"].map((phase) => (
                    <Box key={phase} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <EnSelect
                        id={`ttDate${phase}-${index}`}
                        label={`Дата поверки ТТ "${phase}"`}
                        value={point[`ttDate${phase}`]}
                        onChange={(e) => handleFieldChange(index, `ttDate${phase}`, e.target.value)}
                        freeInput={true}
                        error={validationErrors[`ttDate${phase}-${index}`]}
                        helperText={validationErrors[`ttDate${phase}-${index}`] ? "Формат ДД.ММ.ГГГГ" : ""}
                        size="small"
                        sx={{ minWidth: 140 }}
                      />
                      <EnSelect
                        id={`ttInterval${phase}-${index}`}
                        label="Межповерочный интервал, лет"
                        value={point[`ttInterval${phase}`]}
                        onChange={(e) => handleFieldChange(index, `ttInterval${phase}`, e.target.value)}
                        freeInput={true}
                        error={validationErrors[`ttInterval${phase}-${index}`]}
                        helperText={validationErrors[`ttInterval${phase}-${index}`] ? "Только цифры" : ""}
                        size="small"
                        sx={{ minWidth: 100 }}
                      />
                    </Box>
                  ))}

                  {/* Поле для ввода коэффициента трансформации ТТ */}
                  <EnSelect
                    id={`ttCoeff-${index}`}
                    label="Коэффициент трансформации ТТ"
                    value={point.ttCoeff}
                    onChange={(e) => handleFieldChange(index, "ttCoeff", e.target.value)}
                    freeInput={true}
                    required={true}
                    error={validationErrors[`ttCoeff-${index}`]}
                    helperText={validationErrors[`ttCoeff-${index}`] ? "Только цифры" : "Обязательное поле"}
                    size="small"
                  />

                  {/* Поле для ввода номера пломб ТТ */}
                  {["A", "B", "C"].map((phase) => (
                    <EnSelect
                      key={phase}
                      id={`ttSeal${phase}-${index}`}
                      label={`№ пломбы ТТ "${phase}"`}
                      value={point[`ttSeal${phase}`]}
                      onChange={(e) => handleFieldChange(index, `ttSeal${phase}`, e.target.value)}
                      freeInput={true}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              {/* Разделительная линия */}
              <Box sx={{ width: "3px", backgroundColor: "black", alignSelf: "stretch" }}></Box>

              {/* Контейнер для секции ТН  */}
              <Box sx={{ flex: 1, minWidth: 400 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "secondary.main", fontWeight: "bold" }}>
                  Трансформатор напряжения (ТН)
                </Typography>

                {/* Контейнер для полей ТН */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {/* Поле для ввода типа ТН */}
                  <EnSelect
                    id={`tnType-${index}`}
                    label="Тип ТН"
                    value={point.tnType}
                    onChange={(e) => handleFieldChange(index, "tnType", e.target.value)}
                    freeInput={true}
                    size="small"
                    sx={{ gridColumn: "1 / -1" }}
                  />

                  {/* Поле для ввода серийного номера ТН */}
                  {["A", "B", "C"].map((phase) => (
                    <EnSelect
                      key={phase}
                      id={`tnSerial${phase}-${index}`}
                      label={`Заводской номер ТН "${phase}"`}
                      value={point[`tnSerial${phase}`]}
                      onChange={(e) => handleFieldChange(index, `tnSerial${phase}`, e.target.value)}
                      freeInput={true}
                      error={validationErrors[`tnSerial${phase}-${index}`]}
                      helperText={validationErrors[`tnSerial${phase}-${index}`] ? "Только цифры" : ""}
                      size="small"
                    />
                  ))}

                  {/* Общий контейнер для ввода даты поверки и интервала ТН */}
                  {["A", "B", "C"].map((phase) => (
                    <Box key={phase} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <EnSelect
                        id={`tnDate${phase}-${index}`}
                        label={`Дата поверки ТН "${phase}"`}
                        value={point[`tnDate${phase}`]}
                        onChange={(e) => handleFieldChange(index, `tnDate${phase}`, e.target.value)}
                        freeInput={true}
                        error={validationErrors[`tnDate${phase}-${index}`]}
                        helperText={validationErrors[`tnDate${phase}-${index}`] ? "Формат ДД.ММ.ГГГГ" : ""}
                        size="small"
                        sx={{ minWidth: 140 }}
                      />
                      <EnSelect
                        id={`tnInterval${phase}-${index}`}
                        label="Межповерочный интервал, лет"
                        value={point[`tnInterval${phase}`]}
                        onChange={(e) => handleFieldChange(index, `tnInterval${phase}`, e.target.value)}
                        freeInput={true}
                        error={validationErrors[`tnInterval${phase}-${index}`]}
                        helperText={validationErrors[`tnInterval${phase}-${index}`] ? "Только цифры" : ""}
                        size="small"
                        sx={{ minWidth: 100 }}
                      />
                    </Box>
                  ))}

                  {/* Поле для ввода коэффициента трансформации ТН */}
                  <EnSelect
                    id={`tnCoeff-${index}`}
                    label="Коэффициент трансформации ТН"
                    value={point.tnCoeff}
                    onChange={(e) => handleFieldChange(index, "tnCoeff", e.target.value)}
                    freeInput={true}
                    required={true}
                    error={validationErrors[`tnCoeff-${index}`]}
                    helperText={validationErrors[`tnCoeff-${index}`] ? "Только цифры" : "Обязательное поле"}
                    size="small"
                  />

                  {/* Поле для ввода номера пломб ТН */}
                  {["A", "B", "C"].map((phase) => (
                    <EnSelect
                      key={phase}
                      id={`tnSeal${phase}-${index}`}
                      label={`№ пломбы ТН "${phase}"`}
                      value={point[`tnSeal${phase}`]}
                      onChange={(e) => handleFieldChange(index, `tnSeal${phase}`, e.target.value)}
                      freeInput={true}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TTandTN;
