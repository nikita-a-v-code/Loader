/**
 * useSingleFormHandlers - хук для обработки изменений полей формы
 * 
 * Основные функции:
 * 1. handleFieldChange - обработка изменения любого поля формы
 *    - Валидация полей (цифры, дата, серийный номер и т.д.)
 *    - Автокоррекция networkCode
 *    - Автоматическое заполнение полей при выборе typeDevice
 *    - Очистка зависимых полей при изменении родительских полей (s1, s2, settlement)
 * 2. getRkesOptions - получение списка РКЭС для выбранного МПЭС
 * 3. getMuOptions - получение списка МУ для выбранного РКЭС
 * 4. getStreetsForSettlement - получение списка улиц для выбранного населенного пункта
 * 
 * Валидируемые поля:
 * - networkCode: сетевой код ПС (с автокоррекцией)
 * - apartment: только цифры
 * - building: только заглавные буквы
 * - verificationInterval: максимум 2 цифры
 * - serialNumber: серийный номер счетчика
 * - dateInstallation, verificationDate: дата формата ДД.ММ.ГГГГ
 * - simCardFull: SIM-карта (полный номер)
 * - simCardShort: SIM-карта (короткий номер)
 * - communicatorNumber: номер коммуникатора
 * 
 * Автоматическое заполнение при выборе typeDevice:
 * - password: пароль модели счетчика
 * - requests: основные запросы
 * - advSettings: дополнительные настройки
 * - ipAddress: IP-адрес
 */
import { useCallback } from "react";
import { useValidationErrors, validators } from "../../../utils/Validation/Validation";
import { formatNetworkCode, validateNetworkCode } from "../../../utils/networkCodeValidation";

/**
 * Хук для обработчиков полей формы
 * @param {Object} params - параметры хука
 * @param {Object} params.formData - текущие данные формы
 * @param {Function} params.setFormData - функция для обновления данных формы
 * @param {Array} params.mpes - массив МПЭС
 * @param {Object} params.rkesOptions - объект РКЭС по МПЭС
 * @param {Object} params.muOptions - объект МУ по РКЭС
 * @param {Array} params.settl - массив населенных пунктов
 * @param {Array} params.deviceTypes - массив моделей счетчиков
 * @param {Function} params.loadRkesByMpes - функция ленивой загрузки РКЭС
 * @param {Function} params.loadMuByRkes - функция ленивой загрузки МУ
 * @param {Function} params.loadStreetsBySettlements - функция ленивой загрузки улиц
 * @param {Object} params.errorMessages - объект с сообщениями об ошибках
 * @param {Function} params.setErrorMessages - функция для обновления ошибок
 * @returns {Object} - объект с методами и данными
 */
