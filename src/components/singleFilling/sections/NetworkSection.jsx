import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import AddNewElement from "../../../ui/Buttons/AddNewElement";

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
        <EnSelect
          label="Сетевой код"
          placeholder="ААА-БВВ-ГГ-ДЕ-ЖЖЖ"
          value={formData.networkCode}
          onChange={(e) => handleFieldChange("networkCode", e.target.value)}
          freeInput
          error={validationErrors.networkCode}
          helperText={validationErrors.networkCode ? errorMessages.networkCode : ""}
        />
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
