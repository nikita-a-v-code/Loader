/**
 * SingleFormCard - компонент одной карточки формы
 *
 * Представляет собой карточку с разворачивающимися секциями для заполнения данных о потребителе:
 * Управляет:
 * - Состоянием карточки (развернута/свернута)
 * - Валидацией обязательных полей
 * - Цветовой индикацией состояния (зеленый/серый)
 * - Созданием новых объектов (населенный пункт, улица, ТП)
 * - Обработкой событий копирования/удаления
 */
import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Chip from "@mui/material/Chip";
import { useAuth } from "../../context/AuthContext";
import { calculateNetworkAddress } from "../../utils/networkAdress";
import useSingleFormHandlers from "./hooks/useSingleFormHandlers";
import StructureSection from "./sections/StructureSection";
import AddressSection from "./sections/AddressSection";
import ConsumerSection from "./sections/ConsumerSection";
import NetworkSection from "./sections/NetworkSection";
import DeviceSection from "./sections/DeviceSection";
import TransformSection from "./sections/TransformSection";
import ConnectionSection from "./sections/ConnectionSection";
import ApiService from "../../services/api";

/**
 * Компонент SingleFormCard
 *
 * @param {Object} props - свойства компонента
 * @param {number} props.cardIndex - индекс карточки в массиве
 * @param {Object} props.formData - текущие данные формы
 * @param {Function} props.setFormData - функция для обновления данных формы
 * @param {Function} props.onDelete - callback при удалении карточки
 * @param {Function} props.onCopy - callback при копировании карточки
 * @param {boolean} props.canDelete - можно ли удалить карточку (последнюю нельзя)
 * @param {Object} props.apiData - справочные данные из API
 * @param {Function} props.onSuccessMessage - callback при успешном действии
 */
