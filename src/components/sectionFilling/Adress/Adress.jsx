import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import AddNewElement from "../../../ui/Buttons/AddNewElement";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

const Adress = ({
  onNext,
  onBack,
  currentStep,
  // Пропсы для сохранения состояния
  addressData = [],
  onAddressChange = () => {},
  pointsCount = 1, // Количество точек учета
  consumerData = {},
}) => {
  const { user } = useAuth();
  const [settl, setSettl] = useState([]);
  const [str, setStr] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ApiService.getSettlements();
      setSettl(data);
    } catch (err) {
      console.error("Error loading settl:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /* Загрузка улиц по населенным пунктам */
  const loadStreetsBySettlements = async (settlementId) => {
    if (str[settlementId]) return;
    try {
      const data = await ApiService.getStreetsBySettlement(settlementId);
      setStr((prev) => ({ ...prev, [settlementId]: data }));
    } catch (err) {
      console.error("Error loading streets:", err);
      setError(err);
    }
  };

  // Функция для создания нового населенного пункта
  const createNewSettlement = async (name) => {
    try {
      const newSettlement = await ApiService.createSettlement({ name, userId: user?.id });
      setSettl((prev) => [...prev, newSettlement]);

      return newSettlement;
    } catch (err) {
      if (err.message.includes("409")) {
        throw new Error("Населенный пункт уже существует");
      }
      console.error("Error creating settlement:", err);
      setError(err);
      throw err;
    }
  };

  // Функция для создания новой улицы
  const createNewStreet = async (name, settlementName) => {
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement) return null;

    try {
      const newStreet = await ApiService.createStreet({ name, settlement_id: selectedSettlement.id, userId: user?.id });
      setStr((prev) => ({
        ...prev,
        [selectedSettlement.id]: [...(prev[selectedSettlement.id] || []), newStreet],
      }));

      return newStreet;
    } catch (err) {
      if (err.message.includes("409")) {
        throw new Error("Улица уже существует в этом населенном пункте");
      }
      console.error("Error creating street:", err);
      setError(err);
      throw err;
    }
  };

  // Используем данные напрямую из addressData без локального состояния
  const addressPoints = React.useMemo(() => {
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
  }, [addressData, pointsCount]);

  // Загружаем улицы при восстановлении данных
  useEffect(() => {
    addressPoints.forEach((point) => {
      if (point.settlement) {
        const selectedSettlement = settl.find((s) => s.name === point.settlement);
        if (selectedSettlement) {
          loadStreetsBySettlements(selectedSettlement.id);
        }
      }
    });
  }, [addressPoints, settl]);

  // Состояние для множественных точек учета
  const {
    errors: validationErrors,
    showError,
    clearError,
    validateField: validateFieldWithError,
  } = useValidationErrors();

  /* Обработчик изменения поля для конкретной точки учета */
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const errorKey = `${fieldName}-${pointIndex}`;

    // Валидация полей
    if (fieldName === "apartment" || fieldName === "house") {
      if (!validateFieldWithError(value, validators.digits, errorKey)) return;
    }

    if (fieldName === "building") {
      if (!validateFieldWithError(value, validators.uppercaseLetters, errorKey)) return;
    }

    const newPoints = [...addressPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };

    // Если изменяется населенный пункт, сбрасываем улицу и загружаем улицы
    if (fieldName === "settlement") {
      newPoints[pointIndex].street = "";
      const selectedSettlement = settl.find((s) => s.name === value);
      if (selectedSettlement) {
        loadStreetsBySettlements(selectedSettlement.id);
      }
    }

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

    onAddressChange(newPoints);
  };

  // Функция для получения улиц по выбранному населенному пункту
  const getStreetsForSettlement = (settlementName) => {
    if (!settlementName) return [];

    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement || !str[selectedSettlement.id]) return [];

    return str[selectedSettlement.id].map((street) => street.name);
  };

  // Проверка заполненности обязательных полей для всех точек
  const allFilled = addressPoints.every((point) => point.settlement && point.street);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <ErrorAlert error={error} onRetry={loadSettlements} title="Ошибка загрузки данных из базы" />}
      {addressPoints.map((point, index) => {
        // Удаляем неиспользуемую переменную availableStreets
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
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`settlement-${index}`}
                  label="Населенный пункт"
                  options={settl.map((s) => s.name)}
                  value={point.settlement}
                  onChange={(e) => handleFieldChange(index, "settlement", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  searchable={true}
                  sx={{ width: 260 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                  <AddNewElement
                    onAdd={createNewSettlement}
                    title="Добавить населенный пункт"
                    label="Название населенного пункта"
                    placeholder="например: г. Москва"
                    validateSettlement={true}
                    existingItems={settl}
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
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`street-${index}`}
                  label="Улица"
                  options={getStreetsForSettlement(point.settlement)}
                  value={point.street}
                  onChange={(e) => handleFieldChange(index, "street", e.target.value)}
                  required={true}
                  searchable={true}
                  helperText={!point.settlement ? "Сначала выберите населенный пункт" : "Обязательное поле"}
                  disabled={!point.settlement}
                  sx={{ width: 190 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                  <AddNewElement
                    onAdd={(name) => createNewStreet(name, point.settlement)}
                    title="Добавить улицу"
                    label="Название улицы"
                    placeholder="например: ул. Ленина"
                    validateStreet={true}
                    disabled={!point.settlement}
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
          onClick={() => typeof onNext === "function" && onNext()}
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
