import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { ADRESSNAME } from "../../../data/dataBase";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";

const Adress = ({
  onNext,
  onBack,
  currentStep,
  // Пропсы для сохранения состояния
  addressData = {},
  onAddressChange = () => {},
  pointsCount = 1, // Количество точек учета
  consumerData = {},
}) => {
  // Состояние для множественных точек учета
  const { errors: validationErrors, showError, clearError } = useValidationErrors();
  const [addressPoints, setAddressPoints] = React.useState(() => {
    // Инициализируем массив для каждой точки учета
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        settlement: addressData[i]?.settlement || "",
        microdistrict: addressData[i]?.microdistrict || "",
        street: addressData[i]?.street || "",
        house: addressData[i]?.house || "",
        building: addressData[i]?.building || "",
        apartment: addressData[i]?.apartment || "",
      });
    }
    return points;
  });

  // Обновление данных в родительском компоненте
  const updateAddressData = () => {
    onAddressChange(addressPoints);
  };

  // Обработчик изменения поля для конкретной точки учета
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    /* Валидация полей */
    if (fieldName === "apartment" || fieldName === "house") {
      if (!validateField(value, validators.digits)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    if (fieldName === "building") {
      if (!validateField(value, validators.uppercaseLetters)) {
        showError(errorKey);
        return;
      } else {
        clearError(errorKey);
      }
    }

    const newPoints = [...addressPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };

    // Если изменяется населенный пункт, сбрасываем улицу
    if (fieldName === "settlement") {
      newPoints[pointIndex].street = "";
    }

    setAddressPoints(newPoints);
    onAddressChange(newPoints);
  };

  const applyToAll = (sourceIndex, fieldName) => {
    const sourceValue = addressPoints[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = addressPoints.map((point) => {
      const updatedPoint = { ...point, [fieldName]: sourceValue };
      // Если копируем населенный пункт, сбрасываем улицу для всех точек
      if (fieldName === "settlement") {
        updatedPoint.street = "";
      }
      return updatedPoint;
    });
    setAddressPoints(newPoints);
    onAddressChange(newPoints);
  };

  const applyToNext = (sourceIndex, fieldName) => {
    const sourceValue = addressPoints[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= addressPoints.length - 1) return;

    const newPoints = [...addressPoints];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };

    // Если копируем населенный пункт, сбрасываем улицу в следующей строке
    if (fieldName === "settlement") {
      newPoints[sourceIndex + 1].street = "";
    }

    setAddressPoints(newPoints);
    onAddressChange(newPoints);
  };

  // Преобразование ключей ADRESSNAME в формат для селекта населенных пунктов
  const settlements = Object.keys(ADRESSNAME).map((name) => ({
    value: name,
    label: name,
  }));

  // Проверка заполненности обязательных полей для всех точек
  const allFilled = addressPoints.every((point) => point.settlement && point.street);

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {addressPoints.map((point, index) => {
        const availableStreets = point.settlement
          ? (ADRESSNAME[point.settlement] || []).map((street) => ({
              value: street,
              label: street,
            }))
          : [];

        return (
          /* Контейнер для отдельной точки учета - визуальное выделение*/
          <Box key={index} sx={{ mb: 1, border: "2px solid black", borderRadius: 2, p: 2 }}>
            {/* Контейнер, организующий горизонтальное размещение всех элементов внутри точки учета */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "start",
                flexWrap: "wrap",
              }}
            >
              {/* Контейнер  для заголовка */}
              <Box
                sx={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  mt: 2,
                  minWidth: 170,
                  maxWidth: 170,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {consumerData[index]?.consumerName || "Точка учета"}
              </Box>

              {/* Поле для выбора населенного пункта */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`settlement-${index}`}
                  label="Населенный пункт"
                  options={settlements}
                  value={point.settlement}
                  onChange={(e) => {
                    const value = typeof e.target.value === "object" ? e.target.value.value : e.target.value;
                    handleFieldChange(index, "settlement", value);
                  }}
                  required={true}
                  helperText="Обязательное поле"
                  searchable={true}
                  sx={{ width: 300 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.settlement}
                  onApplyToAll={() => applyToAll(index, "settlement")}
                  onApplyToNext={() => applyToNext(index, "settlement")}
                  totalPoints={addressPoints.length}
                />
              </Box>

              {/* Поле для ввода микрорайона/квартала */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`microdistrict-${index}`}
                  label="Микрорайон/Квартал"
                  value={point.microdistrict}
                  onChange={(e) => handleFieldChange(index, "microdistrict", e.target.value)}
                  freeInput={true}
                  required={false}
                  sx={{ width: 250 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.microdistrict}
                  onApplyToAll={() => applyToAll(index, "microdistrict")}
                  onApplyToNext={() => applyToNext(index, "microdistrict")}
                  totalPoints={addressPoints.length}
                />
              </Box>

              {/* Поле для выбора улицы в зависимости от выбранного населенного пункта */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`street-${index}`}
                  label="Улица"
                  options={availableStreets}
                  value={point.street}
                  onChange={(e) => handleFieldChange(index, "street", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  sx={{ width: 230 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.street}
                  onApplyToAll={() => applyToAll(index, "street")}
                  onApplyToNext={() => applyToNext(index, "street")}
                  totalPoints={addressPoints.length}
                />
              </Box>

              {/* Поле для ввода номера дома */}
              <Box sx={{ width: 120 }}>
                <EnSelect
                  id={`house-${index}`}
                  label="Дом"
                  value={point.house}
                  onChange={(e) => handleFieldChange(index, "house", e.target.value)}
                  freeInput={true}
                  required={false}
                  error={validationErrors[`house-${index}`]}
                  helperText={validationErrors[`house-${index}`] ? validators.digits.message : ""}
                  sx={{ width: 100 }}
                />
              </Box>

              {/* Поле для выбора корпуса (литеры) */}
              <Box sx={{ width: 120 }}>
                <EnSelect
                  id={`building-${index}`}
                  label="Корпус (литера)"
                  value={point.building}
                  onChange={(e) => handleFieldChange(index, "building", e.target.value)}
                  freeInput={true}
                  required={false}
                  error={validationErrors[`building-${index}`]}
                  helperText={validationErrors[`building-${index}`] ? validators.uppercaseLetters.message : ""}
                  sx={{ width: 100 }}
                />
              </Box>

              {/* Поле для ввода квартиры (офиса) */}
              <Box sx={{ width: 120 }}>
                <EnSelect
                  id={`apartment-${index}`}
                  label="Квартира (офис)"
                  value={point.apartment}
                  onChange={(e) => handleFieldChange(index, "apartment", e.target.value)}
                  freeInput={true}
                  required={false}
                  error={validationErrors[`apartment-${index}`]}
                  helperText={validationErrors[`apartment-${index}`] ? validators.digits.message : ""}
                  sx={{ width: 100 }}
                />
              </Box>
            </Box>
          </Box>
        );
      })}

      {/* Кнопки навигации вне обводки */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          mt: 1,
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
            updateAddressData(); // Сохраняем данные перед переходом
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

export default Adress;
