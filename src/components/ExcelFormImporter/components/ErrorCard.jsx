import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  Box,
  Button,
} from "@mui/material";
import { STRUCTURE_FIELDS } from "../constants/excelHeaders";
import { getSimilarOptions } from "../utils/fuzzySearch";

/**
 * Поля сетевого кода - всегда показываем вместе при ошибке в любом из них.
 */
const NETWORK_CODE_FIELDS = [
  "Код ПС ((220)110/35-10(6)кВ",
  "Номер фидера 10(6)(3) кВ",
  "Номер ТП 10(6)/0,4 кВ",
  "Номер фидера 0,4 кВ",
  "Код потребителя 3х-значный",
];

/**
 * Поля SIM-карты - связаны логикой "или" (хотя бы одно должно быть заполнено)
 */
const SIM_CARD_FIELDS = ["Номер сим карты (короткий)", "Номер сим карты (полный)"];

/**
 * Связанные поля - если одно из них имеет ошибку, показываем оба.
 * Это помогает пользователю видеть контекст (например, населенный пункт рядом с улицей).
 */
const RELATED_FIELDS = {
  Улица: ["Населенный пункт"],
  "Населенный пункт": ["Улица"],
  РКЭС: ["Подразделение (МПЭС)"],
  "Мастерский участок": ["РКЭС", "Подразделение (МПЭС)"],
  // Поля сетевого кода связаны между собой
  "Код ПС ((220)110/35-10(6)кВ": NETWORK_CODE_FIELDS.filter((f) => f !== "Код ПС ((220)110/35-10(6)кВ"),
  "Номер фидера 10(6)(3) кВ": NETWORK_CODE_FIELDS.filter((f) => f !== "Номер фидера 10(6)(3) кВ"),
  "Номер ТП 10(6)/0,4 кВ": NETWORK_CODE_FIELDS.filter((f) => f !== "Номер ТП 10(6)/0,4 кВ"),
  "Номер фидера 0,4 кВ": NETWORK_CODE_FIELDS.filter((f) => f !== "Номер фидера 0,4 кВ"),
  "Код потребителя 3х-значный": NETWORK_CODE_FIELDS.filter((f) => f !== "Код потребителя 3х-значный"),
  // Поля SIM-карты связаны между собой (логика "или")
  "Номер сим карты (короткий)": ["Номер сим карты (полный)"],
  "Номер сим карты (полный)": ["Номер сим карты (короткий)"],
};

/**
 * Карточка с ошибками для одной строки Excel.
 * Отображает поля с ошибками, связанные с ними поля для контекста,
 * и затронутые пользователем поля (даже если ошибка исчезла после очистки).
 */
const ErrorCard = ({
  row,
  rowIndex,
  headers,
  errors,
  touchedFields = new Set(),
  getOptionsForField,
  onCellChange,
  onAcceptAll,
  showAcceptButton = false,
  hasErrors = false,
}) => {
  const rowErrors = errors[rowIndex] || {};
  const errorFields = Object.keys(rowErrors);

  // Собираем поля для отображения: ошибочные + связанные + затронутые пользователем
  const fieldsToShow = new Set(errorFields);

  // Добавляем связанные поля
  errorFields.forEach((field) => {
    const related = RELATED_FIELDS[field];
    if (related) {
      related.forEach((relField) => {
        fieldsToShow.add(relField);
      });
    }
  });

  // Добавляем затронутые пользователем поля (чтобы они не исчезали после очистки)
  touchedFields.forEach((field) => {
    fieldsToShow.add(field);
  });

  // Если хотя бы одно поле сетевого кода имеет значение - показываем все 5 полей
  const hasAnyNetworkCodeValue = NETWORK_CODE_FIELDS.some((field) => row[field] && row[field].trim() !== "");
  if (hasAnyNetworkCodeValue) {
    NETWORK_CODE_FIELDS.forEach((field) => {
      fieldsToShow.add(field);
    });
  }

  // Если хотя бы одно поле SIM-карты имеет ошибку или значение - показываем оба поля
  const hasAnySimCardError = SIM_CARD_FIELDS.some((field) => rowErrors[field]);
  const hasAnySimCardValue = SIM_CARD_FIELDS.some((field) => row[field] && row[field].trim() !== "");
  if (hasAnySimCardError || hasAnySimCardValue) {
    SIM_CARD_FIELDS.forEach((field) => {
      fieldsToShow.add(field);
    });
  }

  // Определяем порядок полей - сначала из headers, потом остальные
  const sortedFields = headers.filter((h) => fieldsToShow.has(h));

  return (
    <Card
      variant="outlined"
      sx={{
        border: "2px solid #d32f2f",
        backgroundColor: "#ffebee",
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 1, color: "error.main" }}>
          Точка учета #{rowIndex + 1} (из Excel файла)
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ mb: 2, color: "text.secondary" }}>
          Ошибочные поля: {errorFields.join(", ")}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {sortedFields.map((h, idx) => {
            const options = getOptionsForField(h, row);
            const isStructureField = STRUCTURE_FIELDS.includes(h);
            const hasError = Boolean(rowErrors[h]);
            const isTouched = touchedFields.has(h);
            // Поле показано для контекста только если нет ошибки И не было затронуто пользователем
            const isContextField = !hasError && !isTouched;

            return (
              <Grid item xs={12} sm={6} md={4} key={`${h}-${idx}`}>
                {/* Метка для выравнивания высоты */}
                <Box sx={{ mb: 0.5, height: 18 }}>
                  {isContextField && (
                    <Chip
                      label="для справки"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.7rem",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                      }}
                    />
                  )}
                </Box>
                {isStructureField ? (
                  <Autocomplete
                    options={options}
                    value={row[h] ?? ""}
                    inputValue={row[h] ?? ""}
                    filterOptions={(opts, state) => {
                      if (h === "Тип абонента" || h === "Статус счета" || h === "Модель счетчика") {
                        const searchValue = (state.inputValue || "").toLowerCase();
                        return opts.filter((opt) => opt.toLowerCase().includes(searchValue));
                      }
                      const searchValue = state.inputValue || "";
                      return getSimilarOptions(searchValue, opts);
                    }}
                    onChange={(event, newValue) => {
                      onCellChange(rowIndex, h, newValue ?? "");
                    }}
                    onInputChange={(event, newInputValue, reason) => {
                      if (reason === "input") {
                        onCellChange(rowIndex, h, newInputValue);
                      }
                    }}
                    freeSolo
                    openOnFocus
                    disableClearable
                    disabled={isContextField}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={h}
                        error={hasError}
                        helperText={rowErrors[h] || (isContextField ? "✓ Значение корректно" : "")}
                        variant="outlined"
                        size="small"
                        sx={
                          isContextField
                            ? {
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "#f5f5f5",
                                },
                              }
                            : {}
                        }
                      />
                    )}
                  />
                ) : (
                  <TextField
                    key={`textfield-${rowIndex}-${h}`}
                    label={h}
                    value={row[h] ?? ""}
                    onChange={(e) => onCellChange(rowIndex, h, e.target.value)}
                    error={hasError}
                    helperText={rowErrors[h] || ""}
                    variant="outlined"
                    fullWidth
                    size="small"
                    multiline
                    maxRows={3}
                  />
                )}
              </Grid>
            );
          })}
          {showAcceptButton && (
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ mb: 0.5, height: 18 }} />
              <Button
                variant="contained"
                color="success"
                size="small"
                fullWidth
                sx={{ height: 40 }}
                onClick={onAcceptAll}
                disabled={hasErrors}
              >
                Принять изменения
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ErrorCard;
