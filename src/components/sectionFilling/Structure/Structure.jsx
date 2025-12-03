import * as React from "react";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import ErrorAlert from "../../../ui/ErrorAlert";
import ApiService from "../../../services/api";

const Structure = ({
  onNext,
  onBack,
  currentStep,
  structureData = {},
  onStructureChange = () => {},
  pointsCount = 1,
  consumerData = {},
}) => {
  const [mpes, setMpes] = useState([]);
  const [rkesOptions, setRkesOptions] = useState({});
  const [muOptions, setMuOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Загрузка МПЭС */
  useEffect(() => {
    loadMpes();
  }, []);

  const loadMpes = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ApiService.getMpes();
      setMpes(data);
    } catch (err) {
      console.error("Error loading mpes:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /* Загрузка РКЭС по МПЭС */
  const loadRkesByMpes = async (mpesId) => {
    if (rkesOptions[mpesId]) return;
    try {
      const data = await ApiService.getRkesByMpes(mpesId);
      setRkesOptions((prev) => ({ ...prev, [mpesId]: data }));
    } catch (err) {
      console.error("Error loading rkes:", err);
      setError(err);
    }
  };

  /* Загрузка МУ по РКЭС */
  const loadMuByRkes = async (rkesId) => {
    if (muOptions[rkesId]) return;
    try {
      const data = await ApiService.getMasterUnitsByRkes(rkesId);
      setMuOptions((prev) => ({ ...prev, [rkesId]: data }));
    } catch (err) {
      console.error("Error loading master units:", err);
      setError(err);
    }
  };

  const [structurePoints, setStructurePoints] = React.useState(() => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push({
        s1: structureData[i]?.s1 || "",
        s2: structureData[i]?.s2 || "",
        s3: structureData[i]?.s3 || "",
      });
    }
    return points;
  });

  const handleChange = (pointIndex, key) => (event) => {
    const newPoints = [...structurePoints];
    const newValue = event.target.value;

    // Обновляем текущее значение
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [key]: newValue,
    };

    // Сбрасываем зависимые поля и загружаем данные
    if (key === "s1") {
      newPoints[pointIndex].s2 = "";
      newPoints[pointIndex].s3 = "";
      const selectedMpes = mpes.find((m) => m.name === newValue);
      if (selectedMpes) {
        loadRkesByMpes(selectedMpes.id);
      }
    } else if (key === "s2") {
      newPoints[pointIndex].s3 = "";
      const selectedMpes = mpes.find((m) => m.name === newPoints[pointIndex].s1);
      if (selectedMpes) {
        const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === newValue);
        if (selectedRkes) {
          loadMuByRkes(selectedRkes.id);
        }
      }
    }

    setStructurePoints(newPoints);
    onStructureChange(newPoints);
  };

  /* Применить ко всем строкам */
  const applyToAll = (sourceIndex, key) => {
    const sourceValue = structurePoints[sourceIndex][key];
    if (!sourceValue) return;

    const newPoints = structurePoints.map((point) => {
      const updatedPoint = { ...point, [key]: sourceValue };

      // Сбрасываем зависимые поля
      if (key === "s1") {
        updatedPoint.s2 = "";
        updatedPoint.s3 = "";
      } else if (key === "s2") {
        updatedPoint.s3 = "";
      }

      return updatedPoint;
    });
    setStructurePoints(newPoints);
    onStructureChange(newPoints);
  };

  const applyToNext = (sourceIndex, key) => {
    const sourceValue = structurePoints[sourceIndex][key];
    if (!sourceValue || sourceIndex >= structurePoints.length - 1) return;

    const newPoints = [...structurePoints];
    const updatedPoint = {
      ...newPoints[sourceIndex + 1],
      [key]: sourceValue,
    };

    // Сбрасываем зависимые поля
    if (key === "s1") {
      updatedPoint.s2 = "";
      updatedPoint.s3 = "";
    } else if (key === "s2") {
      updatedPoint.s3 = "";
    }

    newPoints[sourceIndex + 1] = updatedPoint;
    setStructurePoints(newPoints);
    onStructureChange(newPoints);
  };

  // Получение опций для каждого уровня
  const getOptionsForLevel = (pointIndex, level) => {
    const point = structurePoints[pointIndex];

    if (level === "s1") {
      return mpes.map((m) => m.name);
    }

    if (level === "s2") {
      const selectedMpes = mpes.find((m) => m.name === point.s1);
      if (!selectedMpes || !rkesOptions[selectedMpes.id]) return [];
      return rkesOptions[selectedMpes.id].map((r) => r.name);
    }

    if (level === "s3") {
      const selectedMpes = mpes.find((m) => m.name === point.s1);
      if (!selectedMpes) return [];
      const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === point.s2);
      if (!selectedRkes || !muOptions[selectedRkes.id]) return [];
      return muOptions[selectedRkes.id].map((mu) => mu.name);
    }

    return [];
  };

  const allFilled =
    structurePoints && structurePoints.length > 0 && structurePoints.every((point) => point.s1 && point.s2 && point.s3);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error && <ErrorAlert error={error} onRetry={loadMpes} title="Ошибка загрузки данных из базы" />}
      {(structurePoints &&
        structurePoints.map((point, index) => (
          /* Контейнер для отдельной точки учета - визуальное выделение*/
          <Box key={index} sx={{ mb: 1, border: "2px solid black", borderRadius: 2, p: 2 }}>
            {/* Контейнер обеспечивает структурированное размещение заголовка и трех полей выбора в четкой сетке */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "150px repeat(3, minmax(240px, 1fr))",
                gap: 2,
                alignItems: "start",
              }}
            >
              {/* Контейнер  для заголовка */}
              <Box
                sx={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  mt: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {consumerData[index]?.consumerName || "Точка учета"}
              </Box>
              {/* МПЭС */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`s1-${index}`}
                  label="МПЭС"
                  options={getOptionsForLevel(index, "s1")}
                  value={point.s1}
                  onChange={handleChange(index, "s1")}
                  helperText="Обязательное поле"
                  sx={{ flex: 1 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.s1}
                  onApplyToAll={() => applyToAll(index, "s1")}
                  onApplyToNext={() => applyToNext(index, "s1")}
                  totalPoints={structurePoints.length}
                />
              </Box>

              {/* РКЭС */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`s2-${index}`}
                  label="РКЭС"
                  options={getOptionsForLevel(index, "s2")}
                  value={point.s2}
                  onChange={handleChange(index, "s2")}
                  helperText={!point.s1 ? "Сначала выберите МПЭС" : "Обязательное поле"}
                  disabled={!point.s1}
                  sx={{ flex: 1 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.s2}
                  onApplyToAll={() => applyToAll(index, "s2")}
                  onApplyToNext={() => applyToNext(index, "s2")}
                  totalPoints={structurePoints.length}
                />
              </Box>

              {/* Мастерский участок */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <EnSelect
                  id={`s3-${index}`}
                  label="Мастерский участок"
                  options={getOptionsForLevel(index, "s3")}
                  value={point.s3}
                  onChange={handleChange(index, "s3")}
                  helperText={!point.s1 || !point.s2 ? "Сначала выберите МПЭС и РКЭС" : "Обязательное поле"}
                  disabled={!point.s1 || !point.s2}
                  sx={{ flex: 1 }}
                />
                <CopyButtons
                  pointsCount={pointsCount}
                  index={index}
                  fieldValue={point.s3}
                  onApplyToAll={() => applyToAll(index, "s3")}
                  onApplyToNext={() => applyToNext(index, "s3")}
                  totalPoints={structurePoints.length}
                />
              </Box>
            </Box>
          </Box>
        ))) ||
        null}

      {/* Кнопки навигации вне обводки */}
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

export default Structure;
