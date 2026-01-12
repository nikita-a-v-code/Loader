import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography, Button, Alert, CircularProgress } from "@mui/material";
import ApiService from "../../services/api";
import useExcelData from "./hooks/useExcelData";
import useEmailSender from "./hooks/useEmailSender";
import ErrorCard from "./components/ErrorCard";
import EmailSenderDialog from "../../ui/EmailSenderDialog";
import { parseExcelFile } from "./utils/excelParser";
import {
  NETWORK_CODE_FIELDS,
  SIM_CARD_FIELDS,
  validateNetworkCodeField,
  getSimFieldErrors,
  getTransformerFieldErrors,
  validateSimpleField,
} from "./utils/validationHelpers";

/**
 * Основной компонент импорта Excel файлов.
 * Позволяет загружать Excel файлы, валидировать данные, редактировать ошибки
 * и экспортировать исправленные данные или отправлять на email.
 */
const ExcelFormImporter = () => {
  // === Получаем данные и функции из хука управления Excel данными ===
  const {
    headers, // Заголовки колонок Excel файла
    setHeaders,
    rows, // Массив строк с данными
    setRows,
    errors, // Объект с ошибками валидации {rowIndex: {field: error}}
    setErrors,
    validationSuccess, // Флаг успешной валидации всех данных
    setValidationSuccess,
    touchedFields, // Отслеживание редактированных полей {rowIndex: Set(['field1', 'field2'])}
    setTouchedFields,
    loadStreetsForSettlement, // Загрузка улиц для населенного пункта
    autofillPasswords, // Автозаполнение паролей для счетчиков
    autofillIpAddresses, // Автозаполнение IP адресов
    calculateNetworkAddresses, // Расчет сетевых адресов
    autofillProtocols, // Автозаполнение протоколов
    assignPortsToRows, // Назначение портов строкам
    validateAll, // Полная валидация всех данных
    getOptionsForField, // Получение опций для полей-справочников
  } = useExcelData();

  // === Локальное состояние компонента ===

  // Ошибка загрузки файла
  const [loadError, setLoadError] = useState(null);

  // Флаг загрузки файла
  const [fileLoading, setFileLoading] = useState(false);

  // Флаг, требующий принятия изменений перед финальной валидацией
  const [acceptRequired, setAcceptRequired] = useState(false);

  // === Refs для доступа к актуальным данным в асинхронных колбеках ===
  // Без refs колбеки работали бы со stale closure значениями
  const rowsRef = useRef(rows);
  const touchedFieldsRef = useRef(touchedFields);

  // Синхронизируем refs с актуальными значениями state
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    touchedFieldsRef.current = touchedFields;
  }, [touchedFields]);

  /**
   * Обработчик загрузки Excel файла.
   * Парсит файл, применяет автозаполнения, сбрасывает все состояния.
   */
  const handleFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoadError(null);
      setFileLoading(true);

      try {
        // Парсим Excel файл
        const { headers: hdrs, rows: content } = await parseExcelFile(file);

        // Применяем автозаполнение протоколов
        const processedContent = autofillProtocols(content);

        // Сбрасываем все состояния для нового файла
        setHeaders(hdrs);
        setRows(processedContent);
        setErrors({});
        setValidationSuccess(false);
        setTouchedFields({});
        setAcceptRequired(false);
        e.target.value = ""; // Сбрасываем input для повторной загрузки того же файла
      } catch (err) {
        console.error("Error parsing Excel:", err);
        setLoadError(String(err.message || err));
      } finally {
        setFileLoading(false);
      }
    },
    [autofillProtocols, setHeaders, setRows, setErrors, setValidationSuccess, setTouchedFields]
  );

  /**
   * Валидация всех данных с учетом флага принятия изменений.
   * Используется для проверки данных перед экспортом/отправкой.
   */
  const validateAllWithOverrides = useCallback(async () => {
    const raw = await validateAll(); // Выполняем полную валидацию
    setErrors(raw);
    const hasErrors = Object.keys(raw || {}).length > 0;
    // Успех только если нет ошибок И пользователь принял изменения
    setValidationSuccess(!hasErrors && !acceptRequired);
    return raw;
  }, [validateAll, setErrors, setValidationSuccess, acceptRequired]);

  /**
   * Обработчик изменения ячейки в таблице.
   * Обновляет данные, добавляет поле в touchedFields, выполняет inline валидацию.
   */
  const handleCellChange = useCallback(
    async (ri, field, value) => {
      // Получаем актуальные данные через refs (для асинхронной работы)
      const currentRows = rowsRef.current;
      const currentTouchedFields = touchedFieldsRef.current;

      // Создаем обновленную строку для валидации
      const updatedRow = { ...(currentRows[ri] || {}), [field]: value, __rowIndex: ri };
      const updatedTouchedFields = new Set(currentTouchedFields[ri] || []);
      updatedTouchedFields.add(field); // Добавляем текущее поле в этот Set

      // Обновляем состояние данных
      setRows((prev) => {
        const copy = [...prev];
        copy[ri] = { ...prev[ri], [field]: value };
        return copy;
      });

      // Добавляем поле в touchedFields
      setTouchedFields((prev) => {
        const rowTouched = new Set(prev[ri] || []);
        rowTouched.add(field);
        return { ...prev, [ri]: rowTouched };
      });

      // После любого изменения требуем принятия изменений
      setAcceptRequired(true);

      // === Inline валидация в зависимости от типа поля ===

      if (NETWORK_CODE_FIELDS.includes(field)) {
        // Валидация полей сетевого кода (взаимосвязаны)
        setErrors((prev) => {
          const copy = { ...prev };
          NETWORK_CODE_FIELDS.forEach((nf) => {
            const err = validateNetworkCodeField(nf, updatedRow[nf], updatedRow, updatedTouchedFields);
            if (err) {
              if (!copy[ri]) copy[ri] = {};
              copy[ri][nf] = err;
            } else if (copy[ri]) delete copy[ri][nf];
          });
          if (copy[ri] && Object.keys(copy[ri]).length === 0) delete copy[ri];
          return copy;
        });
      } else if (SIM_CARD_FIELDS.includes(field)) {
        // Валидация полей SIM-карты (короткий/полный номер)
        const simErrors = getSimFieldErrors(updatedRow);
        setErrors((prev) => {
          const copy = { ...prev };
          SIM_CARD_FIELDS.forEach((k) => {
            if (simErrors[k]) {
              if (!copy[ri]) copy[ri] = {};
              copy[ri][k] = simErrors[k];
            } else if (copy[ri]) delete copy[ri][k];
          });
          if (copy[ri] && Object.keys(copy[ri]).length === 0) delete copy[ri];
          return copy;
        });
      } else if (field === "Номер трансформаторной подстанции") {
        // Валидация поля трансформатора
        const tErr = getTransformerFieldErrors(updatedRow);
        setErrors((prev) => {
          const copy = { ...prev };
          if (tErr[field]) {
            if (!copy[ri]) copy[ri] = {};
            copy[ri][field] = tErr[field];
          } else if (copy[ri]) {
            delete copy[ri][field];
            if (Object.keys(copy[ri]).length === 0) delete copy[ri];
          }
          return copy;
        });
      } else {
        // Валидация остальных полей с простыми regex правилами
        const fieldError = validateSimpleField(field, value);
        setErrors((prev) => {
          const copy = { ...prev };
          if (fieldError) {
            if (!copy[ri]) copy[ri] = {};
            copy[ri][field] = fieldError;
          } else if (copy[ri]) {
            delete copy[ri][field];
            if (Object.keys(copy[ri]).length === 0) delete copy[ri];
          }
          return copy;
        });
      }

      // Сбрасываем флаг успешной валидации при любом изменении
      setValidationSuccess(false);

      // Если изменили населенный пункт - загружаем улицы для него
      if (field === "Населенный пункт" && value) await loadStreetsForSettlement(value);
    },
    [loadStreetsForSettlement, setRows, setErrors, setValidationSuccess, setTouchedFields]
  );

  /**
   * Обработчик экспорта данных в Excel.
   * Проверяет валидность перед экспортом.
   */
  const handleExport = useCallback(async () => {
    const validation = await validateAllWithOverrides();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед экспортом.");
      return;
    }
    try {
      await ApiService.exportToExcel(rows);
    } catch (err) {
      console.error("Export error:", err);
      alert("Ошибка при экспорте: " + err.message);
    }
  }, [rows, validateAllWithOverrides]);

  /**
   * Подготовка данных для отправки на email.
   * Выполняет все необходимые автозаполнения и расчеты.
   * Данные полученные в первом processed передаются в следующий и объединяются в один объект
   */
  const processDataForEmail = useCallback(
    async (data) => {
      let processed = calculateNetworkAddresses(data); // Расчет сетевых адресов
      processed = autofillPasswords(processed); // Пароли для счетчиков
      processed = autofillIpAddresses(processed); // IP адреса
      processed = await assignPortsToRows(processed); // Назначение портов
      return processed;
    },
    [calculateNetworkAddresses, autofillPasswords, autofillIpAddresses, assignPortsToRows]
  );

  // === Хук для управления отправкой на email ===
  const {
    emailDialog, // Открыто ли диалоговое окно email
    email, // Email адрес
    emailSending, // Флаг отправки
    emailMessage, // Сообщение результата
    openDialog, // Открыть диалог
    closeDialog, // Закрыть диалог
    handleEmailChange, // Изменение email
    handleSendToEmail, // Отправка на email
  } = useEmailSender(rows, validateAllWithOverrides, processDataForEmail);

  // === Вычисляемые значения для рендера ===

  const errorsCount = Object.keys(errors).length; // Количество строк с ошибками
  const hasRows = rows.length > 0; // Есть ли загруженные данные

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок компонента */}
      <Typography variant="h5" sx={{ mb: 3, textAlign: "left" }}>
        Импорт Excel
      </Typography>

      {/* Секция загрузки файла */}
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
        {!fileLoading && hasRows && (
          <Typography variant="body2" color="success.main">
            ✓ Файл загружен
          </Typography>
        )}
      </Box>

      {/* Сообщение об ошибке загрузки */}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка при загрузке файла: {loadError}
        </Alert>
      )}

      {/* Кнопка проверки данных (показывается когда нет ошибок и не валидировано) */}
      {hasRows && !validationSuccess && errorsCount === 0 && (
        <Box sx={{ mb: 2, textAlign: "left" }}>
          <Button variant="outlined" onClick={validateAllWithOverrides} size="large">
            Проверить данные
          </Button>
        </Box>
      )}

      {/* Успешная валидация - показываем кнопки экспорта */}
      {validationSuccess && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Проверка пройдена успешно! Все данные корректны.
          </Alert>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleExport}>
              Экспортировать исправленный Excel
            </Button>
            <Button variant="contained" onClick={openDialog} color="primary">
              Отправить на Email
            </Button>
          </Box>
        </Box>
      )}

      {/* Карточки с ошибками и редактированием */}
      {(errorsCount > 0 || acceptRequired) && (
        <>
          {/* Алерт с информацией о статусе */}
          <Box sx={{ mb: 2 }}>
            <Alert severity={errorsCount > 0 ? "error" : "info"}>
              {errorsCount > 0
                ? `Найдено ошибок: ${errorsCount} строк(и) из ${rows.length}`
                : "Все ошибки исправлены. Нажмите 'Принять изменения' для продолжения."}
            </Alert>
          </Box>

          {/* Список карточек с ошибками */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {rows
              // Добавляем индекс строки к данным
              .map((row, ri) => ({ row: { ...row, __rowIndex: ri }, ri }))
              // Фильтруем: показываем строки с ошибками ИЛИ с редактированными полями
              .filter(
                ({ ri }) =>
                  errors[ri] || (touchedFields[ri] instanceof Set ? touchedFields[ri].size > 0 : touchedFields[ri])
              )
              // Рендерим карточку для каждой строки
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
                  // Обработчик принятия изменений для всей строки
                  onAcceptAll={async () => {
                    // Сначала сбрасываем флаг принятия
                    setAcceptRequired(false);
                    // Затем проверяем валидацию всех данных
                    const allErrors = await validateAll();
                    setErrors(allErrors);
                    // Если ошибок нет - устанавливаем финальный успех
                    if (Object.keys(allErrors || {}).length === 0) {
                      setValidationSuccess(true);
                    }
                  }}
                  showAcceptButton={acceptRequired} // Показывать кнопку только если нужны изменения
                  hasErrors={Object.keys(errors[ri] || {}).length > 0} // Есть ли ошибки в этой строке
                />
              ))}
          </Box>
        </>
      )}

      {/* Диалоговое окно отправки на email */}
      <EmailSenderDialog
        open={emailDialog}
        onClose={closeDialog}
        email={email}
        onEmailChange={handleEmailChange}
        onSend={handleSendToEmail}
        sending={emailSending}
        message={emailMessage}
      />
    </Box>
  );
};

export default ExcelFormImporter;
