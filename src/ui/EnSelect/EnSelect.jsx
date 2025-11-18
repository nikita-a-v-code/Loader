import * as React from "react";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

export default function EnSelect({
  id = "select",
  label = "",
  options = [],
  value = "",
  onChange = () => {},
  required = true,
  helperText = "",
  sx = { m: 1, minWidth: 240 },
  freeInput = false, // Новый параметр для свободного ввода
  searchable = false, // Новый параметр для поиска по списку
  error = false, // Параметр для отображения ошибки
  disabled = false,
}) {
  // Если включен поиск по списку, используем Autocomplete
  if (searchable) {
    return (
      <FormControl required={required} sx={sx}>
        <Autocomplete
          id={id}
          options={options}
          disabled={disabled}
          getOptionLabel={(option) => {
            if (typeof option === "object") {
              return option.label ?? option.name ?? option.value ?? "";
            }
            return option || "";
          }}
          value={options.find(opt => {
            const optValue = typeof opt === "object" ? opt.value : opt;
            return optValue === value;
          }) || null}
          onChange={(event, newValue) => {
            const selectedValue = newValue ? (typeof newValue === "object" ? newValue.value : newValue) : "";
            onChange({ target: { value: selectedValue } });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={required ? `${label} *` : label}
              helperText={helperText}
              error={error}
              FormHelperTextProps={{
                sx: error ? { color: 'red', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }
              }}
            />
          )}
          noOptionsText="Нет данных"
          clearText="Очистить"
          openText="Открыть"
          closeText="Закрыть"
        />
      </FormControl>
    );
  }

  // Если включен свободный ввод, используем TextField
  if (freeInput) {
    return (
      <FormControl required={required} sx={sx}>
        <TextField
          id={id}
          label={required ? `${label} *` : label}
          value={value}
          onChange={onChange}
          helperText={helperText}
          variant="outlined"
          fullWidth
          error={error}
          FormHelperTextProps={{
            sx: error ? { color: 'red', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }
          }}
        />
      </FormControl>
    );
  }

  // Иначе используем обычный Select
  return (
    <>
      <FormControl required={required} sx={sx} error={error}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value}
          label={required ? `${label} *` : label}
          onChange={onChange}
          renderValue={(x) => {
            return x;
          }}
        >
          <MenuItem value="">
            <em>Не выбрано</em>
          </MenuItem>
          {Array.isArray(options) && options.length > 0 ? (
            options.map((opt, i) => {
              const optValue = typeof opt === "object" ? opt.value : opt;
              const optLabel = typeof opt === "object" ? opt.label ?? opt.name ?? opt.value : opt;
              return (
                <MenuItem key={String(optValue) + i} value={optValue}>
                  {optLabel}
                </MenuItem>
              );
            })
          ) : (
            <MenuItem value="">(нет данных)</MenuItem>
          )}
        </Select>
        {helperText ? (
          <FormHelperText sx={error ? { color: 'red', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}>
            {helperText}
          </FormHelperText>
        ) : null}
      </FormControl>
    </>
  );
}
