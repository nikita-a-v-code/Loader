import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import ApiService from "../../services/api";
import useExcelData from "./hooks/useExcelData";
import { getSimilarOptions, normalizeStreet } from "./utils/fuzzySearch";
import ErrorCard from "./components/ErrorCard";
import EmailDialog from "./components/EmailDialog";
import { validateNetworkCode } from "../../utils/networkCodeValidation";

/**
 * Поля сетевого кода для inline-валидации
 */
const NETWORK_CODE_FIELDS = [
  "Код ПС ((220)110/35-10(6)кВ",
  "Номер фидера 10(6)(3) кВ",
  "Номер ТП 10(6)/0,4 кВ",
  "Номер фидера 0,4 кВ",
  "Код потребителя 3х-значный",
];

/**
 * Поля SIM-карты (логика: заполнено хотя бы одно)
 */
const SIM_CARD_FIELDS = ["Номер сим карты (короткий)", "Номер сим карты (полный)"];

/**
 * Валидация отдельного поля сетевого кода
 * @param field - название поля
 * @param value - значение поля
 * @param row - вся строка данных (для проверки связанных полей)
 * @param touchedFields - затронутые пользователем поля
 */
const validateNetworkCodeField = (field, value, row = {}, touchedFields = new Set()) => {
  const trimmed = (value || "").trim();
  const original = value || "";

  // Проверяем, есть ли значение хотя бы в одном из полей сетевого кода или было ли затронуто
  const hasAnyNetworkCodeValue = NETWORK_CODE_FIELDS.some((f) => {
    const fieldValue = row[f];
    return (fieldValue && fieldValue.trim() !== "") || touchedFields.has(f);
  });

  // Если ни одно поле не заполнено и не затронуто - всё ок
  if (!hasAnyNetworkCodeValue && !trimmed) return null;

  // Проверка на пробелы
  if (original.includes(" ")) {
    return "Пробелы не допускаются";
  }

  // Если какое-то поле заполнено/затронуто, но текущее пустое - ошибка
  if (hasAnyNetworkCodeValue && !trimmed) {
    return "Заполните поле";
  }

  // Проверка формата значения
  switch (field) {
    case "Код ПС ((220)110/35-10(6)кВ":
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      if (trimmed.length === 3) {
        const result = validateNetworkCode(trimmed);
        if (!result.valid) return result.message;
      }
      return null;

    case "Номер фидера 10(6)(3) кВ":
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      return null;

    case "Номер ТП 10(6)/0,4 кВ":
      if (!/^[\dА-ЯA-Z]*$/.test(trimmed)) return "Только цифры и заглавные буквы";
      if (trimmed.length > 2) return "Максимум 2 символа";
      if (trimmed.length < 2) return "Введите 2 символа";
      return null;

    case "Номер фидера 0,4 кВ":
      if (!/^[\dА-ЯA-Z]*$/.test(trimmed)) return "Только цифры и заглавные буквы";
      if (trimmed.length > 2) return "Максимум 2 символа";
      if (trimmed.length < 2) return "Введите 2 символа";
      return null;

    case "Код потребителя 3х-значный":
      if (!/^\d*$/.test(trimmed)) return "Только цифры";
      if (trimmed.length > 3) return "Максимум 3 цифры";
      if (trimmed.length < 3) return "Введите 3 цифры";
      return null;

    default:
      return null;
  }
};

/**
 * Валидация полей SIM-карты (короткий/полный) для inline-режима
 * Возвращает объект ошибок по двум полям, основываясь на текущей строке.
 */
const getSimFieldErrors = (row, acceptedSimShortRows = new Set()) => {
  const errors = {};
  const shortKey = "Номер сим карты (короткий)";
  const fullKey = "Номер сим карты (полный)";
  const shortVal = (row[shortKey] || "").trim();
  const fullVal = (row[fullKey] || "").trim();

  const hasShort = shortVal !== "";
  const hasFull = fullVal !== "";

  // Требование: хотя бы одно поле обязательно
  if (!hasShort && !hasFull) {
    errors[shortKey] = "Заполните короткий или полный номер";
    errors[fullKey] = "Заполните короткий или полный номер";
    return errors;
  }

  // Короткий: если заполнен — только цифры, максимум 5; подтверждение нужно, если нет полного номера
  if (hasShort) {
    const rowIndex = row.__rowIndex;
    const isAccepted = rowIndex !== undefined && acceptedSimShortRows.has(rowIndex);
    const needsAccept = !hasFull && !isAccepted;

    if (!/^\d*$/.test(shortVal)) {
      errors[shortKey] = "Только цифры";
    } else if (shortVal.length > 5) {
      errors[shortKey] = "Максимум 5 цифр";
    } else if (needsAccept) {
      errors[shortKey] = 'Нажмите "Принять номер"';
    }
  }

  // Полный: если заполнен — только цифры, 11 цифр, начинается с 89
  if (hasFull) {
    if (!/^\d*$/.test(fullVal)) {
      errors[fullKey] = "Только цифры";
    } else if (fullVal.length > 11) {
      errors[fullKey] = "Максимум 11 цифр";
    } else if (fullVal.length >= 2 && !fullVal.startsWith("89")) {
      errors[fullKey] = "Должен начинаться с 89";
    } else if (fullVal.length < 11) {
      errors[fullKey] = "Введите 11 цифр";
    }
  }

  return errors;
};

