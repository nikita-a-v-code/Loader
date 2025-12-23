import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";

const TransformSection = ({ formData, handleFieldChange }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Трансформаторы тока и напряжения
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, color: "orange", fontWeight: "bold" }}>
            Трансформатор тока (ТТ)
          </Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            <EnSelect
              label="Тип ТТ"
              value={formData.ttType}
              onChange={(e) => handleFieldChange("ttType", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Коэффициент трансформации ТТ"
              value={formData.ttCoeff}
              onChange={(e) => handleFieldChange("ttCoeff", e.target.value)}
              helperText="Обязательное поле"
              freeInput
              required
            />
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
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, color: "secondary.main", fontWeight: "bold" }}>
            Трансформатор напряжения (ТН)
          </Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            <EnSelect
              label="Тип ТН"
              value={formData.tnType}
              onChange={(e) => handleFieldChange("tnType", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Коэффициент трансформации ТН"
              value={formData.tnCoeff}
              onChange={(e) => handleFieldChange("tnCoeff", e.target.value)}
              helperText="Обязательное поле"
              freeInput
              required
            />
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
    </Box>
  );
};

export default TransformSection;
