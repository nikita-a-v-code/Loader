/**
 * SingleForm - основной компонент для единичного заполнения карточек потребителей
 *
 * ОСНОВНЫЕ ОПЕРАЦИИ:
 * 1. Создание новых карточек с автоматическим присвоением уникального идентификатора из БД
 * 2. Копирование карточек с генерацией нового уникального идентификатора
 * 3. Экспорт всех заполненных карточек в Excel файл
 * 4. Отправка Excel файлов на email
 *
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * - Автоматическое получение уникального идентификатора для каждой карточки при создании/копировании
 * - Режим KE: создание двух файлов (основной + КЭ-версия)
 * - Валидация обязательных полей перед экспортом
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
import ApiService from "../../services/api";
import useSingleFormData from "./hooks/useSingleFormData";
import useCardManager from "./hooks/useCardManager";
import {
  checkAllCardsRequiredFields,
  countFilledCards,
  exportCardsToExcel,
  sendCardsToEmail,
} from "./hooks/useExportUtils";
import SingleFormCard from "./SingleFormCard";

/**
 * Компонент SingleForm
 *
 * Управляет:
 * - Коллекцией карточек (cards)
 * - Состоянием UI (emailDialog, emailSending и т.д.)
 * - Данными из API (справочники, дефолтные значения)
 * - Обработкой событий (экспорт, отправка email)
 */
const SingleForm = () => {
  // ==================== ХУКИ И КОНТЕКСТ ====================

  /**
   * Получаем текущего пользователя из контекста авторизации.
   * Используется для определения роли (админ/пользователь) при экспорте.
   * userId передается в функции отправки Excel для аудита.
   */
  const { user } = useAuth();

  /**
   * Хук для загрузки справочных данных из API:
   * - mpes, rkes, mu: иерархия структуры организации
   * - settl, str: населенные пункты и улицы
   * - deviceTypes: модели счетчиков с параметрами (requests_ke и т.д.)
   * - protocols: доступные протоколы связи
   * - defaults: дефолтные значения для новых карточек
   */
  const apiData = useSingleFormData();
  const { loading, error, mpes, rkesOptions, muOptions, defaults, defaultEmail, loadAllData } = apiData;

  /**
   * Хук для управления карточками:
   * - cards: массив карточек [{id, formData}, ...]
   * - addNewCard: создать новую карточку с автоматически присвоенным уникальным идентификатором
   * - copyCard: скопировать карточку с новым автоматически присвоенным уникальным идентификатором
   * - deleteCard: удалить карточку
   * - updateCardFormData: обновить данные конкретной карточки
   * - applyDefaults: применить дефолтные значения к первой карточке
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

  /** Флаг включенности режима KE (создание двух файлов: основной + КЭ-версия) */
  const [keFileModeEnabled, setKeFileModeEnabled] = useState(false);

  // ==================== ЭФФЕКТЫ ИНИЦИАЛИЗАЦИИ ====================

  /**
   * При загрузке данных из API:
   * 1. Применяем дефолтные значения (IP, протокол) к первой карточке
   * 2. Выполняется только один раз при монтировании компонента
   */
  useEffect(() => {
    if (!loading) {
      applyDefaults();
    }
  }, [loading, applyDefaults]);

  /**
   * Устанавливаем дефолтный email из настроек, когда он загрузится.
   * Используется в диалоге отправки на email.
   */
  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  /**
   * Загружаем параметр keFileModeEnabled из приложения при инициализации.
   * Определяет, будут ли создаваться два файла (основной и КЭ-версия) при экспорте.
   */
  useEffect(() => {
    const loadKeFileMode = async () => {
      try {
        const result = await ApiService.getAppSetting("ke_file_mode_enabled");
        setKeFileModeEnabled(result.value === "true" || result.value === true);
      } catch (error) {
        console.error("Ошибка загрузки параметра ke_file_mode_enabled:", error);
      }
    };
    loadKeFileMode();
  }, []);

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  /**
   * Показывает сообщение об успехе.
   * Используется дочерними компонентами (например, при создании населенного пункта).
   * Теперь уведомление показывается прямо в диалоге создания.
   */
  const handleSuccessMessage = useCallback((message) => {
    console.log("Success:", message);
  }, []);

  /**
   * Экспорт всех карточек в Excel файл.
   *
   * Логика:
   * 1. Собираем данные всех карточек в массив exportData
   * 2. Для админов: включаем порты, сетевые адреса, пароли
   * 3. Для обычных пользователей: только базовые данные
   * 4. Помечаем objectID как использованные в базе данных
   * 5. Если включен режим KE: создаем второй файл
   *
   * Выполняется только если все карточки заполнены (allRequiredFilled === true)
   */
  const handleExport = async () => {
    try {
      const deviceList = apiData.deviceListFull || [];
      await exportCardsToExcel(cards, user, mpes, rkesOptions, muOptions, deviceList, keFileModeEnabled);
    } catch (error) {
      console.error("Ошибка при выгрузке в Excel:", error);
      alert("Ошибка при создании Excel файла");
    }
  };

  /**
   * Отправка Excel файла на указанный email.
   *
   * Логика:
   * 1. Валидируем email (обязательное поле, содержит @)
   * 2. Если валидация не пройдена: показываем ошибку
   * 3. Если валидация пройдена:
   *    - Собираем данные всех карточек в массив exportData
   *    - Помечаем objectID как использованные в базе данных
   *    - Отправляем основной файл через API
   *    - Если включен режим KE: отправляем второй КЭ-файл
   *
   * @param {string} email - email получателя
   */
  const handleSendToEmail = async () => {
    // Валидация email - обязательно поле должно содержать символ @
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }

    try {
      setEmailSending(true);
      setEmailMessage({ text: "", type: "success" });
      const deviceList = apiData.deviceListFull || [];
      // Передаем user?.id в функцию для аудита
      await sendCardsToEmail(cards, email, user?.id, mpes, rkesOptions, muOptions, deviceList, keFileModeEnabled);
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
   * Кнопки экспорта активны только если заполнены все обязательные поля во всех карточках.
   *
   * Используется в:
   * - disabled кнопки "Добавить карточку"
   * - disabled кнопок "Выгрузить в Excel" и "Отправить на Email"
   * - Цветовой индикации (зеленый/серый рамка карточки)
   */
  const allRequiredFilled = checkAllCardsRequiredFields(cards);

  /**
   * Количество полностью заполненных карточек.
   * Отображается в заголовке: "Заполнение карточек (2/3)"
   * Используется для отслеживания прогресса заполнения.
   */
  const filledCardsCount = countFilledCards(cards);

  // ==================== РЕНДЕРИНГ ====================

  // Показываем индикатор загрузки пока грузятся справочники из БД
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
        {/* 
          Кнопка активна только когда все текущие карточки заполнены.
          Предотвращает создание карточек, когда предыдущие не заполнены.
        */}
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
        {/* 
          Кнопка выгрузки в Excel
          Цвет: зеленый если все заполнено, синий если нет
          Активна только когда все карточки заполнены
        */}
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!allRequiredFilled}
          color={allRequiredFilled ? "success" : "primary"}
          size="large"
        >
          Выгрузить в Excel ({cards.length} {cards.length === 1 ? "запись" : "записей"})
        </Button>

        {/* 
          Кнопка отправки на Email
          Цвет: зеленый если все заполнено, синий если нет
          Активна только когда все карточки заполнены
        */}
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

        {/* 
          Диалог ввода email адреса
          Открывается при нажатии на кнопку "Отправить на Email"
        */}
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