const useSingleFormHandlers = ({
  formData,
  setFormData,
  mpes,
  rkesOptions,
  muOptions,
  settl,
  deviceTypes,
  loadRkesByMpes,
  loadMuByRkes,
  loadStreetsBySettlements,
  errorMessages,
  setErrorMessages,
}) => {
  // Деструктуризация хука валидации
  const {
    errors: validationErrors,
    showError,
    clearError,
    validateField,
    validateAndFormatDateField,
  } = useValidationErrors();

  /**
   * Обработка изменения любого поля формы
   * 
   * Логика обработки:
   * 1. Для networkCode: валидация + автокоррекция
   * 2. Для специальных полей: отдельные валидации (apartment, building, verificationInterval и т.д.)
   * 3. Для дат: форматирование в ДД.ММ.ГГГГ
   * 4. Для typeDevice: автоматическое заполнение полей из модели
   * 5. Для родительских полей (s1, s2, settlement): очистка зависимых полей + ленивая загрузка
   * 6. Для остальных полей: простое обновление состояния
   * 
   * @param {string} fieldName - имя поля
   * @param {string} value - новое значение
   */
  const handleFieldChange = useCallback(
    (fieldName, value) => {
      const errorKey = fieldName;

      // ==================== ВАЛИДАЦИЯ networkCode ====================
      // Валидация ПЕРЕД обновлением состояния
      if (fieldName === "networkCode") {
        const validation = validateNetworkCode(value);

        if (!validation.valid) {
          // Ошибка валидации - показываем и не обновляем поле (или обновляем исправленным)
          setErrorMessages((prev) => ({ ...prev, [errorKey]: validation.message }));
          showError(errorKey);

          // Автокоррекция для неверного кода ПС
          if (validation.shouldCorrect) {
            const correctedFormatted = formatNetworkCode(validation.correctedValue);
            setFormData((prev) => ({ ...prev, [fieldName]: correctedFormatted }));
          }
          return;
        }

        // Валидный код - форматируем и обновляем
        const formattedValue = formatNetworkCode(value);
        setFormData((prev) => ({ ...prev, [fieldName]: formattedValue }));
        clearError(errorKey);
        return;
      }

      // ==================== ВАЛИДАЦИЯ ПОЛЕЙ ====================

      // apartment: только цифры
      if (fieldName === "apartment") {
        if (!validateField(value, validators.digits, errorKey)) return;
      }

      // building: только заглавные буквы
      if (fieldName === "building") {
        if (!validateField(value, validators.uppercaseLetters, errorKey)) return;
      }

      // verificationInterval: максимум 2 цифры
      if (fieldName === "verificationInterval") {
        if (!validateField(value, validators.twoDigits, errorKey)) return;
      }

      // serialNumber: серийный номер счетчика
      if (fieldName === "serialNumber") {
        if (!validateField(value, validators.serialNumber, errorKey)) return;
      }

      // dateInstallation, verificationDate: дата формата ДД.ММ.ГГГГ
      if (fieldName === "dateInstallation" || fieldName === "verificationDate") {
        const currentValue = formData[fieldName] || "";
        const formattedValue = validateAndFormatDateField(value, currentValue, errorKey);
        if (formattedValue === null) return;
        value = formattedValue;
      }

      // simCardFull: SIM-карта (полный номер)
      if (fieldName === "simCardFull") {
        if (!validateField(value, validators.simCardFull, errorKey)) return;
      }

      // simCardShort: SIM-карта (короткий номер)
      if (fieldName === "simCardShort") {
        if (!validateField(value, validators.simCardShort, errorKey)) return;
      }

      // communicatorNumber: номер коммуникатора
      if (fieldName === "communicatorNumber") {
        if (!validateField(value, validators.communicatorNumber, errorKey)) return;
      }

      // ==================== СПЕЦИАЛЬНАЯ ОБРАБОТКА typeDevice ====================
      // При выборе модели счетчика автоматически заполняем связанные поля
      if (fieldName === "typeDevice") {
        const selectedDevice = deviceTypes.find((device) => device.name === value);
        setFormData((prev) => ({
          ...prev,
          typeDevice: value,
          password: selectedDevice?.password || prev.password,
          requests: selectedDevice?.requests || "",
          advSettings: selectedDevice?.adv_settings || "",
          ipAddress: selectedDevice?.ip_address || "",
        }));
        return;
      }

      // ==================== ОБНОВЛЕНИЕ СОСТОЯНИЯ ====================
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // ==================== ЛОГИКА ЗАВИСИМЫХ ПОЛЕЙ ====================

      // При изменении МПЭС (s1): очищаем РКЭС и МУ, загружаем РКЭС
      if (fieldName === "s1") {
        setFormData((prev) => ({ ...prev, s2: "", s3: "" }));
        const selectedMpes = mpes.find((m) => m.name === value);
        if (selectedMpes) {
          loadRkesByMpes(selectedMpes.id);
        }
      }

      // При изменении РКЭС (s2): очищаем МУ, загружаем МУ
      if (fieldName === "s2") {
        setFormData((prev) => ({ ...prev, s3: "" }));
        const selectedMpes = mpes.find((m) => m.name === formData.s1);
        if (selectedMpes) {
          const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === value);
          if (selectedRkes) {
            loadMuByRkes(selectedRkes.id);
          }
        }
      }

      // При изменении населенного пункта (settlement): очищаем улицу, загружаем улицы
      if (fieldName === "settlement") {
        setFormData((prev) => ({ ...prev, street: "" }));
        const selectedSettlement = settl.find((s) => s.name === value);
        if (selectedSettlement) {
          loadStreetsBySettlements(selectedSettlement.id);
        }
      }
    },
    [
      formData,
      mpes,
      rkesOptions,
      settl,
      deviceTypes,
      setFormData,
      setErrorMessages,
      showError,
      clearError,
      validateField,
      validateAndFormatDateField,
      loadRkesByMpes,
      loadMuByRkes,
      loadStreetsBySettlements,
    ]
  );

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  /**
   * Получение списка РКЭС для выбранного МПЭС
   * 
   * @returns {Array} - массив названий РКЭС
   */
  const getRkesOptions = useCallback(() => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes || !rkesOptions[selectedMpes.id]) return [];
    return rkesOptions[selectedMpes.id].map((r) => r.name);
  }, [mpes, rkesOptions, formData.s1]);

  /**
   * Получение списка МУ для выбранного РКЭС
   * 
   * @returns {Array} - массив названий МУ
   */
  const getMuOptions = useCallback(() => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes) return [];
    const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === formData.s2);
    if (!selectedRkes || !muOptions[selectedRkes.id]) return [];
    return muOptions[selectedRkes.id].map((mu) => mu.name);
  }, [mpes, rkesOptions, muOptions, formData.s1, formData.s2]);

  /**
   * Получение списка улиц для выбранного населенного пункта
   * 
   * @param {string} settlementName - название населенного пункта
   * @param {Object} str - объект улиц по населенным пунктам
   * @returns {Array} - массив названий улиц
   */
  const getStreetsForSettlement = useCallback(
    (settlementName, str) => {
      if (!settlementName) return [];
      const selectedSettlement = settl.find((s) => s.name === settlementName);
      if (!selectedSettlement || !str[selectedSettlement.id]) return [];
      return str[selectedSettlement.id].map((street) => street.name);
    },
    [settl]
  );

  return {
    validationErrors,
    handleFieldChange,
    getRkesOptions,
    getMuOptions,
    getStreetsForSettlement,
  };
};

export default useSingleFormHandlers;
