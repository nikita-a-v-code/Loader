import { useState, useCallback, useEffect } from "react";
import ApiService from "../../../services/api";
import { initialFormData } from "./useSingleFormData";

// Хук для управления карточками
const useCardManager = (defaults) => {
  const [cards, setCards] = useState([{ id: Date.now(), formData: { ...initialFormData } }]);

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

  const updateCardFormData = useCallback((cardId, updater) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? { ...card, formData: typeof updater === "function" ? updater(card.formData) : updater }
          : card
      )
    );
  }, []);

  const addNewCard = useCallback(async () => {
    const newCardId = Date.now();

    let objectID = "";

    try {
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
        objectID,
      },
    };

    setCards((prev) => [...prev, newCard]);
  }, [defaults]);

  const copyCard = useCallback(async (cardIndex) => {
    const newCardId = Date.now();

    let newObjectID = "";
    try {
      const response = await ApiService.getNextObjectID();
      newObjectID = response.objectID || "";
    } catch (error) {
      console.error("Ошибка получения objectID:", error);
    }

    setCards((prev) => {
      const cardToCopy = prev[cardIndex];
      const { objectID: oldObjectID, ...restFormData } = cardToCopy.formData;
      const newCard = {
        id: newCardId,
        formData: {
          ...restFormData,
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
          objectID: newObjectID,
        },
      };
      const newCards = [...prev];
      newCards.splice(cardIndex + 1, 0, newCard);
      return newCards;
    });
  }, []);

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
