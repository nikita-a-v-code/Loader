import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";

const ConsumerSection = ({ formData, handleFieldChange, abonentTypes, statuses }) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Потребитель
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
        <EnSelect
          label="Наименование потребителя"
          value={formData.consumerName}
          onChange={(e) => handleFieldChange("consumerName", e.target.value)}
          helperText="Обязательное поле"
          freeInput
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.consumerName ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        <EnSelect
          label="Наименование точки поставки"
          value={formData.deliveryPoint}
          onChange={(e) => handleFieldChange("deliveryPoint", e.target.value)}
          freeInput
        />
        <EnSelect
          label="Номер договора (лицевой счет)"
          value={formData.contractNumber}
          onChange={(e) => handleFieldChange("contractNumber", e.target.value)}
          freeInput
        />
        <EnSelect
          label="Тип абонента"
          options={abonentTypes.map((item) => item.name)}
          value={formData.subscriberType}
          onChange={(e) => handleFieldChange("subscriberType", e.target.value)}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.subscriberType ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        <EnSelect
          label="Статус счета"
          options={statuses.map((item) => item.name)}
          value={formData.accountStatus}
          onChange={(e) => handleFieldChange("accountStatus", e.target.value)}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.accountStatus ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ConsumerSection;
