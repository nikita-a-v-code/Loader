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

  const {
    mpes,
    rkesOptions,
    muOptions,
    settl,
    str,
    abonentTypes,
    statuses,
    deviceTypes,
    ipAddresses,
    protocols,
    numberTP,
    loadRkesByMpes,
    loadMuByRkes,
    loadStreetsBySettlements,
    addSettlement,
    addNumberTp,
    addStreet,
  } = apiData;

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

  // Расчет итогового коэффициента
  useEffect(() => {
    const ttCoeffNum = parseFloat(formData.ttCoeff) || 1;
    const tnCoeffNum = parseFloat(formData.tnCoeff) || 1;
    const finalCoeff = ttCoeffNum * tnCoeffNum;
    if (formData.finalCoeff !== finalCoeff) {
      setFormData((prev) => ({ ...prev, finalCoeff }));
    }
  }, [formData.ttCoeff, formData.tnCoeff, formData.finalCoeff, setFormData]);

  // Вычисление сетевого адреса
  const getNetworkAddress = useCallback(() => {
    return calculateNetworkAddress(formData.typeDevice, formData.serialNumber);
  }, [formData.typeDevice, formData.serialNumber]);

  // Функция для создания нового населенного пункта
  const createNewSettlement = async (name) => {
    try {
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

  // Функция для создания новой улицы
  const createNewStreet = async (name, settlementName) => {
    const selectedSettlement = settl.find((s) => s.name === settlementName);
    if (!selectedSettlement) return null;

    try {
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

  // Функция для создания новой ТП
  const createNumberTp = async (name) => {
    try {
      const newNumberTp = await ApiService.createNumberTP({ 
        name, 
        userId: user?.id,
        source: "single_filling"
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

  // Проверка обязательных полей
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

  // Получение краткого названия карточки
  const getCardTitle = () => {
    if (formData.consumerName) return formData.consumerName;
    if (formData.settlement && formData.street) return `${formData.settlement}, ${formData.street}`;
    return `Карточка ${cardIndex + 1}`;
  };

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
      {/* Заголовок карточки */}
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
          <Chip
            label={allRequiredFilled ? "Заполнено" : "Не заполнено"}
            color={allRequiredFilled ? "success" : "default"}
            size="small"
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
          <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Box>
      </Box>

      {/* Содержимое карточки */}
      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          <StructureSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            mpes={mpes}
            getRkesOptions={getRkesOptions}
            getMuOptions={getMuOptions}
          />

          <AddressSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            settl={settl}
            getStreetsForSettlement={(settlementName) => getStreetsForSettlement(settlementName, str)}
            createNewSettlement={createNewSettlement}
            createNewStreet={createNewStreet}
            validationErrors={validationErrors}
          />

          <ConsumerSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            abonentTypes={abonentTypes}
            statuses={statuses}
          />

          <NetworkSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            validationErrors={validationErrors}
            errorMessages={errorMessages}
            numberTP={numberTP}
            createNumberTp={createNumberTp}
          />

          <DeviceSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            deviceTypes={deviceTypes}
            validationErrors={validationErrors}
          />

          <TransformSection formData={formData} handleFieldChange={handleFieldChange} />

          <ConnectionSection
            formData={formData}
            handleFieldChange={handleFieldChange}
            ipAddresses={ipAddresses}
            protocols={protocols}
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
