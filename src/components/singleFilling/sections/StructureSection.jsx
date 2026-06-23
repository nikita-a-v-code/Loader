/**
 * StructureSection - секция формы для выбора структуры организации
 * 
 * Содержит поля иерархии:
 * - МПЭС (с1) - магистральные пункты электроснабжения
 * - РКЭС (s2) - распределительные каменные подстанции (выбирается после МПЭС)
 * - Мастерский участок (s3) - МУ (выбирается после РКЭС)
 * 
 * Зависимости:
 * - РКЭС доступен только после выбора МПЭС
 * - МУ доступен только после выбора МПЭС и РКЭС
 * - При изменении родительского поля дочерние поля очищаются
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";

/**
 * Компонент StructureSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 * @param {Array} props.mpes - массив МПЭС
 * @param {Function} props.getRkesOptions - функция получения списка РКЭС
 * @param {Function} props.getMuOptions - функция получения списка МУ
 */
const StructureSection = ({ formData, handleFieldChange, mpes, getRkesOptions, getMuOptions }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Структура организации
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
        {/* МПЭС - верхний уровень иерархии, обязательное поле */}
        <EnSelect
          label="МПЭС"
          options={mpes.map((m) => m.name)}
          value={formData.s1}
          onChange={(e) => handleFieldChange("s1", e.target.value)}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.s1 ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* РКЭС - средний уровень иерархии, доступен только после выбора МПЭС */}
        <EnSelect
          label="РКЭС"
          options={getRkesOptions()}
          value={formData.s2}
          onChange={(e) => handleFieldChange("s2", e.target.value)}
          disabled={!formData.s1}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.s2 ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Мастерский участок - нижний уровень иерархии, доступен только после выбора РКЭС */}
        <EnSelect
          label="Мастерский участок"
          options={getMuOptions()}
          value={formData.s3}
          onChange={(e) => handleFieldChange("s3", e.target.value)}
          disabled={!formData.s1 || !formData.s2}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.s3 ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default StructureSection;