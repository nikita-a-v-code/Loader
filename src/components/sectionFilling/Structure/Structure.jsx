import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../ui/Buttons/CopyButtons";
import { nameStructures, MPES, organizationStructure } from "../../../data/dataBase";

const Structure = ({
  onNext,
  onBack,
  currentStep,
  structureData = {},
  onStructureChange = () => {},
  pointsCount = 1,
  consumerData = {},
}) => {
  const [structurePoints, setStructurePoints] = React.useState(() => {
    const points = [];
    for (let i = 0; i < pointsCount; i++) {
      const defaultValues = nameStructures.reduce((acc, cur) => ({ ...acc, [cur.key]: "" }), {});
      points.push({ ...defaultValues, ...structureData[i] });
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
    
    // Сбрасываем зависимые поля при изменении родительского
    if (key === 's1') {
      newPoints[pointIndex].s2 = '';
      newPoints[pointIndex].s3 = '';
    } else if (key === 's2') {
      newPoints[pointIndex].s3 = '';
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
      if (key === 's1') {
        updatedPoint.s2 = '';
        updatedPoint.s3 = '';
      } else if (key === 's2') {
        updatedPoint.s3 = '';
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
    if (key === 's1') {
      updatedPoint.s2 = '';
      updatedPoint.s3 = '';
    } else if (key === 's2') {
      updatedPoint.s3 = '';
    }
    
    newPoints[sourceIndex + 1] = updatedPoint;
    setStructurePoints(newPoints);
    onStructureChange(newPoints);
  };

  // Получение опций для каждого уровня на основе выбранных значений
  const getOptionsForLevel = (pointIndex, level) => {
    const point = structurePoints[pointIndex];
    
    if (level === 's1') {
      return MPES;
    }
    
    if (level === 's2') {
      const selectedMPES = point.s1;
      if (!selectedMPES || !organizationStructure[selectedMPES]) return [];
      return Object.keys(organizationStructure[selectedMPES]);
    }
    
    if (level === 's3') {
      const selectedMPES = point.s1;
      const selectedRKES = point.s2;
      if (!selectedMPES || !selectedRKES || !organizationStructure[selectedMPES]?.[selectedRKES]) return [];
      return organizationStructure[selectedMPES][selectedRKES];
    }
    
    return [];
  };

  const allFilled = structurePoints && structurePoints.length > 0 && structurePoints.every((point) =>
    nameStructures.every((cfg) => {
      const v = point[cfg.key];
      return v !== undefined && v !== null && String(v).trim() !== "";
    })
  );

  return (
    /* Главный контейнер - организует вертикальную структуру точек учета и навигации. */
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {structurePoints && structurePoints.map((point, index) => (
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
            {nameStructures.map((cfg) => {
              const opts = getOptionsForLevel(index, cfg.key);
              const isDisabled = cfg.key === 's2' && !point.s1 || cfg.key === 's3' && (!point.s1 || !point.s2);
              
              return (
                <Box key={`${cfg.key}-${index}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  {/* Поля для выбора структуры организации */}
                  <EnSelect
                    id={`${cfg.key}-${index}`}
                    label={cfg.label}
                    options={opts}
                    value={point[cfg.key]}
                    onChange={handleChange(index, cfg.key)}
                    helperText={isDisabled ? "Сначала выберите предыдущий уровень" : "Обязательное поле"}
                    disabled={isDisabled}
                    sx={{ flex: 1 }}
                  />
                  <CopyButtons
                    pointsCount={pointsCount}
                    index={index}
                    fieldValue={point[cfg.key]}
                    onApplyToAll={() => applyToAll(index, cfg.key)}
                    onApplyToNext={() => applyToNext(index, cfg.key)}
                    totalPoints={structurePoints.length}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )) || null}

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
