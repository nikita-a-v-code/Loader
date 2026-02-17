import { useState, useCallback, useRef } from "react";
import ApiService from "../../../services/api";
import { initialFormData } from "./useSingleFormData";

// Хук для управления карточками
const useCardManager = (defaults) => {
  const [cards, setCards] = useState([{ id: Date.now(), formData: { ...initialFormData } }]);

  // Применение дефолтных значений к первой карточке
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

  // Обновление formData для конкретной карточки
  const updateCardFormData = useCallback((cardId, updater) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, formData: typeof updater === "function" ? updater(card.formData) : updater }
          : card
      )
    );
  }, []);

  // Добавление новой пустой карточки с дефолтными значениями
  const addNewCard = useCallback(() => {
    const newCardId = Date.now();

    const newCard = {
      id: newCardId,
      formData: {
        ...initialFormData,
        // Применяем дефолтный протокол из справочников
        protocol: defaults.protocol || "",
      },
    };

    setCards((prev) => [...prev, newCard]);
  }, [defaults]);

  // Копирование карточки
  const copyCard = useCallback(
    (cardIndex) => {
      const newCardId = Date.now();

      setCards((prev) => {
        const cardToCopy = prev[cardIndex];
        const newCard = {
          id: newCardId,
          formData: {
            ...cardToCopy.formData,
            serialNumber: "",
            consumerName: cardToCopy.formData.consumerName ? `${cardToCopy.formData.consumerName} ` : "",
            contractNumber: "",
          },
        };
        const newCards = [...prev];
        newCards.splice(cardIndex + 1, 0, newCard);
        return newCards;
      });
    },
    []
  );

  // Удаление карточки
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
