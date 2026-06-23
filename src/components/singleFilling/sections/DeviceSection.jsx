/**
 * DeviceSection - секция формы для заполнения данных о приборе учета (счетчик)
 * 
 * Содержит поля:
 * - Модель счетчика (выбор из справочника deviceTypes)
 * - Серийный номер
 * - Кол-во фаз (1 или 3)
 * - Идентификатор объекта (objectID) - виден только администраторам
 * - Дата поверки
 * - Межповерочный интервал (лет)
 * - Дата установки
 * - Номер пломбы на клемной крышке
 * - Номер пломбы на корпусе счетчика
 * - Пароль на конфигурирование - виден только администраторам
 * - Примечание
 * 
 * ВАЖНО:
 * - objectID: автоматически присваивается при создании карточки, заблокирован для редактирования
 * - password: чувствительное поле, видно только администраторам
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators } from "../../../utils/Validation/Validation";
import { useAuth } from "../../../context/AuthContext";

/**
 * Компонент DeviceSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 * @param {Array} props.deviceTypes - массив моделей счетчиков
 * @param {Object} props.validationErrors - объект с ошибками валидации
 */
const DeviceSection = ({ formData, handleFieldChange, deviceTypes, validationErrors }) => {
  const { isAdmin } = useAuth();
  const showRestrictedFields = isAdmin(); // Показывать скрытые поля только администраторам

  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Прибор учета
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
        {/* Модель счетчика - выбор из справочника */}
        <EnSelect
          label="Модель счетчика"
          options={deviceTypes.map((device) => device.name)}
          value={formData.typeDevice}
          onChange={(e) => handleFieldChange("typeDevice", e.target.value)}
          helperText="Обязательное поле"
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.typeDevice ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Серийный номер - только цифры, обязательное поле */}
        <EnSelect
          label="Серийный номер"
          value={formData.serialNumber}
          onChange={(e) => handleFieldChange("serialNumber", e.target.value)}
          freeInput
          required
          error={validationErrors.serialNumber}
          helperText={validationErrors.serialNumber ? "Только цифры" : "Обязательное поле"}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: formData.serialNumber ? "success.main" : "error.main",
                borderWidth: "3px",
              },
            },
          }}
        />
        {/* Количество фаз - выбор 1 или 3 */}
        <EnSelect
          label="Кол-во фаз"
          options={["1", "3"]}
          value={formData.numberPhases}
          onChange={(e) => handleFieldChange("numberPhases", e.target.value)}
        />

        {/* 
          Идентификатор объекта (objectID)
          - Виден только администраторам (showRestrictedFields)
          - Автоматически присваивается при создании карточки
          - Заблокирован для редактирования (disabled)
          - Значение уникально для каждой точки
        */}
        {showRestrictedFields && (
          <EnSelect
            label="Идентификатор объекта"
            value={formData.objectID}
            onChange={(e) => handleFieldChange("objectID", e.target.value)}
            helperText="Уникальное значение, автоматически присваивается из базы данных"
            disabled
          />
        )}
        {/* Дата поверки - формат ДД.ММ.ГГГГ */}
        <EnSelect
          label="Дата поверки"
          value={formData.verificationDate}
          onChange={(e) => handleFieldChange("verificationDate", e.target.value)}
          freeInput
          error={validationErrors.verificationDate}
          helperText={validationErrors.verificationDate ? "Формат ДД.ММ.ГГГГ" : ""}
        />
        {/* Межповерочный интервал - максимум 2 цифры */}
        <EnSelect
          label="Межповерочный интервал (лет)"
          value={formData.verificationInterval}
          onChange={(e) => handleFieldChange("verificationInterval", e.target.value)}
          freeInput
          error={validationErrors.verificationInterval}
          helperText={validationErrors.verificationInterval ? "Максимум 2 цифры" : ""}
        />
        {/* Дата установки - формат ДД.ММ.ГГГГ */}
        <EnSelect
          label="Дата установки"
          value={formData.dateInstallation}
          onChange={(e) => handleFieldChange("dateInstallation", e.target.value)}
          freeInput
          error={validationErrors.dateInstallation}
          helperText={validationErrors.dateInstallation ? "Формат ДД.ММ.ГГГГ" : ""}
        />
        {/* Номер пломбы на клемной крышке */}
        <EnSelect
          label="Номер пломбы на клемной крышке"
          value={formData.numberTerminal}
          onChange={(e) => handleFieldChange("numberTerminal", e.target.value)}
          freeInput
        />
        {/* Номер пломбы на корпусе счетчика */}
        <EnSelect
          label="Номер пломбы на корпусе счетчика"
          value={formData.numberCasing}
          onChange={(e) => handleFieldChange("numberCasing", e.target.value)}
          freeInput
        />
        {/* 
          Пароль на конфигурирование
          - Виден только администраторам (showRestrictedFields)
          - Обязательное поле
        */}
        {showRestrictedFields && (
          <EnSelect
            label="Пароль на конфигурирование"
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            helperText="Обязательное поле"
            freeInput
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.password ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
        )}
        {/* Примечание - необязательное поле */}
        <EnSelect
          label="Примечание"
          value={formData.note}
          onChange={(e) => handleFieldChange("note", e.target.value)}
          freeInput
        />
      </Box>
    </Box>
  );
};

export default DeviceSection;
