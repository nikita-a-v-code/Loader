import { useState, useEffect, useCallback } from "react";
import ApiService from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";

/**
 * Хук для управления отправкой на email
 */
const useEmailSender = ({ exportDataWithPort, assignPortsToConnections, portsAssigned }) => {
  const { user } = useAuth();
  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });

  // Загрузка дефолтного email
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
   * Открыть диалог
   */
  const openDialog = useCallback(() => {
    setEmailDialog(true);
  }, []);

  /**
   * Закрыть диалог
   */
  const closeDialog = useCallback(() => {
    setEmailDialog(false);
  }, []);

  /**
   * Изменение email
   */
  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    setEmailMessage({ text: "", type: "success" });
  }, []);

  /**
   * Отправка на email
   */
  const handleSendToEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }

    try {
      setEmailSending(true);
      await assignPortsToConnections();
      setEmailMessage({ text: "", type: "success" });
      await ApiService.sendExcelToEmail(exportDataWithPort, email, user?.id, "section_filling");
      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
    }
  }, [email, exportDataWithPort, assignPortsToConnections]);

  /**
   * Экспорт в Excel
   */
  const handleExportToExcel = useCallback(async (exportData) => {
    try {
      await ApiService.exportToExcel(exportData);
    } catch (error) {
      console.error("Ошибка при выгрузке в Excel:", error);
      alert("Ошибка при создании Excel файла");
    }
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
    handleExportToExcel,
  };
};

export default useEmailSender;
