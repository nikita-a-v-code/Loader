import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";
import { useSectionData } from "../../../hooks/useSectionData";

const Consumer = ({ onNext, onBack, currentStep, consumerData = {}, onConsumerChange = () => {}, pointsCount = 1 }) => {
  const [abonentTypes, setAbonentTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Используем кастомный хук для управления данными
  const {
    points: consumerPoints,
    handleFieldChange,
    applyToAll,
    applyToNext,
    checkAllFilled,
  } = useSectionData(consumerData, pointsCount, onConsumerChange, {
    consumerName: "",
    deliveryPoint: "",
    contractNumber: "",
    subscriberType: "",
    accountStatus: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusesData, abonentTypesData] = await Promise.all([
        ApiService.getStatuses(),
        ApiService.getAbonentTypes(),
      ]);

      setStatuses(statusesData);
      setAbonentTypes(abonentTypesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Проверка заполненности обязательных полей
  const allFilled = checkAllFilled(["subscriberType", "accountStatus", "consumerName"]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <ErrorAlert error={error} onRetry={loadData} title="Ошибка загрузки данных из базы" />}
      {consumerPoints.map((point, index) => (
        <Box key={index} sx={{ mb: 1, border: "2px solid black", borderRadius: 2, p: 2, width: "fit-content" }}>
          <Box sx={{ display: "flex", gap: 4, alignItems: "start", flexWrap: "wrap" }}>
            {/* Заголовок */}
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

            {/* Наименование потребителя */}
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

            {/* Точка поставки */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <EnSelect
                id={`deliveryPoint-${index}`}
                label="Наименование точки поставки"
                value={point.deliveryPoint}
                onChange={(e) => handleFieldChange(index, "deliveryPoint", e.target.value)}
                freeInput={true}
                sx={{ minWidth: 200, flex: 1 }}
              />
            </Box>

            {/* Номер договора */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <EnSelect
                id={`contractNumber-${index}`}
                label="Номер договора (лицевой счет)"
                value={point.contractNumber}
                onChange={(e) => handleFieldChange(index, "contractNumber", e.target.value)}
                freeInput={true}
                sx={{ minWidth: 200, flex: 1 }}
              />
            </Box>

            {/* Тип абонента */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <EnSelect
                id={`subscriberType-${index}`}
                label="Тип абонента"
                options={abonentTypes.map((item) => item.name)}
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

            {/* Статус счета */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <EnSelect
                id={`accountStatus-${index}`}
                label="Статус счета"
                options={statuses.map((item) => item.name)}
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
      ))}

      {/* Кнопки навигации */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
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

export default Consumer;
