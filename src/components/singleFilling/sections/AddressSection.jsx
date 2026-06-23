/**
 * AddressSection - секция формы для заполнения адреса точки учета
 * 
 * Содержит поля:
 * - Населенный пункт (выбор или создание нового)
 * - Улица (выбор или создание нового)
 * - Дом
 * - Корпус (литера) - только заглавные буквы
 * - Квартира (офис) - только цифры
 * 
 * Возможности:
 * - Добавление новых населенных пунктов через кнопку
 * - Добавление новых улиц через кнопку
 * - Валидация формата полей (буквы, цифры)
 */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnSelect from "../../../ui/EnSelect/EnSelect";
import { validators } from "../../../utils/Validation/Validation";
import AddNewElement from "../../../ui/Buttons/AddNewElement";

/**
 * Компонент AddressSection
 * 
 * @param {Object} props - свойства компонента
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.handleFieldChange - функция для обновления полей формы
 * @param {Array} props.settl - массив населенных пунктов
 * @param {Function} props.getStreetsForSettlement - функция получения улиц
 * @param {Function} props.createNewSettlement - функция создания нового населенного пункта
 * @param {Function} props.createNewStreet - функция создания новой улицы
 * @param {Object} props.validationErrors - объект с ошибками валидации
 */
const AddressSection = ({
  formData,
  handleFieldChange,
  settl,
  getStreetsForSettlement,
  createNewSettlement,
  createNewStreet,
  validationErrors,
}) => {
  return (
    <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "grey.300", borderRadius: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Адрес точки учета
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {/* 
          Населенный пункт с кнопкой добавления
          - Выбор из списка или создание нового
          - Обязательное поле
        */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "start", mt: "8px" }}>
          <EnSelect
            label="Населенный пункт"
            options={settl.map((s) => s.name)}
            value={formData.settlement}
            onChange={(e) => handleFieldChange("settlement", e.target.value)}
            helperText="Обязательное поле"
            searchable
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.settlement ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
          <Box sx={{ mt: "12px" }}>
            <AddNewElement
              onAdd={createNewSettlement}
              title="Добавить населенный пункт"
              label="Название населенного пункта"
              placeholder="например: г. Москва"
              validateSettlement={true}
              existingItems={settl}
            />
          </Box>
        </Box>

        {/* 
          Улица с кнопкой добавления
          - Доступна только после выбора населенного пункта
          - Выбор из списка или создание нового
          - Обязательное поле
        */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1, alignItems: "start", mt: "8px" }}>
          <EnSelect
            label="Улица"
            options={getStreetsForSettlement(formData.settlement)}
            value={formData.street}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            helperText="Обязательное поле"
            disabled={!formData.settlement}
            searchable
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: formData.street ? "success.main" : "error.main",
                  borderWidth: "3px",
                },
              },
            }}
          />
          <Box sx={{ mt: "12px" }}>
            <AddNewElement
              onAdd={(name) => createNewStreet(name, formData.settlement)}
              title="Добавить улицу"
              label="Название улицы"
              placeholder="например: ул. Ленина"
              validateStreet={true}
              disabled={!formData.settlement}
            />
          </Box>
        </Box>

        {/* Номер дома - свободный ввод */}
        <Box>
          <EnSelect
            label="Дом"
            value={formData.house}
            onChange={(e) => handleFieldChange("house", e.target.value)}
            freeInput
          />
        </Box>

        {/* 
          Корпус (литера) - только заглавные буквы
          - Валидация формата
          - Подсказка при ошибке
        */}
        <Box>
          <EnSelect
            label="Корпус (литера)"
            value={formData.building}
            onChange={(e) => handleFieldChange("building", e.target.value)}
            freeInput
            error={validationErrors.building}
            helperText={validationErrors.building ? validators.uppercaseLetters.message : ""}
          />
        </Box>

        {/* 
          Квартира (офис) - только цифры
          - Валидация формата
          - Подсказка при ошибке
        */}
        <Box>
          <EnSelect
            label="Квартира (офис)"
            value={formData.apartment}
            onChange={(e) => handleFieldChange("apartment", e.target.value)}
            freeInput
            error={validationErrors.apartment}
            helperText={validationErrors.apartment ? validators.digits.message : ""}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AddressSection;
