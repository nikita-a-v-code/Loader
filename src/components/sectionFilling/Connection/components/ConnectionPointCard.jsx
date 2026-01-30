import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../../ui/Buttons/CopyButtons";
import USPDFields from "./USPDFields";
import { useAuth } from "../../../../context/AuthContext";
import { isRimModelRequiringCommunicator } from "../../../../utils/Validation/validationRules";

/**
 * Карточка точки подключения
 */
const ConnectionPointCard = ({
  index,
  connection,
  consumerName,
  deviceModel,
  deviceRequests,
  deviceAdvSettings,
  pointsCount,
  ipAddresses,
  protocols,
  validationErrors,
  networkAddress,
  finalCoeff,
  onFieldChange,
  onUSPDToggle,
  onApplyToAll,
  onApplyToNext,
}) => {
  const { isAdmin } = useAuth();
  const showRestrictedFields = isAdmin(); // Показывать скрытые поля только админам
  const isRimModel = isRimModelRequiringCommunicator(deviceModel);

  return (
    <Box sx={{ mb: 2, border: "2px solid black", borderRadius: 2, p: 2 }}>
      {/* Заголовок */}
      <Box
        sx={{
          mb: 1,
          minWidth: 240,
          maxWidth: 240,
          fontWeight: "bold",
          fontSize: "16px",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {consumerName || "Точка учета"}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 240 }}>
        {/* Тумблер УСПД */}
        <FormControlLabel
          control={
            <Switch
              checked={connection.showUSPD}
              onChange={(e) => onUSPDToggle(index, e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Опрос через УСПД
            </Typography>
          }
          sx={{ mb: 1 }}
        />

        {/* IP адрес - только для админа */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`ipAddress-${index}`}
              label="IP адрес"
              options={Array.isArray(ipAddresses) ? ipAddresses.map((ip) => ip.address) : []}
              value={connection.ipAddress}
              onChange={(e) => onFieldChange(index, "ipAddress", e.target.value)}
              required={true}
              helperText="Обязательное поле"
              size="small"
              sx={{ width: 210 }}
            />
            <CopyButtons
              pointsCount={pointsCount}
              index={index}
              fieldValue={connection.ipAddress}
              onApplyToAll={() => onApplyToAll(index, "ipAddress")}
              onApplyToNext={() => onApplyToNext(index, "ipAddress")}
              totalPoints={pointsCount}
              arrowDirection="right"
            />
          </Box>
        )}

        {/* Порт - только для админа */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`port-${index}`}
              label="Порт"
              value={connection.port}
              onChange={(e) => onFieldChange(index, "port", e.target.value)}
              freeInput={true}
              required={true}
              error={validationErrors[`port-${index}`]}
              helperText={validationErrors[`port-${index}`] ? "Только цифры" : "Обязательное поле"}
              size="small"
              sx={{ width: 210 }}
            />
          </Box>
        )}

        {/* Сетевой адрес - только для админа */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`networkAddress-${index}`}
              label="Сетевой адрес"
              value={networkAddress || connection.networkAddress}
              onChange={(e) => onFieldChange(index, "networkAddress", e.target.value)}
              freeInput={true}
              required={true}
              helperText="Обязательное поле"
              size="small"
              sx={{ width: 210 }}
            />
          </Box>
        )}

        {/* Номер сим карты (короткий) */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <EnSelect
            id={`simCardShort-${index}`}
            label="Номер сим карты (короткий)"
            value={connection.simCardShort}
            onChange={(e) => onFieldChange(index, "simCardShort", e.target.value)}
            freeInput={true}
            required={true}
            error={validationErrors[`simCardShort-${index}`]}
            helperText={validationErrors[`simCardShort-${index}`] ? "Только цифры" : "Обязательное поле"}
            size="small"
            sx={{ width: 210 }}
          />
        </Box>

        {/* Номер сим карты (полный) */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <EnSelect
            id={`simCardFull-${index}`}
            label="Номер сим карты (полный)"
            value={connection.simCardFull}
            onChange={(e) => onFieldChange(index, "simCardFull", e.target.value)}
            freeInput={true}
            required={true}
            error={validationErrors[`simCardFull-${index}`]}
            helperText={
              validationErrors[`simCardFull-${index}`] ? "11 цифр, начинается с восьмерки" : "Обязательное поле"
            }
            size="small"
            sx={{ width: 210 }}
          />
        </Box>

        {/* Протокол - только для админа */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`protocol-${index}`}
              label="Протокол"
              options={Array.isArray(protocols) ? protocols.map((p) => p.name) : []}
              value={connection.protocol}
              onChange={(e) => onFieldChange(index, "protocol", e.target.value)}
              required={true}
              helperText="Обязательное поле"
              size="small"
              sx={{ width: 210 }}
            />
            <CopyButtons
              pointsCount={pointsCount}
              index={index}
              fieldValue={connection.protocol}
              onApplyToAll={() => onApplyToAll(index, "protocol")}
              onApplyToNext={() => onApplyToNext(index, "protocol")}
              totalPoints={pointsCount}
              arrowDirection="right"
            />
          </Box>
        )}

        {/* Коэффициент итоговый */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <TextField
            id={`finalCoeff-${index}`}
            label="Коэффициент итоговый (не редактируемый)"
            value={finalCoeff}
            InputProps={{ readOnly: true }}
            helperText="Обязательное поле"
            size="small"
            sx={{
              width: 210,
              "& .MuiInputBase-root": {
                height: "55px",
              },
            }}
          />
        </Box>

        {/* Номер коммуникатора */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, marginTop: 10 }}>
          <EnSelect
            id={`communicatorNumber-${index}`}
            label={isRimModel ? "Номер коммуникатора (для счетчиков РиМ) *" : "Номер коммуникатора (для счетчиков РиМ)"}
            value={connection.communicatorNumber}
            onChange={(e) => onFieldChange(index, "communicatorNumber", e.target.value)}
            freeInput={true}
            error={validationErrors[`communicatorNumber-${index}`] || (isRimModel && !connection.communicatorNumber)}
            helperText={
              validationErrors[`communicatorNumber-${index}`]
                ? "Только цифры"
                : isRimModel
                  ? "Обязательное поле для счетчиков РиМ"
                  : ""
            }
            size="small"
            sx={{ width: 210 }}
          />
        </Box>

        {/* Номера ком портов */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <EnSelect
            id={`comPorts-${index}`}
            label="Номера ком портов"
            value={connection.comPorts}
            onChange={(e) => onFieldChange(index, "comPorts", e.target.value)}
            freeInput={true}
            helperText="Обязательное поле (для CSD)"
            size="small"
            sx={{ width: 360 }}
          />
          <CopyButtons
            pointsCount={pointsCount}
            index={index}
            fieldValue={connection.comPorts}
            onApplyToAll={() => onApplyToAll(index, "comPorts")}
            onApplyToNext={() => onApplyToNext(index, "comPorts")}
            totalPoints={pointsCount}
            arrowDirection="right"
          />
        </Box>

        {/* Дополнительные параметры */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`advSettings-${index}`}
              label="Дополнительные параметры счетчика"
              value={
                connection.advSettingsEdited
                  ? connection.advSettings
                  : connection.advSettings || deviceAdvSettings || ""
              }
              onChange={(e) => onFieldChange(index, "advSettings", e.target.value)}
              freeInput={true}
              helperText="Обязательное поле"
              size="small"
              sx={{ width: 360 }}
            />
            <CopyButtons
              pointsCount={pointsCount}
              index={index}
              fieldValue={connection.advSettings}
              onApplyToAll={() => onApplyToAll(index, "advSettings")}
              onApplyToNext={() => onApplyToNext(index, "advSettings")}
              totalPoints={pointsCount}
              arrowDirection="right"
            />
          </Box>
        )}

        {/* Наименование соединения */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <EnSelect
            id={`nameConnection-${index}`}
            label="Наименование соединения"
            value={connection.nameConnection}
            onChange={(e) => onFieldChange(index, "nameConnection", e.target.value)}
            freeInput={true}
            size="small"
            sx={{ width: 360 }}
          />
          <CopyButtons
            pointsCount={pointsCount}
            index={index}
            fieldValue={connection.nameConnection}
            onApplyToAll={() => onApplyToAll(index, "nameConnection")}
            onApplyToNext={() => onApplyToNext(index, "nameConnection")}
            totalPoints={pointsCount}
            arrowDirection="right"
          />
        </Box>

        {/* Запросы */}
        {showRestrictedFields && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`requests-${index}`}
              label="Запросы"
              value={connection.requestsEdited ? connection.requests : connection.requests || deviceRequests || ""}
              onChange={(e) => onFieldChange(index, "requests", e.target.value)}
              freeInput={true}
              helperText="Обязательное поле"
              size="small"
              sx={{ width: 360 }}
            />
            <CopyButtons
              pointsCount={pointsCount}
              index={index}
              fieldValue={connection.requests}
              onApplyToAll={() => onApplyToAll(index, "requests")}
              onApplyToNext={() => onApplyToNext(index, "requests")}
              totalPoints={pointsCount}
              arrowDirection="right"
            />
          </Box>
        )}

        {/* Поля УСПД */}
        {connection.showUSPD && (
          <USPDFields
            index={index}
            connection={connection}
            pointsCount={pointsCount}
            onFieldChange={onFieldChange}
            onApplyToAll={onApplyToAll}
            onApplyToNext={onApplyToNext}
          />
        )}
      </Box>
    </Box>
  );
};

export default ConnectionPointCard;