/**
 * Компонент импорта Excel файлов.
 * Парсит Excel, валидирует данные, позволяет исправлять ошибки и экспортировать.
 */
const ExcelFormImporter = () => {
  // === Хук для работы с данными ===
  const {
    headers,
    setHeaders,
    rows,
    setRows,
    errors,
    setErrors,
    validationSuccess,
    setValidationSuccess,
    touchedFields,
    setTouchedFields,
    streetsBySettlement,
    loadStreetsForSettlement,
    autofillPasswords,
    autofillIpAddresses,
    calculateNetworkAddresses,
    autofillProtocols,
    assignPortsToRows,
    validateAll,
    getOptionsForField,
  } = useExcelData();

  // Строки, где пользователь вручную подтвердил короткий номер SIM
  const [acceptedSimShortRows, setAcceptedSimShortRows] = useState(new Set());
  const acceptedSimShortRowsRef = useRef(acceptedSimShortRows);

  useEffect(() => {
    acceptedSimShortRowsRef.current = acceptedSimShortRows;
  }, [acceptedSimShortRows]);

  // === State для UI ===
  const [loadError, setLoadError] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // === State для email ===
  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // === Refs для доступа к актуальным данным в callbacks ===
  const rowsRef = useRef(rows);
  const touchedFieldsRef = useRef(touchedFields);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    touchedFieldsRef.current = touchedFields;
  }, [touchedFields]);

  // Загружаем дефолтный email с сервера
  useEffect(() => {
    let active = true;
    ApiService.getDefaultEmail()
      .then((resp) => {
        if (active && resp?.defaultEmail) {
          setEmail(resp.defaultEmail);
        }
      })
      .catch((err) => {
        console.error("Не удалось получить дефолтный email:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Обработчик загрузки Excel файла.
   */
  const handleFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoadError(null);
      setFileLoading(true);

      try {
        const XLSX = await import(/* webpackChunkName: "xlsx" */ "xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!sheetData || sheetData.length === 0) {
          setLoadError("Пустой лист в файле");
          return;
        }

        const rawHdrRow = sheetData[1] && sheetData[1].length > 0 ? sheetData[1] : sheetData[0];

        // Обработка дублирующихся заголовков - добавляем суффиксы _2, _3 и т.д.
        const headerCounts = {};
        const hdrs = rawHdrRow.map((h) => {
          const trimmed = String(h || "").trim();
          if (!trimmed) return trimmed;

          if (headerCounts[trimmed] === undefined) {
            headerCounts[trimmed] = 1;
            return trimmed;
          } else {
            headerCounts[trimmed]++;
            return `${trimmed}_${headerCounts[trimmed]}`;
          }
        });

        const content = sheetData
          .slice(2)
          .map((rowArr) => {
            const obj = {};
            hdrs.forEach((h, i) => {
              obj[h] = rowArr[i] !== undefined && rowArr[i] !== null ? String(rowArr[i]).trim() : "";
            });
            return obj;
          })
          .filter((row) => Object.values(row).some((val) => val !== ""));

        let processedContent = content;
        // Заполняем протокол по настройкам (модели не нормализуем — пусть валидация покажет ошибку)
        processedContent = autofillProtocols(processedContent);

        setHeaders(hdrs);
        setRows(processedContent);
        setErrors({});
        setValidationSuccess(false);
        setTouchedFields({}); // Сбрасываем затронутые поля при загрузке нового файла
        setAcceptedSimShortRows(new Set()); // Сбрасываем подтверждения коротких номеров при новой загрузке

        e.target.value = "";
      } catch (err) {
        console.error("Error parsing Excel:", err);
        setLoadError(String(err.message || err));
      } finally {
        setFileLoading(false);
      }
    },
    [autofillProtocols, setHeaders, setRows, setErrors, setValidationSuccess]
  );

  /**
   * Обработчик изменения значения в ячейке.
   */
  const handleCellChange = useCallback(
    async (ri, field, value) => {
      // Используем ref для получения актуальных данных
      const currentRows = rowsRef.current;
      const currentTouchedFields = touchedFieldsRef.current;

      // Создаём обновлённую строку
      const updatedRow = { ...(currentRows[ri] || {}), [field]: value, __rowIndex: ri };

      // Создаём обновлённые touchedFields
      const updatedTouchedFields = new Set(currentTouchedFields[ri] || []);
      updatedTouchedFields.add(field);

      // Обновляем строку
      setRows((prev) => {
        const copy = [...prev];
        copy[ri] = { ...prev[ri], [field]: value };
        return copy;
      });

      // Отмечаем поле как затронутое
      setTouchedFields((prev) => {
        const rowTouched = new Set(prev[ri] || []);
        rowTouched.add(field);
        return { ...prev, [ri]: rowTouched };
      });

      // Для полей сетевого кода - сразу проверяем все 5 полей
      if (NETWORK_CODE_FIELDS.includes(field)) {
        setErrors((prevErrors) => {
          const copy = { ...prevErrors };

          // Проверяем все 5 полей сетевого кода с актуальными данными
          NETWORK_CODE_FIELDS.forEach((networkField) => {
            const fieldError = validateNetworkCodeField(
              networkField,
              updatedRow[networkField],
              updatedRow,
              updatedTouchedFields
            );

            if (fieldError) {
              if (!copy[ri]) copy[ri] = {};
              copy[ri][networkField] = fieldError;
            } else {
              if (copy[ri]) {
                delete copy[ri][networkField];
              }
            }
          });

          // Удаляем строку из ошибок если она пустая
          if (copy[ri] && Object.keys(copy[ri]).length === 0) {
            delete copy[ri];
          }

          return copy;
        });
      } else if (SIM_CARD_FIELDS.includes(field)) {
        // Для полей SIM-карты — инлайн-валидация обоих полей (логика "или")
        // Передаем acceptedSimShortRows, чтобы учитывать ручное подтверждение короткого номера
        const simErrors = getSimFieldErrors(updatedRow, acceptedSimShortRowsRef.current);

        setErrors((prev) => {
          const copy = { ...prev };
          // Обновляем ошибки для обоих полей SIM
          SIM_CARD_FIELDS.forEach((k) => {
            const msg = simErrors[k];
            if (msg) {
              if (!copy[ri]) copy[ri] = {};
              copy[ri][k] = msg;
            } else if (copy[ri]) {
              delete copy[ri][k];
            }
          });

          if (copy[ri] && Object.keys(copy[ri]).length === 0) {
            delete copy[ri];
          }
          return copy;
        });
      } else {
        // Для остальных полей - просто удаляем ошибку
        setErrors((prev) => {
          const copy = { ...prev };
          if (copy[ri]) {
            delete copy[ri][field];
            if (Object.keys(copy[ri]).length === 0) delete copy[ri];
          }
          return copy;
        });
      }
      setValidationSuccess(false);

      // Если изменили населенный пункт - асинхронно загружаем улицы
      if (field === "Населенный пункт" && value) {
        await loadStreetsForSettlement(value);
      }
    },
    [loadStreetsForSettlement, setRows, setErrors, setValidationSuccess, setTouchedFields]
  );

  // Применяем ручные подтверждения для короткого SIM к списку ошибок
  const applySimShortOverrides = useCallback(
    (rawErrors) => {
      if (!rawErrors) return rawErrors;
      const copy = { ...rawErrors };

      rows.forEach((row, ri) => {
        const shortVal = (row["Номер сим карты (короткий)"] || "").trim();
        const fullVal = (row["Номер сим карты (полный)"] || "").trim();
        const hasShort = shortVal !== "";
        const hasFull = fullVal !== "";
        const accepted = acceptedSimShortRows.has(ri);

        // Если короткий есть, полного нет и нет подтверждения — ошибка
        if (hasShort && !hasFull && !accepted) {
          if (!copy[ri]) copy[ri] = {};
          copy[ri]["Номер сим карты (короткий)"] = 'Нажмите "Принять номер"';
        }

        // Если короткий подтвержден или есть полный — убираем ошибку по короткому
        const shortIsOk = hasFull || accepted;
        if (shortIsOk && copy[ri]) {
          delete copy[ri]["Номер сим карты (короткий)"];
          if (Object.keys(copy[ri]).length === 0) delete copy[ri];
        }
      });

      return copy;
    },
    [acceptedSimShortRows, rows]
  );

  // Обертка поверх validateAll: удаляет ошибки короткого SIM для подтвержденных строк
  const validateAllWithOverrides = useCallback(async () => {
    const raw = await validateAll();
    const adjusted = applySimShortOverrides(raw);
    setErrors(adjusted);
    setValidationSuccess(Object.keys(adjusted || {}).length === 0);
    return adjusted;
  }, [validateAll, applySimShortOverrides, setErrors, setValidationSuccess]);

  /**
   * Экспорт данных в Excel.
   */
  const handleExport = useCallback(async () => {
    const validation = await validateAllWithOverrides();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед экспортом.");
      return;
    }

    try {
      // Экспортируем данные как есть (без автозаполнения IP/сетевых адресов)
      await ApiService.exportToExcel(rows);
    } catch (err) {
      console.error("Export error:", err);
      alert("Ошибка при экспорте: " + err.message);
    }
  }, [rows, validateAllWithOverrides]);

  /**
   * Отправка на email.
   */
  const handleSendToEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      alert("Введите корректный email адрес");
      return;
    }

    const validation = await validateAllWithOverrides();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед отправкой.");
      return;
    }

    try {
      setEmailSending(true);
      // Рассчитываем сетевые адреса, заполняем пароли, IP и назначаем порты
      let processedData = calculateNetworkAddresses(rows);
      processedData = autofillPasswords(processedData);
      processedData = autofillIpAddresses(processedData);
      processedData = await assignPortsToRows(processedData);

      await ApiService.sendExcelToEmail(processedData, email);
      alert(`Файл успешно отправлен на ${email}`);
      setEmailDialog(false);
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      alert("Ошибка при отправке на email");
    } finally {
      setEmailSending(false);
    }
  }, [
    email,
    rows,
    validateAllWithOverrides,
    calculateNetworkAddresses,
    autofillPasswords,
    autofillIpAddresses,
    assignPortsToRows,
  ]);

  // Ручное подтверждение короткого номера SIM для конкретной строки
  const handleAcceptSimShort = useCallback(
    (rowIndex) => {
      setAcceptedSimShortRows((prev) => new Set(prev).add(rowIndex));
      // Удаляем ошибку по этому полю для строки
      setErrors((prev) => {
        const copy = { ...prev };
        if (copy[rowIndex]) {
          delete copy[rowIndex]["Номер сим карты (короткий)"];
          if (Object.keys(copy[rowIndex]).length === 0) delete copy[rowIndex];
        }
        // Если больше нет ошибок, считаем проверку успешной
        if (Object.keys(copy).length === 0) {
          setValidationSuccess(true);
        }
        return copy;
      });
    },
    [setAcceptedSimShortRows, setErrors, setValidationSuccess]
  );

  const errorsCount = Object.keys(errors).length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: "left" }}>
        Импорт Excel
      </Typography>

      {/* Кнопка загрузки файла */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Button variant="outlined" component="label" disabled={fileLoading}>
          Выбрать файл
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} hidden />
        </Button>
        {fileLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Загрузка файла...
            </Typography>
          </Box>
        )}
        {!fileLoading && rows.length > 0 && (
          <Typography variant="body2" color="success.main">
            ✓ Файл загружен
          </Typography>
        )}
      </Box>

      {/* Ошибка загрузки */}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка при загрузке файла: {loadError}
        </Alert>
      )}

      {/* Кнопка проверки */}
      {rows.length > 0 && !validationSuccess && errorsCount === 0 && (
        <Box sx={{ mb: 2, textAlign: "left" }}>
          <Button variant="outlined" onClick={validateAllWithOverrides} size="large">
            Проверить данные
          </Button>
        </Box>
      )}

      {/* Успешная валидация */}
      {validationSuccess && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Проверка пройдена успешно! Все данные корректны. Теперь вы можете экспортировать файл.
          </Alert>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleExport}>
              Экспортировать исправленный Excel
            </Button>
            <Button variant="contained" onClick={() => setEmailDialog(true)} color="primary">
              Отправить на Email
            </Button>
          </Box>
        </Box>
      )}

      {/* Список ошибок */}
      {errorsCount > 0 && (
        <>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Alert severity="error" sx={{ flex: 1 }}>
              Найдено ошибок: {errorsCount} строк(и) из {rows.length}
            </Alert>
            <Button variant="outlined" onClick={validateAllWithOverrides}>
              Проверить повторно
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {rows
              .map((row, ri) => ({ row: { ...row, __rowIndex: ri }, ri }))
              .filter(({ ri }) => {
                if (errors[ri]) return true;
                const touched = touchedFields[ri];
                return touched instanceof Set ? touched.size > 0 : Boolean(touched);
              })
              .map(({ row, ri }) => (
                <ErrorCard
                  key={ri}
                  row={row}
                  rowIndex={ri}
                  headers={headers}
                  errors={errors}
                  touchedFields={touchedFields[ri] || new Set()}
                  getOptionsForField={getOptionsForField}
                  onCellChange={handleCellChange}
                  onAcceptSimShort={handleAcceptSimShort}
                  isSimShortAccepted={acceptedSimShortRows.has(ri)}
                />
              ))}
          </Box>
        </>
      )}

      {/* Диалог email */}
      <EmailDialog
        open={emailDialog}
        onClose={() => setEmailDialog(false)}
        email={email}
        onEmailChange={setEmail}
        onSend={handleSendToEmail}
        sending={emailSending}
      />
    </Box>
  );
};

export default ExcelFormImporter;