const SingleFormCard = ({
  cardIndex,
  formData,
  setFormData,
  onDelete,
  onCopy,
  canDelete,
  apiData,
  onSuccessMessage,
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [errorMessages, setErrorMessages] = useState({});

  /**
   * Деструктуризация apiData для доступа к справочникам
   * - mpes, rkesOptions, muOptions: иерархия структуры организации
   * - settl, str: населенные пункты и улицы
   * - deviceTypes: модели счетчиков
   * - protocols: протоколы связи
   * - numberTP: номера трансформаторных подстанций
   * - addSettlement, addStreet, addNumberTp: функции добавления новых элементов
   */
  const {
    mpes,
    rkesOptions,
    muOptions,
    settl,
    str,
    abonentTypes,
    statuses,
    deviceTypes,
    protocols,
    numberTP,
    loadRkesByMpes,
    loadMuByRkes,
    loadStreetsBySettlements,
    addSettlement,
    addNumberTp,
    addStreet,
  } = apiData;

  /**
   * Хук для обработки изменений в форме
   * - validationErrors: объект с ошибками валидации
   * - handleFieldChange: функция для изменения значений полей
   * - getRkesOptions, getMuOptions, getStreetsForSettlement: функции для получения опций
   */
  const { validationErrors, handleFieldChange, getRkesOptions, getMuOptions, getStreetsForSettlement } =
    useSingleFormHandlers({
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
    });

  // ==================== ЭФФЕКТЫ ====================

  /**
   * Автоматический расчет итогового коэффициента (ttCoeff * tnCoeff)
   * Обновляется при изменении коэффициентов ТТ или ТН
   */
  useEffect(() => {
    const ttCoeffNum = parseFloat(formData.ttCoeff) || 1;
    const tnCoeffNum = parseFloat(formData.tnCoeff) || 1;
    const finalCoeff = ttCoeffNum * tnCoeffNum;
    if (formData.finalCoeff !== finalCoeff) {
      setFormData((prev) => ({ ...prev, finalCoeff }));
    }
  }, [formData.ttCoeff, formData.tnCoeff, formData.finalCoeff, setFormData]);

  /**
   * Вычисление сетевого адреса на основе модели счетчика и серийного номера
   * Используется в секции соединения для автоматической подстановки
   */
  const getNetworkAddress = useCallback(() => {
    return calculateNetworkAddress(formData.typeDevice, formData.serialNumber);
  }, [formData.typeDevice, formData.serialNumber]);

  // ==================== ФУНКЦИИ ДЛЯ СОЗДАНИЯ СПРАОЧНИКОВ ====================

  /**
   * Создание нового населенного пункта
   * @param {string} name - название населенного пункта
   * @returns {Promise<Object>} - созданный объект населенного пункта
   */
  const createNewSettlement = async (name) => {
    try {
      // Отправляем запрос на создание с указанием пользователя (для аудита)
      const newSettlement = await ApiService.createSettlement({ name, userId: user?.id });
      addSettlement(newSettlement);
      onSuccessMessage(`Населенный пункт "${name}" успешно создан, выберите его из списка`);
      return newSettlement;
    } catch (err) {
      if (err.message.includes("409")) {
        throw new Error("Населенный пункт уже существует");
      }
      console.error("Error creating settlement:", err);
      throw err;
    }
  };

  /**
   * Создание новой улицы в населенном пункте
   * @param {string} name - название улицы
   * @param {string} settlementName - название населенного пункта
   * @returns {Promise<Object>} - созданный объект улицы
   */
  const createNewStreet = async (name, settlementName) => {
    // Прверяем, выбран ли населенный пункт для новой улицы, чтобы не улетел пустой запрос на сервер
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement) return null;

    try {
      // Отправляем запрос на создание улицы с указанием ID населенного пункта и пользователя
      const newStreet = await ApiService.createStreet({ name, settlement_id: selectedSettlement.id, userId: user?.id });
      addStreet(selectedSettlement.id, newStreet);
      onSuccessMessage(`Улица "${name}" успешно создана, выберите ее из списка`);
      return newStreet;
    } catch (err) {
      if (err.message.includes("409")) {
        throw new Error("Улица уже существует в этом населенном пункте");
      }
      console.error("Error creating street:", err);
      throw err;
    }
  };

  /**
   * Создание новой трансформаторной подстанции
   * @param {string} name - название ТП
   * @returns {Promise<Object>} - созданный объект ТП
   */
  const createNumberTp = async (name) => {
    try {
      // Отправляем запрос на создание с указанием пользователя и источника (single_filling)
      const newNumberTp = await ApiService.createNumberTP({
        name,
        userId: user?.id,
        source: "single_filling",
      });
      addNumberTp(newNumberTp);
      onSuccessMessage(`Трансформаторная подстанция "${name}" успешно создана, выберите ее из списка`);
      return newNumberTp;
    } catch (err) {
      if (err.message.includes("409")) {
        throw new Error("Трансформаторная подстанция уже существует");
      }
      console.error("Error creating number TP:", err);
      throw err;
    }
  };

  // ==================== ВАЛИДАЦИЯ ====================

  /**
   * Проверка заполненности всех обязательных полей в карточке
   *
   * Обязательные поля:
   * - Структура: s1, s2, s3
   * - Адрес: settlement, street
   * - Потребитель: consumerName, subscriberType, accountStatus
   * - Прибор учета: typeDevice, serialNumber, password
   * - Сетевой код: transformerSubstationNumber
   * - Коэффициенты: ttCoeff, tnCoeff
   * - Соединение: ipAddress, protocol, simCardShort or simCardFull,
   *
   * @returns {boolean} - true если все поля заполнены
   */
  const checkRequiredFields = () => {
    const required = [
      formData.s1,
      formData.s2,
      formData.s3,
      formData.settlement,
      formData.street,
      formData.consumerName,
      formData.subscriberType,
      formData.accountStatus,
      formData.typeDevice,
      formData.serialNumber,
      formData.password,
      formData.transformerSubstationNumber,
      formData.ttCoeff,
      formData.tnCoeff,
      formData.ipAddress,
      formData.simCardShort || formData.simCardFull,
      formData.protocol,
    ];
    return required.every((field) => field && field.toString().trim() !== "");
  };

  const allRequiredFilled = checkRequiredFields();

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  /**
   * Получение краткого названия карточки для заголовка
   * Приоритет:
   * 1. Название потребителя (если заполнено)
   * 2. Адрес (населенный пункт, улица)
   * 3. Номер карточки (по умолчанию)
   *
   * @returns {string} - краткое название карточки
   */
  const getCardTitle = () => {
    if (formData.consumerName) return formData.consumerName;
    if (formData.settlement && formData.street) return `${formData.settlement}, ${formData.street}`;
    return `Карточка ${cardIndex + 1}`;
  };

  // ==================== РЕНДЕРИНГ ====================

  return (
    <Box
      sx={{
        mb: 2,
        border: 2,
        borderColor: allRequiredFilled ? "success.main" : "grey.300",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* ===== ЗАГОЛОВОК КАРТОЧКИ ===== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          bgcolor: allRequiredFilled ? "success.light" : "grey.100",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {getCardTitle()}
          </Typography>
          {/* 
            Chip показывает статус заполнения
            - Зеленый "Заполнено" если все обязательные поля заполнены
            - Серый "Не заполнено" если есть пустые поля
          */}
          <Chip
            label={allRequiredFilled ? "Заполнено" : "Не заполнено"}
            color={allRequiredFilled ? "success" : "default"}
            size="small"
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* Кнопка копирования карточки */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            title="Копировать карточку"
            size="small"
          >
            <ContentCopyIcon />
          </IconButton>
          {/* Кнопка удаления карточки (если не последняя) */}
          {canDelete && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Удалить карточку"
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
          {/* Кнопка разворачивания/сворачивания карточки */}
          <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Box>
      </Box>

      {/* ===== СОДЕРЖИМОЕ КАРТОЧКИ ===== */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          {/* Секция структуры организации */}
          <StructureSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            mpes={mpes}
            getRkesOptions={getRkesOptions}
            getMuOptions={getMuOptions}
          />

          {/* Секция адреса */}
          <AddressSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            settl={settl}
            getStreetsForSettlement={(settlementName) => getStreetsForSettlement(settlementName, str)}
            createNewSettlement={createNewSettlement}
            createNewStreet={createNewStreet}
            validationErrors={validationErrors}
          />

          {/* Секция потребителя */}
          <ConsumerSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            abonentTypes={abonentTypes}
            statuses={statuses}
          />

          {/* Секция сетевого кода */}
          <NetworkSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            validationErrors={validationErrors}
            errorMessages={errorMessages}
            numberTP={numberTP}
            createNumberTp={createNumberTp}
          />

          {/* Секция прибора учета (счетчик) */}
          <DeviceSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            deviceTypes={deviceTypes}
            validationErrors={validationErrors}
          />

          {/* Секция трансформаторов */}
          <TransformSection formData={formData} handleFieldChange={handleFieldChange} />

          {/* Секция соединения */}
          <ConnectionSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            protocols={protocols}
            deviceTypes={deviceTypes}
            getNetworkAddress={getNetworkAddress}
            validationErrors={validationErrors}
            errorMessages={errorMessages}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default SingleFormCard;
