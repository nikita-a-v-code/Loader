import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators } from "../../../utils/Validation/Validation";

const ConnectionSection = ({
  formData,
  handleFieldChange,
  ipAddresses,
  protocols,
  getNetworkAddress,
  validationErrors = {},
  errorMessages = {},
}) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Параметры подключения
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.showUSPD}
              onChange={(e) => handleFieldChange("showUSPD", e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Опрос через УСПД
            </Typography>
          }
          sx={{ gridColumn: "1 / -1", mb: 2 }}
        />
        <EnSelect
          label="IP адрес"
          options={Array.isArray(ipAddresses) ? ipAddresses.map((ip) => ip.address) : []}
          value={formData.ipAddress}
          onChange={(e) => handleFieldChange("ipAddress", e.target.value)}
          helperText="Обязательное поле"
          required
        />
        <EnSelect
          label="Порт"
          value={formData.port}
          onChange={(e) => handleFieldChange("port", e.target.value)}
          helperText="Обязательное поле"
          freeInput
          required
        />
        <EnSelect
          label="Сетевой адрес"
          value={getNetworkAddress() || formData.networkAddress}
          onChange={(e) => handleFieldChange("networkAddress", e.target.value)}
          freeInput
          disabled
          sx={{ m: 1, minWidth: 240 }}
        />
        <EnSelect
          label="Номер сим карты (короткий)"
          value={formData.simCardShort}
          onChange={(e) => handleFieldChange("simCardShort", e.target.value)}
          freeInput
          required
          error={validationErrors.simCardShort}
          helperText={validationErrors.simCardShort ? validators.simCardShort.message : "Обязательное поле"}
        />
        <EnSelect
          label="Номер сим карты (полный)"
          value={formData.simCardFull}
          onChange={(e) => handleFieldChange("simCardFull", e.target.value)}
          freeInput
          required
          error={validationErrors.simCardFull}
          helperText={validationErrors.simCardFull ? validators.simCardFull.message : "Обязательное поле"}
        />
        <EnSelect
          label="Протокол"
          options={Array.isArray(protocols) ? protocols.map((p) => p.name) : []}
          value={formData.protocol}
          onChange={(e) => handleFieldChange("protocol", e.target.value)}
          helperText="Обязательное поле"
          required
        />
        <EnSelect
          label="Номер коммуникатора (для РиМ)"
          value={formData.communicatorNumber}
          onChange={(e) => handleFieldChange("communicatorNumber", e.target.value)}
          freeInput
          error={validationErrors.communicatorNumber}
          helperText={validationErrors.communicatorNumber ? validators.communicatorNumber.message : ""}
        />
        <EnSelect
          label="Номера ком портов"
          value={formData.comPorts}
          onChange={(e) => handleFieldChange("comPorts", e.target.value)}
          freeInput
          helperText="Через запятую: 3,4,5"
        />
        <EnSelect
          label="Дополнительные параметры"
          value={formData.advSettings}
          onChange={(e) => handleFieldChange("advSettings", e.target.value)}
          freeInput
        />
        <EnSelect
          label="Наименование соединения"
          value={formData.nameConnection}
          onChange={(e) => handleFieldChange("nameConnection", e.target.value)}
          freeInput
        />
        <EnSelect
          label="Запросы"
          value={formData.requests}
          onChange={(e) => handleFieldChange("requests", e.target.value)}
          freeInput
        />
        {formData.showUSPD && (
          <>
            <EnSelect
              label="Наименование УСПД"
              value={formData.nameUSPD}
              onChange={(e) => handleFieldChange("nameUSPD", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Тип УСПД"
              value={formData.typeUSPD}
              onChange={(e) => handleFieldChange("typeUSPD", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Серийный номер УСПД"
              value={formData.numberUSPD}
              onChange={(e) => handleFieldChange("numberUSPD", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Пользователь УСПД"
              value={formData.userUSPD}
              onChange={(e) => handleFieldChange("userUSPD", e.target.value)}
              freeInput
            />
            <EnSelect
              label="Пароль УСПД"
              value={formData.passwordUSPD}
              onChange={(e) => handleFieldChange("passwordUSPD", e.target.value)}
              freeInput
            />
          </>
        )}
      </Box>
    </Box>
  );
};

export default ConnectionSection;
