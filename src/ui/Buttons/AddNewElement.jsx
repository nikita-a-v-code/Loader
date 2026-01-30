import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Fade,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const AddNewElement = ({
  onAdd,
  title = "Добавить новый элемент",
  label = "Название",
  placeholder = "Введите название...",
  disabled = false,
  validateSettlement = false, // Параметр для валидации населенных пунктов
  validateStreet = false, // Параметр для валидации улиц
  existingItems = [], // Список существующих элементов для проверки дубликатов
  validateTPNumber = false, // Новый режим для номеров ТП
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successState, setSuccessState] = useState({ show: false, name: "" });

  // Допустимые префиксы для населенных пунктов
  const settlementPrefixes = ["г. ", "д. ", "пгт. ", "пос. ", "с. "];

  // Допустимые префиксы для улиц
  const streetPrefixes = ["пер. ", "пл. ", "ул. ", "пр-кт "];

  // Проверка на дубликаты названий населенных пунктов
  const checkSettlementDuplicate = (name) => {
    if (!validateSettlement || !existingItems.length) return false;

    const trimmedName = name.trim();
    const matchedPrefix = settlementPrefixes.find((prefix) => trimmedName.startsWith(prefix));
    if (!matchedPrefix) return false;

    const nameAfterPrefix = trimmedName.substring(matchedPrefix.length);
    if (!nameAfterPrefix) return false;

    // Проверяем, есть ли уже населенный пункт с таким же названием (любым префиксом)
    return existingItems.some((item) => {
      const existingName = typeof item === "string" ? item : item.name;
      if (!existingName) return false;

      const existingPrefix = settlementPrefixes.find((prefix) => existingName.startsWith(prefix));
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
    const matchedPrefix = settlementPrefixes.find((prefix) => trimmedName.startsWith(prefix));
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
    const matchedPrefix = streetPrefixes.find((prefix) => trimmedName.startsWith(prefix));
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
    let value = e.target.value;
    // Для номеров ТП: все буквы в верхний регистр
    if (validateTPNumber) {
      value = value.toUpperCase();
    }
    setInputValue(value);

    if (value.trim()) {
      if (validateSettlement) {
        const validation = validateSettlementName(value);
        setValidationError(validation.error);
      } else if (validateStreet) {
        const validation = validateStreetName(value);
        setValidationError(validation.error);
      } else if (validateTPNumber) {
        const validation = validateTPNumberFunc(value, existingItems);
        setValidationError(validation.error);
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  };

  // Валидация номера ТП: все буквы заглавные, обязательно одно тире
  const validateTPNumberFunc = (name, existingItems = []) => {
    const trimmed = name.trim();
    if (!trimmed) return { isValid: false, error: "Название не может быть пустым" };
    // Только заглавные буквы и цифры, одно тире
    if (!/^[A-ZА-Я0-9\-]+$/.test(trimmed)) {
      return { isValid: false, error: "Только заглавные буквы, цифры и тире" };
    }
    const dashCount = (trimmed.match(/-/g) || []).length;
    if (dashCount !== 1) {
      return { isValid: false, error: "Название должно содержать ровно одно тире" };
    }
    // Не должно быть дубликатов
    const exists = existingItems.some((item) => {
      const val = typeof item === "string" ? item : item.name;
      return val && val.toUpperCase() === trimmed;
    });
    if (exists) {
      return { isValid: false, error: "Такой номер уже существует" };
    }
    return { isValid: true, error: "" };
  };

  const handleOpen = () => {
    setOpen(true);
    setInputValue("");
    setSuccessState({ show: false, name: "" });
  };

  const handleClose = () => {
    setOpen(false);
    setInputValue("");
    setLoading(false);
    setValidationError("");
    setSuccessState({ show: false, name: "" });
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
    } else if (validateTPNumber) {
      const validation = validateTPNumberFunc(trimmedValue, existingItems);
      if (!validation.isValid) {
        setValidationError(validation.error);
        return;
      }
    }

    setLoading(true);
    try {
      await onAdd(trimmedValue);
      // Показываем успешное сообщение
      setSuccessState({ show: true, name: trimmedValue });
      setInputValue("");
      // Автоматически закрываем через 1.5 секунды
      setTimeout(() => {
        handleClose();
      }, 3500);
    } catch (error) {
      console.error("Error adding new item:", error);
      setValidationError(error.message || "Ошибка при создании. Попробуйте еще раз.");
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
        <DialogTitle sx={successState.show ? { textAlign: "center" } : {}}>
          {successState.show ? "Выберите из списка" : title}
        </DialogTitle>
        <DialogContent>
          {successState.show ? (
            <Fade in={successState.show}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <CheckCircleOutlineIcon
                  sx={{
                    fontSize: 64,
                    color: "success.main",
                    mb: 2,
                    animation: "pulse 0.5s ease-in-out",
                    "@keyframes pulse": {
                      "0%": { transform: "scale(0.5)", opacity: 0 },
                      "50%": { transform: "scale(1.2)" },
                      "100%": { transform: "scale(1)", opacity: 1 },
                    },
                  }}
                />
                <Box
                  sx={{
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    color: "success.main",
                    textAlign: "center",
                  }}
                >
                  Успешно создано!
                </Box>
                <Box
                  sx={{
                    fontSize: "1rem",
                    color: "text.secondary",
                    mt: 1,
                    textAlign: "center",
                  }}
                >
                  «{successState.name}»
                </Box>
              </Box>
            </Fade>
          ) : (
            <Box sx={{ pt: 1 }}>
              <TextField
                autoFocus
                fullWidth
                label={label}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                error={!!validationError}
                helperText={
                  validationError ||
                  (validateSettlement
                    ? `Пример: ${settlementPrefixes[0]}Киров`
                    : validateStreet
                      ? `Пример: ${streetPrefixes[0]}Ленина`
                      : validateTPNumber
                        ? "Пример: ТП-1, КТП-102. Только заглавные буквы, цифры и одно тире."
                        : "")
                }
                onKeyPress={handleKeyPress}
                variant="outlined"
                disabled={loading}
              />
            </Box>
          )}
        </DialogContent>
        {!successState.show && (
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Отмена
            </Button>
            <Button
              onClick={handleAdd}
              variant="contained"
              disabled={!inputValue.trim() || loading || !!validationError}
            >
              {loading ? "Добавление..." : "Добавить"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default AddNewElement;
