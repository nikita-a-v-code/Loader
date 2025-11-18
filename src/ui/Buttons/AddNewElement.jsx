import React, { useState } from "react";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const AddNewElement = ({
  onAdd,
  title = "Добавить новый элемент",
  label = "Название",
  placeholder = "Введите название...",
  disabled = false,
  validateSettlement = false, // Параметр для валидации населенных пунктов
  validateStreet = false, // Параметр для валидации улиц
  existingItems = [], // Список существующих элементов для проверки дубликатов
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Допустимые префиксы для населенных пунктов
  const settlementPrefixes = ["г. ", "д. ", "пгт. ", "пос. ", "с. "];
  
  // Допустимые префиксы для улиц
  const streetPrefixes = ["пер. ", "пл. ", "ул. ", "пр-кт "];

  // Проверка на дубликаты названий населенных пунктов
  const checkSettlementDuplicate = (name) => {
    if (!validateSettlement || !existingItems.length) return false;
    
    const trimmedName = name.trim();
    const matchedPrefix = settlementPrefixes.find(prefix => trimmedName.startsWith(prefix));
    if (!matchedPrefix) return false;
    
    const nameAfterPrefix = trimmedName.substring(matchedPrefix.length);
    if (!nameAfterPrefix) return false;
    
    // Проверяем, есть ли уже населенный пункт с таким же названием (любым префиксом)
    return existingItems.some(item => {
      const existingName = typeof item === 'string' ? item : item.name;
      if (!existingName) return false;
      
      const existingPrefix = settlementPrefixes.find(prefix => existingName.startsWith(prefix));
      if (!existingPrefix) return false;
      
      const existingNameAfterPrefix = existingName.substring(existingPrefix.length);
      return existingNameAfterPrefix.toLowerCase() === nameAfterPrefix.toLowerCase();
    });
  };

  // Валидация населенного пункта
  const validateSettlementName = (name) => {
    if (!validateSettlement) return { isValid: true, error: "" };

    const trimmedName = name.trim();
    if (!trimmedName) return { isValid: false, error: "Название не может быть пустым" };

    // Проверяем, что название начинается с одного из префиксов
    const matchedPrefix = settlementPrefixes.find(prefix => trimmedName.startsWith(prefix));
    if (!matchedPrefix) {
      return { isValid: false, error: `Название должно начинаться с: ${settlementPrefixes.join(", ")}` };
    }

    // Проверяем, что после префикса есть текст
    const nameAfterPrefix = trimmedName.substring(matchedPrefix.length);
    if (!nameAfterPrefix) {
      return { isValid: false, error: "После префикса должно быть название" };
    }
    
    // Проверяем, что первая буква после префикса заглавная
    const firstChar = nameAfterPrefix.charAt(0);
    if (!(firstChar === firstChar.toUpperCase() && /[А-ЯA-Z]/.test(firstChar))) {
      return { isValid: false, error: "Первая буква после префикса должна быть заглавной" };
    }
    
    // Проверяем на дубликаты
    if (checkSettlementDuplicate(trimmedName)) {
      return { isValid: false, error: `Населенный пункт "${nameAfterPrefix}" уже существует` };
    }
    
    return { isValid: true, error: "" };
  };

  // Валидация улицы
  const validateStreetName = (name) => {
    if (!validateStreet) return { isValid: true, error: "" };

    const trimmedName = name.trim();
    if (!trimmedName) return { isValid: false, error: "Название не может быть пустым" };

    // Проверяем, что название начинается с одного из префиксов
    const matchedPrefix = streetPrefixes.find(prefix => trimmedName.startsWith(prefix));
    if (!matchedPrefix) {
      return { isValid: false, error: `Название должно начинаться с: ${streetPrefixes.join(", ")}` };
    }

    // Проверяем, что после префикса есть текст
    const nameAfterPrefix = trimmedName.substring(matchedPrefix.length);
    if (!nameAfterPrefix) {
      return { isValid: false, error: "После префикса должно быть название" };
    }
    
    // Проверяем, что первая буква после префикса заглавная
    const firstChar = nameAfterPrefix.charAt(0);
    if (!(firstChar === firstChar.toUpperCase() && /[А-ЯA-Z]/.test(firstChar))) {
      return { isValid: false, error: "Первая буква после префикса должна быть заглавной" };
    }
    
    return { isValid: true, error: "" };
  };

  // Обработка изменения ввода
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      if (validateSettlement) {
        const validation = validateSettlementName(value);
        setValidationError(validation.error);
      } else if (validateStreet) {
        const validation = validateStreetName(value);
        setValidationError(validation.error);
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setInputValue("");
  };

  const handleClose = () => {
    setOpen(false);
    setInputValue("");
    setLoading(false);
    setValidationError("");
  };

  const handleAdd = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // Проверяем валидацию перед отправкой
    if (validateSettlement) {
      const validation = validateSettlementName(trimmedValue);
      if (!validation.isValid) {
        setValidationError(validation.error);
        return;
      }
    } else if (validateStreet) {
      const validation = validateStreetName(trimmedValue);
      if (!validation.isValid) {
        setValidationError(validation.error);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await onAdd(trimmedValue);
      if (result) {
        handleClose();
      }
    } catch (error) {
      console.error("Error adding new item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        disabled={disabled}
        color="primary"
        size="small"
        sx={{
          border: "1px solid #1976d2",
          borderRadius: 1,
          width: 32,
          height: 32,
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label={label}
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              error={!!validationError}
              helperText={validationError || (validateSettlement ? `Пример: ${settlementPrefixes[0]}Киров` : validateStreet ? `Пример: ${streetPrefixes[0]}Ленина` : "")}
              onKeyPress={handleKeyPress}
              variant="outlined"
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={!inputValue.trim() || loading || !!validationError}>
            {loading ? "Добавление..." : "Добавить"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddNewElement;
