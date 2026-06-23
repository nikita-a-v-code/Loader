/**
 * NetworkSection - секция формы для заполнения сетевого кода
 * 
 * Содержит поля:
 * - Сетевой код (Формат: ААА-БВВ-ГГ-ДЕ-ЖЖЖ)
 * - Номер трансформаторной подстанции (выбор из списка или создание нового)
 * - Номер опоры 0,4 кВ
 * - Максимальная мощность, кВт
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import AddNewElement from "../../../ui/Buttons/AddNewElement";

/**
 * Компонент NetworkSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 * @param {Object} props.validationErrors - объект с ошибками валидации
 * @param {Object} props.errorMessages - объект с сообщениями об ошибках
 * @param {Array} props.numberTP - массив номеров ТП
 * @param {Function} props.createNumberTp - функция создания новой ТП
 */
const NetworkSection = ({
  formData,
  handleFieldChange,
  validationErrors = {},
  errorMessages = {},
  numberTP = [],
  createNumberTp,
}) => {
  // Преобразуем список номеров ТП в формат для EnSelect
  const numberTPOptions = numberTP.map((item) => item.name);

  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Код сети
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        {/* Сетевой код - формат ААА-БВВ-ГГ-ДЕ-ЖЖЖ */}
        <EnSelect
          label="Сетевой код"
          placeholder="ААА-БВВ-ГГ-ДЕ-ЖЖЖ"
          value={formData.networkCode}
          onChange={(e) => handleFieldChange("networkCode", e.target.value)}
          freeInput
          error={validationErrors.networkCode}
          helperText={validationErrors.networkCode ? errorMessages.networkCode : ""}
        />
        {/* 
          Номер трансформаторной подстанции
          - Выбор из списка или создание нового
          - Обязательное поле
        */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "start" }}>
          <EnSelect
            label="Номер трансформаторной подстанции"
            value={formData.transformerSubstationNumber}
            onChange={(e) => handleFieldChange("transformerSubstationNumber", e.target.value)}
            options={numberTPOptions}
            required
            searchable
            error={validationErrors.transformerSubstationNumber}
            helperText={validationErrors.transformerSubstationNumber ? "Выберите номер ТП" : "Обязательное поле"}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.transformerSubstationNumber ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
          <Box sx={{ mt: "20px" }}>
            <AddNewElement
              onAdd={createNumberTp}
              title="Добавить трансформаторную подстанцию"
              label="Название трансформаторной подстанции"
              placeholder="например: ТП-1"
              validateTPNumber={true}
              existingItems={numberTP}
            />
          </Box>
        </Box>
        {/* Номер опоры 0,4 кВ */}
        <EnSelect
          label="Номер опоры 0,4 кВ"
          value={formData.numberSupport04}
          onChange={(e) => handleFieldChange("numberSupport04", e.target.value)}
          freeInput
        />
        {/* Максимальная мощность, кВт */}
        <EnSelect
          label="Максимальная мощность, кВт"
          value={formData.maxPower}
          onChange={(e) => handleFieldChange("maxPower", e.target.value)}
          freeInput
        />
      </Box>
    </Box>
  );
};

export default NetworkSection;
