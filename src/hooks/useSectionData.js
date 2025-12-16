import { useState, useCallback } from 'react';

export const useSectionData = (initialData, pointsCount, onChange, defaultFields = {}) => {
  // Инициализация состояния для всех точек учета
  const [points, setPoints] = useState(() => {
    const pointsArray = [];
    for (let i = 0; i < pointsCount; i++) {
      const point = {};
      // Заполняем поля из defaultFields с данными из initialData или значениями по умолчанию
      Object.keys(defaultFields).forEach(fieldName => {
        point[fieldName] = initialData[i]?.[fieldName] || defaultFields[fieldName];
      });
      pointsArray.push(point);
    }
    return pointsArray;
  });

  // Обработчик изменения поля
  const handleFieldChange = useCallback((pointIndex, fieldName, value, customLogic) => {
    const newPoints = [...points];
    newPoints[pointIndex] = {
      ...newPoints[pointIndex],
      [fieldName]: value,
    };

    // Выполняем кастомную логику если передана
    if (customLogic) {
      customLogic(newPoints, pointIndex, fieldName, value);
    }

    setPoints(newPoints);
    onChange(newPoints);
  }, [points, onChange]);

  // Применить значение ко всем точкам
  const applyToAll = useCallback((sourceIndex, fieldName, customLogic) => {
    const sourceValue = points[sourceIndex][fieldName];
    if (!sourceValue) return;

    const newPoints = points.map((point) => ({
      ...point,
      [fieldName]: sourceValue,
    }));

    // Выполняем кастомную логику если передана
    if (customLogic) {
      newPoints.forEach((point, index) => {
        customLogic(newPoints, index, fieldName, sourceValue);
      });
    }

    setPoints(newPoints);
    onChange(newPoints);
  }, [points, onChange]);

  // Применить значение к следующей точке
  const applyToNext = useCallback((sourceIndex, fieldName, customLogic) => {
    const sourceValue = points[sourceIndex][fieldName];
    if (!sourceValue || sourceIndex >= points.length - 1) return;

    const newPoints = [...points];
    newPoints[sourceIndex + 1] = {
      ...newPoints[sourceIndex + 1],
      [fieldName]: sourceValue,
    };

    // Выполняем кастомную логику если передана
    if (customLogic) {
      customLogic(newPoints, sourceIndex + 1, fieldName, sourceValue);
    }

    setPoints(newPoints);
    onChange(newPoints);
  }, [points, onChange]);

  // Проверка заполненности обязательных полей
  const checkAllFilled = useCallback((requiredFields, customCheck) => {
    if (customCheck) {
      return customCheck(points);
    }
    
    return points.every((point) => 
      requiredFields.every(field => point[field])
    );
  }, [points]);

  return {
    points,
    setPoints,
    handleFieldChange,
    applyToAll,
    applyToNext,
    checkAllFilled
  };
};