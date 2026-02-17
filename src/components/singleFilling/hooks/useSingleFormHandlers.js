import { useCallback } from "react";
import { useValidationErrors, validators } from "../../../utils/Validation/Validation";
import { formatNetworkCode, validateNetworkCode } from "../../../utils/networkCodeValidation";

// Хук для обработчиков полей формы
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
  const {
    errors: validationErrors,
    showError,
    clearError,
    validateField,
    validateAndFormatDateField,
  } = useValidationErrors();

  const handleFieldChange = useCallback(
    (fieldName, value) => {
      const errorKey = fieldName;

      // Валидация networkCode ПЕРЕД обновлением состояния
      if (fieldName === "networkCode") {
        const validation = validateNetworkCode(value);

        if (!validation.valid) {
          setErrorMessages((prev) => ({ ...prev, [errorKey]: validation.message }));
          showError(errorKey);

          // Автокоррекция для неверного кода ПС
          if (validation.shouldCorrect) {
            const correctedFormatted = formatNetworkCode(validation.correctedValue);
            setFormData((prev) => ({ ...prev, [fieldName]: correctedFormatted }));
          }
          return;
        }

        const formattedValue = formatNetworkCode(value);
        setFormData((prev) => ({ ...prev, [fieldName]: formattedValue }));
        clearError(errorKey);
        return;
      }

      // Валидация полей
      if (fieldName === "house" || fieldName === "apartment") {
        if (!validateField(value, validators.digits, errorKey)) return;
      }

      if (fieldName === "building") {
        if (!validateField(value, validators.uppercaseLetters, errorKey)) return;
      }

      if (fieldName === "verificationInterval") {
        if (!validateField(value, validators.twoDigits, errorKey)) return;
      }

      if (fieldName === "serialNumber") {
        if (!validateField(value, validators.serialNumber, errorKey)) return;
      }

      if (fieldName === "dateInstallation" || fieldName === "verificationDate") {
        const currentValue = formData[fieldName] || "";
        const formattedValue = validateAndFormatDateField(value, currentValue, errorKey);
        if (formattedValue === null) return;
        value = formattedValue;
      }

      if (fieldName === "simCardFull") {
        if (!validateField(value, validators.simCardFull, errorKey)) return;
      }

      if (fieldName === "simCardShort") {
        if (!validateField(value, validators.simCardShort, errorKey)) return;
      }

      if (fieldName === "communicatorNumber") {
        if (!validateField(value, validators.communicatorNumber, errorKey)) return;
      }

      // Специальная обработка для typeDevice - обновляем все связанные поля сразу
      if (fieldName === "typeDevice") {
        const selectedDevice = deviceTypes.find((device) => device.name === value);
        setFormData((prev) => ({ 
          ...prev, 
          typeDevice: value,
          password: selectedDevice?.password || prev.password,
          requests: selectedDevice?.requests || "",
          advSettings: selectedDevice?.adv_settings || "",
          ipAddress: selectedDevice?.ip_address || ""
        }));
        return;
      }

      // Обновляем состояние
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // Специальная логика для зависимых полей
      if (fieldName === "s1") {
        setFormData((prev) => ({ ...prev, s2: "", s3: "" }));
        const selectedMpes = mpes.find((m) => m.name === value);
        if (selectedMpes) {
          loadRkesByMpes(selectedMpes.id);
        }
      }

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

  // Получение списка РКЭС для выбранного МПЭС
  const getRkesOptions = useCallback(() => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes || !rkesOptions[selectedMpes.id]) return [];
    return rkesOptions[selectedMpes.id].map((r) => r.name);
  }, [mpes, rkesOptions, formData.s1]);

  // Получение списка МУ для выбранного РКЭС
  const getMuOptions = useCallback(() => {
    const selectedMpes = mpes.find((m) => m.name === formData.s1);
    if (!selectedMpes) return [];
    const selectedRkes = rkesOptions[selectedMpes.id]?.find((r) => r.name === formData.s2);
    if (!selectedRkes || !muOptions[selectedRkes.id]) return [];
    return muOptions[selectedRkes.id].map((mu) => mu.name);
  }, [mpes, rkesOptions, muOptions, formData.s1, formData.s2]);

  // Получение списка улиц для выбранного населенного пункта
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
