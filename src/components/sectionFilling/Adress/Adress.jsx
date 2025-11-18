import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import AddNewElement from "../../../ui/Buttons/AddNewElement";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators, useValidationErrors, validateField } from "../../../utils/Validation/Validation";
import ErrorAlert from "../../../ui/ErrorAlert";

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

      const res = await fetch("http://localhost:3001/api/settlements");
      if (!res.ok) {
        throw new Error(`Ошибка загрузки населенных пунктов: ${res.status}`);
      }

      const data = await res.json();
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
      const res = await fetch(`http://localhost:3001/api/streets/by-settlement/${settlementId}`);
      if (!res.ok) {
        throw new Error(`Ошибка загрузки населенных пунктов: ${res.status}`);
      }
      const data = await res.json();
      setStr((prev) => ({ ...prev, [settlementId]: data }));
    } catch (err) {
      console.error("Error loading streets:", err);
      setError(err);
    }
  };

  // Функция для создания нового населенного пункта
  const createNewSettlement = async (name) => {
    try {
      const res = await fetch("http://localhost:3001/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.status === 409) {
        alert("Населенный пункт уже существует");
        return null;
      }

      if (!res.ok) throw new Error("Ошибка создания населенного пункта");

      const newSettlement = await res.json();
      setSettl((prev) => [...prev, newSettlement]);
      return newSettlement;
    } catch (err) {
      console.error("Error creating settlement:", err);
      alert("Ошибка при создании населенного пункта");
      return null;
    }
  };

  // Функция для создания новой улицы
  const createNewStreet = async (name, settlementName) => {
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement) return null;

    try {
      const res = await fetch("http://localhost:3001/api/streets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, settlement_id: selectedSettlement.id }),
      });

      if (res.status === 409) {
        alert("Улица уже существует в этом населенном пункте");
        return null;
      }

      if (!res.ok) throw new Error("Ошибка создания улицы");

      const newStreet = await res.json();
      setStr((prev) => ({
        ...prev,
        [selectedSettlement.id]: [...(prev[selectedSettlement.id] || []), newStreet],
      }));
      return newStreet;
    } catch (err) {
      console.error("Error creating street:", err);
      alert("Ошибка при создании улицы");
      return null;
    }
  };

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

    // Если изменяется населенный пункт, сбрасываем улицу и загружаем улицы
    if (fieldName === "settlement") {
      newPoints[pointIndex].street = "";
      const selectedSettlement = settl.find((s) => s.name === value);
      if (selectedSettlement) {
        loadStreetsBySettlements(selectedSettlement.id);
      }
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
