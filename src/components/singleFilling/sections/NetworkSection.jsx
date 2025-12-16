import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";

const NetworkSection = ({ formData, handleFieldChange }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Код сети
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        <EnSelect
          label="Сетевой код"
          placeholder="ААА-БВВ-ГГ-ДЕ-ЖЖЖ"
          value={formData.networkCode}
          onChange={(e) => handleFieldChange("networkCode", e.target.value)}
          freeInput
        />
        <EnSelect
          label="Номер опоры 0,4 кВ"
          value={formData.numberSupport04}
          onChange={(e) => handleFieldChange("numberSupport04", e.target.value)}
          freeInput
        />
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