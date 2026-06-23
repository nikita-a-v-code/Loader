/**
 * ConnectionSection - секция формы для заполнения параметров подключения
 * 
 * Содержит поля:
 * - Опрос через УСПД (переключатель)
 * - IP адрес (админ)
 * - Порт (админ)
 * - Сетевой адрес (автоматически рассчитывается, заблокирован)
 * - Номер сим карты (короткий/полный)
 * - Коэффициент итоговый (автоматически рассчитывается)
 * - Протокол (админ)
 * - Номер коммуникатора (обязательный для РиМ)
 * - Номера ком портов
 * - Дополнительные параметры (админ)
 * - Наименование соединения
 * - Запросы (админ)
 * - Поля УСПД: наименование, тип, серийный номер, пользователь, пароль
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators } from "../../../utils/Validation/Validation";
import { useAuth } from "../../../context/AuthContext";
import { isRimModelRequiringCommunicator } from "../../../utils/Validation/validationRules";

/**
 * Компонент ConnectionSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 * @param {Array} props.protocols - массив протоколов
 * @param {Array} props.deviceTypes - массив моделей счетчиков
 * @param {Function} props.getNetworkAddress - функция для получения сетевого адреса
 * @param {Object} props.validationErrors - объект с ошибками валидации
 * @param {Object} props.errorMessages - объект с сообщениями об ошибках
 */
const ConnectionSection = ({
  formData,
  handleFieldChange,
  protocols,
  deviceTypes,
  getNetworkAddress,
  validationErrors = {},
  errorMessages = {},
}) => {
  const { isAdmin } = useAuth();
  const showRestrictedFields = isAdmin(); // Показывать скрытые поля только админам
  const isRimModel = isRimModelRequiringCommunicator(formData.typeDevice);

  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Параметры подключения
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        {/* Переключатель опроса через УСПД */}
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
        {/* IP адрес - только для админов */}
        {showRestrictedFields && (
          <EnSelect
            label="IP адрес"
            value={formData.ipAddress}
            onChange={(e) => handleFieldChange("ipAddress", e.target.value)}
            freeInput
          />
        )}
        {/* Порт - только для админов */}
        {showRestrictedFields && (
          <EnSelect
            label="Порт"
            value={formData.port}
            onChange={(e) => handleFieldChange("port", e.target.value)}
            helperText="Введите нужный порт"
            freeInput
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "success.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* 
          Сетевой адрес - автоматически рассчитывается
          - Заблокирован для редактирования
          - Использует модель счетчика и серийный номер
        */}
        {showRestrictedFields && (
          <EnSelect
            label="Сетевой адрес"
            value={getNetworkAddress() || formData.networkAddress}
            onChange={(e) => handleFieldChange("networkAddress", e.target.value)}
            freeInput
            disabled
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.protocol ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* Номер сим карты (короткий) - обязательное поле */}
        <EnSelect
          label="Номер сим карты (короткий)"
          value={formData.simCardShort}
          onChange={(e) => handleFieldChange("simCardShort", e.target.value)}
          freeInput
          required
          error={validationErrors.simCardShort}
          helperText={validationErrors.simCardShort ? validators.simCardShort.message : "Обязательное поле"}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.simCardShort || formData.simCardFull ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Номер сим карты (полный) - обязательное поле */}
        <EnSelect
          label="Номер сим карты (полный)"
          value={formData.simCardFull}
          onChange={(e) => handleFieldChange("simCardFull", e.target.value)}
          freeInput
          required
          error={validationErrors.simCardFull}
          helperText={validationErrors.simCardFull ? validators.simCardFull.message : "Обязательное поле"}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.simCardShort || formData.simCardFull ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Коэффициент итоговый - автоматически рассчитывается, заблокирован */}
        <TextField
          label="Коэффициент итоговый (не редактируемый)"
          value={formData.finalCoeff}
          InputProps={{ readOnly: true }}
          helperText="Обязательное поле"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.finalCoeff ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Протокол - только для админов, обязательное */}
        {showRestrictedFields && (
          <EnSelect
            label="Протокол"
            options={Array.isArray(protocols) ? protocols.map((p) => p.name) : []}
            value={formData.protocol}
            onChange={(e) => handleFieldChange("protocol", e.target.value)}
            helperText="Обязательное поле"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.protocol ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* 
          Номер коммуникатора
          - Обязательный для счетчиков РиМ
          - Валидация формата для всех
        */}
        <EnSelect
          label={isRimModel ? "Номер коммуникатора (для РиМ) *" : "Номер коммуникатора (для РиМ)"}
          value={formData.communicatorNumber}
          onChange={(e) => handleFieldChange("communicatorNumber", e.target.value)}
          freeInput
          error={validationErrors.communicatorNumber || (isRimModel && !formData.communicatorNumber)}
          helperText={
            validationErrors.communicatorNumber
              ? validators.communicatorNumber.message
              : isRimModel
                ? "Обязательное поле для счетчиков РиМ"
                : ""
          }
          required={isRimModel}
          sx={
            isRimModel
              ? {
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: formData.communicatorNumber ? "success.main" : "error.main",
                      borderWidth: "3px",
                    },
                  },
                }
              : {}
          }
        />
        {/* Номера ком портов */}
        <EnSelect
          label="Номера ком портов"
          value={formData.comPorts}
          onChange={(e) => handleFieldChange("comPorts", e.target.value)}
          freeInput
          helperText="Через запятую: 3,4,5"
        />
        {/* Дополнительные параметры - только для админов, обязательное */}
        {showRestrictedFields && (
          <EnSelect
            label="Дополнительные параметры"
            value={formData.advSettings}
            onChange={(e) => handleFieldChange("advSettings", e.target.value)}
            freeInput
            helperText="Обязательное поле"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.advSettings ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* Наименование соединения */}
        <EnSelect
          label="Наименование соединения"
          value={formData.nameConnection}
          onChange={(e) => handleFieldChange("nameConnection", e.target.value)}
          freeInput
        />
        {/* Запросы - только для админов, обязательное */}
        {showRestrictedFields && (
          <EnSelect
            label="Запросы"
            value={formData.requests}
            onChange={(e) => handleFieldChange("requests", e.target.value)}
            freeInput
            helperText="Обязательное поле"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.requests ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* 
          Секция УСПД показывается только если showUSPD === true
          - Наименование, тип, серийный номер, пользователь, пароль
        */}
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
