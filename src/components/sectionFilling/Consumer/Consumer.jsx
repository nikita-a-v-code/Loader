import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import ErrorAlert from "../../../ui/ErrorAlert";

const Consumer = ({ onNext, onBack, currentStep, consumerData = {}, onConsumerChange = () => {}, pointsCount = 1 }) => {
  const [abonentTypes, setAbonentTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Загрузка данных из API */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [abonentTypesRes, statusesRes] = await Promise.all([
        fetch("http://localhost:3001/api/abonent-types"),
        fetch("http://localhost:3001/api/statuses"),
      ]);

      if (!abonentTypesRes.ok) {
        throw new Error(`Ошибка загрузки типов абонентов: ${abonentTypesRes.status}`);
      }
      if (!statusesRes.ok) {
        throw new Error(`Ошибка загрузки статусов: ${statusesRes.status}`);
      }

      const [abonentTypesData, statusesData] = await Promise.all([abonentTypesRes.json(), statusesRes.json()]);

      setAbonentTypes(abonentTypesData.map((item) => item.name));
      setStatuses(statusesData.map((item) => item.name));
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const [consumerPoints, setConsumerPoints] = React.useState(() => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        consumerName: consumerData[i]?.consumerName || "",
        deliveryPoint: consumerData[i]?.deliveryPoint || "",
        contractNumber: consumerData[i]?.contractNumber || "",
        subscriberType: consumerData[i]?.subscriberType || "",
        accountStatus: consumerData[i]?.accountStatus || "",
      });
    }
    return points;
  });

  // Сохранение данных потребителей в родительский компонент
  const updateConsumerData = () => {
    onConsumerChange(consumerPoints);
  };

  // Обработчик изменения значения поля для конкретной точки потребителя
  const handleFieldChange = (pointIndex, fieldName, value) => {
    const newPoints = [...consumerPoints];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };
    setConsumerPoints(newPoints);
    onConsumerChange(newPoints);
  };

  // Применение значения поля ко всем точкам потребителей (синяя кнопка)
  const applyToAll = (sourceIndex, fieldName) => {
    const sourceValue = consumerPoints[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = consumerPoints.map((point) => ({
      ...point,
      [fieldName]: sourceValue,
    }));
    setConsumerPoints(newPoints);
    onConsumerChange(newPoints);
  };

  // Копирование значения поля в следующую строку (зеленая кнопка)
  const applyToNext = (sourceIndex, fieldName) => {
    const sourceValue = consumerPoints[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= consumerPoints.length - 1) return;

    const newPoints = [...consumerPoints];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };
    setConsumerPoints(newPoints);
    onConsumerChange(newPoints);
  };

  // Проверка заполненности всех обязательных полей (тип абонента и статус счета)
  const allFilled = consumerPoints.every((point) => point.subscriberType && point.accountStatus && point.consumerName);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <ErrorAlert error={error} onRetry={loadData} title="Ошибка загрузки данных из базы" />}
      {consumerPoints.map((point, index) => {
        return (
          /* Контейнер для отдельной точки учета - визуальное выделение*/
          <Box key={index} sx={{ mb: 1, border: "2px solid black", borderRadius: 2, p: 2, width: "fit-content" }}>
            {/* Контейнер, организующий горизонтальное размещение всех элементов внутри точки учета */}
            <Box
              sx={{
                display: "flex",
                gap: 4,
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
                  minWidth: 200,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {point.consumerName || "Точка учета"}
              </Box>

              {/* Поле для ввода наименования потребителя */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`consumerName-${index}`}
                  label="Наименование потребителя"
                  value={point.consumerName}
                  onChange={(e) => handleFieldChange(index, "consumerName", e.target.value)}
                  freeInput={true}
                  required={true}
                  helperText="Обязательное поле"
                  sx={{ minWidth: 200, flex: 1 }}
                />
              </Box>

              {/* Поле для ввода наименования точки поставки */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`deliveryPoint-${index}`}
                  label="Наименование точки поставки"
                  value={point.deliveryPoint}
                  onChange={(e) => handleFieldChange(index, "deliveryPoint", e.target.value)}
                  freeInput={true}
                  required={false}
                  sx={{ minWidth: 200, flex: 1 }}
                />
              </Box>

              {/* Поле для ввода номера договора (лицевого счета) */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`contractNumber-${index}`}
                  label="Номер договора (лицевой счет)"
                  value={point.contractNumber}
                  onChange={(e) => handleFieldChange(index, "contractNumber", e.target.value)}
                  freeInput={true}
                  required={false}
                  sx={{ minWidth: 200, flex: 1 }}
                />
              </Box>

              {/* Поле для выбора типа абонента */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`subscriberType-${index}`}
                  label="Тип абонента"
                  options={abonentTypes}
                  value={point.subscriberType}
                  onChange={(e) => handleFieldChange(index, "subscriberType", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  sx={{ minWidth: 200, flex: 1 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.subscriberType}
                  onApplyToAll={() => applyToAll(index, "subscriberType")}
                  onApplyToNext={() => applyToNext(index, "subscriberType")}
                  totalPoints={consumerPoints.length}
                />
              </Box>

              {/* Поле для выбора статуса счета */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <EnSelect
                  id={`accountStatus-${index}`}
                  label="Статус счета"
                  options={statuses}
                  value={point.accountStatus}
                  onChange={(e) => handleFieldChange(index, "accountStatus", e.target.value)}
                  required={true}
                  helperText="Обязательное поле"
                  sx={{ minWidth: 200, flex: 1 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.accountStatus}
                  onApplyToAll={() => applyToAll(index, "accountStatus")}
                  onApplyToNext={() => applyToNext(index, "accountStatus")}
                  totalPoints={consumerPoints.length}
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
            updateConsumerData(); // Сохраняем данные перед переходом
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

export default Consumer;
