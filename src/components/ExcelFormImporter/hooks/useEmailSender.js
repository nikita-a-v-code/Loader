import { useState, useCallback, useRef, useEffect } from "react";
import ApiService from "../../../services/api";

/**
 * Хук для управления отправкой email.
 */
const useEmailSender = (rows, validateAllWithOverrides, processData) => {
  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });

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

  const handleSendToEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }

    const validation = await validateAllWithOverrides();
    if (Object.keys(validation).length > 0) {
      alert("Есть ошибки в данных. Исправьте их перед отправкой.");
      return;
    }

    try {
      setEmailSending(true);
      const processedData = await processData(rows);
      setEmailMessage({ text: "", type: "success" });
      await ApiService.sendExcelToEmail(processedData, email);
      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
    }
  }, [email, rows, validateAllWithOverrides, processData]);

  const openDialog = useCallback(() => setEmailDialog(true), []);
  const closeDialog = useCallback(() => setEmailDialog(false), []);
  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setEmailMessage({ text: "", type: "success" });
  }, []);

  return {
    emailDialog,
    email,
    emailSending,
    emailMessage,
    openDialog,
    closeDialog,
    handleEmailChange,
    handleSendToEmail,
  };
};

export default useEmailSender;
