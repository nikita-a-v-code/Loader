/**
 * SingleForm - главный компонент для единичного заполнения данных о потребителях.
 *
 * Функционал:
 * - Поддержка нескольких карточек (можно заполнить сразу несколько потребителей)
 * - Экспорт всех карточек в Excel (каждая карточка = строка в файле)
 * - Отправка Excel файла на email
 * - Копирование карточек с сохранением общих данных (адрес, структура и т.д.)
 *
 * Архитектура:
 * - useSingleFormData: загрузка справочников из API (МПЭС, РКЭС, населенные пункты и т.д.)
 * - useCardManager: управление массивом карточек (добавление, удаление, копирование)
 * - useExportUtils: утилиты для экспорта данных в Excel и отправки на email
 * - SingleFormCard: компонент одной карточки с формой заполнения
 */
import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ErrorAlert from "../../ui/ErrorAlert";
import EmailSenderDialog from "../../ui/EmailSenderDialog";
import { useAuth } from "../../context/AuthContext";
import useSingleFormData from "./hooks/useSingleFormData";
import useCardManager from "./hooks/useCardManager";
import {
  checkAllCardsRequiredFields,
  countFilledCards,
  exportCardsToExcel,
  sendCardsToEmail,
} from "./hooks/useExportUtils";
import SingleFormCard from "./SingleFormCard";

const SingleForm = () => {
  // ==================== ХУКИ И КОНТЕКСТ ====================

  /**
   * Получаем текущего пользователя из контекста авторизации.
   * Используется для определения роли (админ/пользователь) при экспорте.
   */
  const { user } = useAuth();

  /**
   * Хук для загрузки справочных данных из API:
   */
  const apiData = useSingleFormData();
  const { loading, error, mpes, rkesOptions, muOptions, defaults, defaultEmail, loadAllData } = apiData;

  /**
   * Хук для управления карточками:
   * - cards: массив карточек [{id, formData}, ...]
   * - addNewCard: добавить новую карточку (копирует общие данные из последней)
   * - copyCard: скопировать конкретную карточку
   * - deleteCard: удалить карточку
   * - updateCardFormData: обновить данные формы в карточке
   */
  const { cards, applyDefaults, updateCardFormData, addNewCard, copyCard, deleteCard } = useCardManager(defaults);

  // ==================== ЛОКАЛЬНОЕ СОСТОЯНИЕ UI ====================

  /** Сообщение об успешном действии (создание населенного пункта и т.д.) */
  const [successMessage, setSuccessMessage] = useState(null);

  /** Email для отправки Excel файла */
  const [email, setEmail] = useState("");

  /** Флаг открытия диалога ввода email */
  const [emailDialog, setEmailDialog] = useState(false);

  /** Флаг процесса отправки email (для показа спиннера) */
  const [emailSending, setEmailSending] = useState(false);

  /** Сообщение о результате отправки email {text, type: 'success'|'error'} */
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });

  // ==================== ЭФФЕКТЫ ИНИЦИАЛИЗАЦИИ ====================

  /**
   * При загрузке данных из API:
   * 1. Применяем дефолтные значения (IP, протокол) к первой карточке
   */
  useEffect(() => {
    if (!loading) {
      applyDefaults();
    }
  }, [loading, applyDefaults]);

  /**
   * Устанавливаем дефолтный email из настроек, когда он загрузится.
   */
  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  /**
   * Показывает сообщение об успехе.
   * Используется дочерними компонентами (например, при создании населенного пункта).
   * Теперь уведомление показывается прямо в диалоге создания.
   */
  const handleSuccessMessage = useCallback((message) => {
    // Сообщение теперь показывается в диалоге AddNewElement
    console.log("Success:", message);
  }, []);

  /**
   * Экспорт всех карточек в Excel файл.
   * Для админов: включает порты, сетевые адреса, пароли.
   * Для обычных пользователей: только базовые данные.
   */
  const handleExport = async () => {
    try {
      await exportCardsToExcel(cards, user, mpes, rkesOptions, muOptions);
    } catch (error) {
      console.error("Ошибка при выгрузке в Excel:", error);
      alert("Ошибка при создании Excel файла");
    }
  };

  /**
   * Отправка Excel файла на указанный email.
   * Валидирует email перед отправкой.
   */
  const handleSendToEmail = async () => {
    // Простая валидация email
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }

    try {
      setEmailSending(true);
      setEmailMessage({ text: "", type: "success" });
      await sendCardsToEmail(cards, email, user?.id, mpes, rkesOptions, muOptions);
      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке на email:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
    }
  };

  // ==================== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ====================

  /**
   * Проверяем, заполнены ли все обязательные поля во ВСЕХ карточках.
   * Кнопки экспорта активны только если все карточки заполнены.
   */
  const allRequiredFilled = checkAllCardsRequiredFields(cards);

  /**
   * Количество полностью заполненных карточек.
   * Отображается в заголовке: "Заполнение карточек (2/3)"
   */
  const filledCardsCount = countFilledCards(cards);

  // ==================== РЕНДЕРИНГ ====================

  // Показываем индикатор загрузки пока грузятся справочники
  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>Загрузка данных...</Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: "auto" }}>
      {/* Показ ошибки загрузки с кнопкой повтора */}
      {error && <ErrorAlert error={error} onRetry={loadAllData} title="Ошибка загрузки данных из базы" />}

      {/* ===== ШАПКА: заголовок + кнопка добавления карточки ===== */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Заполнение карточек ({filledCardsCount}/{cards.length})
        </Typography>
        {/* Кнопка активна только когда все текущие карточки заполнены */}
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addNewCard} disabled={!allRequiredFilled}>
          Добавить карточку
        </Button>
      </Box>

      {/* ===== СПИСОК КАРТОЧЕК ===== */}
      {cards.map((card, index) => (
        <SingleFormCard
          key={card.id}
          cardIndex={index}
          formData={card.formData}
          setFormData={(updater) => updateCardFormData(card.id, updater)}
          onDelete={() => deleteCard(index)}
          onCopy={() => copyCard(index)}
          canDelete={cards.length > 1} // Нельзя удалить последнюю карточку
          apiData={apiData} // Передаем справочники для выпадающих списков
          onSuccessMessage={handleSuccessMessage}
        />
      ))}

      {/* ===== КНОПКИ ЭКСПОРТА ===== */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}>
        {/* Кнопка выгрузки в Excel */}
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!allRequiredFilled}
          color={allRequiredFilled ? "success" : "primary"}
          size="large"
        >
          Выгрузить в Excel ({cards.length} {cards.length === 1 ? "запись" : "записей"})
        </Button>

        {/* Кнопка отправки на Email */}
        <Button
          variant="contained"
          onClick={() => {
            setEmailDialog(true);
            setEmailMessage({ text: "", type: "success" });
          }}
          color={allRequiredFilled ? "success" : "primary"}
          disabled={!allRequiredFilled}
        >
          Отправить на Email
        </Button>

        {/* Диалог ввода email адреса */}
        <EmailSenderDialog
          open={emailDialog}
          onClose={() => setEmailDialog(false)}
          email={email}
          onEmailChange={(value) => {
            setEmail(value);
            setEmailMessage({ text: "", type: "success" });
          }}
          onSend={handleSendToEmail}
          freeinput={false}
          sending={emailSending}
          message={emailMessage}
        />
      </Box>
    </Box>
  );
};

export default SingleForm;
