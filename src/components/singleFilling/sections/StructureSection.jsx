import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";

const StructureSection = ({ formData, handleFieldChange, mpes, getRkesOptions, getMuOptions }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Структура организации
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
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
