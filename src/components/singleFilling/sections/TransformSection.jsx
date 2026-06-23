/**
 * TransformSection - секция формы для заполнения данных о ТТ и ТН
 * 
 * Содержит:
 * - Переключатель "Есть ТТ/ТН"
 * - При включенном переключателе показывает:
 *   - Трансформатор тока (ТТ): тип, коэффициент, заводские номера и пломбы для фаз A/B/C
 *   - Трансформатор напряжения (ТН): тип, коэффициент, заводские номера и пломбы для фаз A/B/C
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import EnSelect from "../../../ui/EnSelect/EnSelect";

/**
 * Компонент TransformSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 */
const TransformSection = ({ formData, handleFieldChange }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Трансформаторы тока и напряжения
      </Typography>
      {/* Переключатель показа секции ТТ/ТН */}
      <FormControlLabel
        control={
          <Switch
            checked={formData.showTransform}
            onChange={(e) => handleFieldChange("showTransform", e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            Есть
          </Typography>
        }
        sx={{ gridColumn: "1 / -1", mb: 2 }}
      />
      {/* Секция ТТ и ТН показывается только если showTransform === true */}
      {formData.showTransform && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {/* Секция Трансформатор тока (ТТ) */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: "orange", fontWeight: "bold" }}>
                Трансформатор тока (ТТ)
              </Typography>
              <Box sx={{ display: "grid", gap: 2 }}>
                {/* Тип ТТ */}
                <EnSelect
                  label="Тип ТТ"
                  value={formData.ttType}
                  onChange={(e) => handleFieldChange("ttType", e.target.value)}
                  freeInput
                />
                {/* Коэффициент трансформации ТТ - обязательное поле */}
                <EnSelect
                  label="Коэффициент трансформации ТТ"
                  value={formData.ttCoeff}
                  onChange={(e) => handleFieldChange("ttCoeff", e.target.value)}
                  helperText="Обязательное поле"
                  freeInput
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: formData.ttCoeff ? "success.main" : "error.main",
                        borderWidth: "3px",
                      },
                    },
                  }}
                />
                {/* Заводские номера и пломбы для каждой фазы */}
                {["A", "B", "C"].map((phase) => (
                  <Box key={phase} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <EnSelect
                      label={`Заводской номер ТТ "${phase}"`}
                      value={formData[`ttSerial${phase}`]}
                      onChange={(e) => handleFieldChange(`ttSerial${phase}`, e.target.value)}
                      freeInput
                    />
                    <EnSelect
                      label={`№ пломбы ТТ "${phase}"`}
                      value={formData[`ttSeal${phase}`]}
                      onChange={(e) => handleFieldChange(`ttSeal${phase}`, e.target.value)}
                      freeInput
                    />
                  </Box>
                ))}
              </Box>
            </Box>
            {/* Секция Трансформатор напряжения (ТН) */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: "secondary.main", fontWeight: "bold" }}>
                Трансформатор напряжения (ТН)
              </Typography>
              <Box sx={{ display: "grid", gap: 2 }}>
                {/* Тип ТН */}
                <EnSelect
                  label="Тип ТН"
                  value={formData.tnType}
                  onChange={(e) => handleFieldChange("tnType", e.target.value)}
                  freeInput
                />
                {/* Коэффициент трансформации ТН - обязательное поле */}
                <EnSelect
                  label="Коэффициент трансформации ТН"
                  value={formData.tnCoeff}
                  onChange={(e) => handleFieldChange("tnCoeff", e.target.value)}
                  helperText="Обязательное поле"
                  freeInput
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: formData.tnCoeff ? "success.main" : "error.main",
                        borderWidth: "3px",
                      },
                    },
                  }}
                />
                {/* Заводские номера и пломбы для каждой фазы */}
                {["A", "B", "C"].map((phase) => (
                  <Box key={phase} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <EnSelect
                      label={`Заводской номер ТН "${phase}"`}
                      value={formData[`tnSerial${phase}`]}
                      onChange={(e) => handleFieldChange(`tnSerial${phase}`, e.target.value)}
                      freeInput
                    />
                    <EnSelect
                      label={`№ пломбы ТН "${phase}"`}
                      value={formData[`tnSeal${phase}`]}
                      onChange={(e) => handleFieldChange(`tnSeal${phase}`, e.target.value)}
                      freeInput
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default TransformSection;
