/**
 * useCardManager - хук для управления карточками
 * 
 * Основные функции:
 * 1. Создание новых карточек с автоматическим присвоением objectID
 * 2. Копирование существующих карточек с новым objectID
 * 3. Удаление карточек
 * 4. Обновление данных карточек
 * 5. Применение дефолтных значений
 * 
 * ObjectID:
 * - Получается из БД через API при создании/копировании
 * - Уникален для каждой карточки
 * - Резервируется в БД на 10 минут (reserved_at)
 * - Помечается как is_used при экспорте/отправке email
 * - Виден только администраторам (в DeviceSection)
 */
import { useState, useCallback, useEffect } from "react";
import ApiService from "../../../services/api";
import { initialFormData } from "./useSingleFormData";

/**
 * Хук для управления карточками
 * @param {Object} defaults - дефолтные значения для новых карточек
 * @returns {Object} - объект с методами и данными для управления карточками
 */
const useCardManager = (defaults) => {
  /**
   * Состояние массива карточек
   * Каждая карточка: { id: Date.now(), formData: {...} }
   * При инициализации создается одна пустая карточка
   */
  const [cards, setCards] = useState([{ id: Date.now(), formData: { ...initialFormData } }]);

  // ==================== ЭФФЕКТЫ ====================

  /**
   * При монтировании хука получаем objectID для первой карточки
   * Выполняется только один раз при инициализации
   * 
   * Логика:
   * 1. Получаем objectID из БД (выделяет и резервирует его)
   * 2. Обновляем первую карточку с полученным objectID
   */
  useEffect(() => {
    const initFirstCard = async () => {
      try {
        const response = await ApiService.getNextObjectID();
        if (response.objectID) {
          setCards((prev) =>
            prev.map((card, index) =>
              index === 0 ? { ...card, formData: { ...card.formData, objectID: response.objectID } } : card
            )
          );
        }
      } catch (error) {
        console.error("Ошибка получения objectID:", error);
      }
    };
    initFirstCard();
  }, []);

  // ==================== МЕТОДЫ ====================

  /**
   * Применяет дефолтные значения к первой карточке
   * Обычно используется для установки дефолтного протокола
   * 
   * @param {Object} defaults - объект с дефолтными значениями
   */
  const applyDefaults = useCallback(() => {
    if (defaults.protocol) {
      setCards((prev) =>
        prev.map((card, index) =>
          index === 0
            ? {
                ...card,
                formData: {
                  ...card.formData,
                  protocol: card.formData.protocol || defaults.protocol,
                },
              }
            : card
        )
      );
    }
  }, [defaults]);

  /**
   * Обновляет данные конкретной карточки
   * 
   * @param {number} cardId - ID карточки для обновления
   * @param {Function|Object} updater - функция обновления или объект с новыми данными
   */
  const updateCardFormData = useCallback((cardId, updater) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, formData: typeof updater === "function" ? updater(card.formData) : updater }
          : card
      )
    );
  }, []);

  /**
   * Создает новую карточку с автоматическим присвоением objectID
   * 
   * Логика:
   * 1. Генерируем уникальный ID карточки (Date.now())
   * 2. Получаем следующий свободный objectID из БД
   * 3. Создаем новую карточку с копией initialFormData и полученным objectID
   * 4. Добавляем карточку в массив
   * 
   * @returns {Promise<void>}
   */
  const addNewCard = useCallback(async () => {
    const newCardId = Date.now();

    let objectID = "";

    try {
      // Получаем objectID из БД - этот идентификатор резервируется и не будет выдан другим
      const response = await ApiService.getNextObjectID();
      objectID = response.objectID || "";
    } catch (error) {
      console.error("Ошибка получения objectID:", error);
    }

    const newCard = {
      id: newCardId,
      formData: {
        ...initialFormData,
        // Применяем дефолтный протокол из справочников
        protocol: defaults.protocol || "",
        // Устанавливаем уникальный objectID
        objectID,
      },
    };

    setCards((prev) => [...prev, newCard]);
  }, [defaults]);

  /**
   * Копирует существующую карточку с новым objectID
   * 
   * Логика:
   * 1. Генерируем уникальный ID для новой карточки
   * 2. Получаем следующий свободный objectID из БД
   * 3. Копируем все данные из исходной карточки
   * 4. Очищаем поля, которые не должны копироваться:
   *    - serialNumber, consumerName, contractNumber - уникальные для точки
   *    - simCardShort, simCardFull, communicatorNumber - уникальные для связи
   *    - house, building, apartment - часть адреса
   *    - deliveryPoint, networkCode - уникальные для потребителя
   *    - objectID - обязательно заменяем на новый уникальный
   * 5. Добавляем новую карточку в массив
   * 
   * @param {number} cardIndex - индекс карточки для копирования
   * @returns {Promise<void>}
   */
  const copyCard = useCallback(async (cardIndex) => {
    const newCardId = Date.now();

    let newObjectID = "";
    try {
      // Получаем уникальный objectID для копии
      const response = await ApiService.getNextObjectID();
      newObjectID = response.objectID || "";
    } catch (error) {
      console.error("Ошибка получения objectID:", error);
    }

    setCards((prev) => {
      const cardToCopy = prev[cardIndex];
      // Исключаем objectID из копируемых данных (чтобы он не скопировался)
      const { objectID: oldObjectID, ...restFormData } = cardToCopy.formData;
      const newCard = {
        id: newCardId,
        formData: {
          ...restFormData,
          // Очищаем поля, которые должны быть уникальными для новой точки
          serialNumber: "",
          consumerName: "",
          contractNumber: "",
          simCardShort: "",
          simCardFull: "",
          communicatorNumber: "",
          house: "",
          building: "",
          apartment: "",
          deliveryPoint: "",
          networkCode: "",
          // Устанавливаем новый уникальный objectID
          objectID: newObjectID,
        },
      };
      const newCards = [...prev];
      // Вставляем копию сразу после оригинала
      newCards.splice(cardIndex + 1, 0, newCard);
      return newCards;
    });
  }, []);

  /**
   * Удаляет карточку по индексу
   * 
   * ВАЖНО: Нельзя удалить последнюю карточку (проверяется в SingleFormCard через canDelete)
   * 
   * @param {number} cardIndex - индекс удаляемой карточки
   */
  const deleteCard = useCallback((cardIndex) => {
    setCards((prev) => prev.filter((_, index) => index !== cardIndex));
  }, []);

  return {
    cards,
    applyDefaults,
    updateCardFormData,
    addNewCard,
    copyCard,
    deleteCard,
  };
};

export default useCardManager;
