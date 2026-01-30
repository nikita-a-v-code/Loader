import React from "react";
import Box from "@mui/material/Box";
import EnSelect from "../../../../ui/EnSelect/EnSelect";
import CopyButtons from "../../../../ui/Buttons/CopyButtons";
import { useAuth } from "../../../../context/AuthContext";

/**
 * Поля УСПД для точки подключения
 */
const USPDFields = ({ index, connection, pointsCount, onFieldChange, onApplyToAll, onApplyToNext }) => {
  const { isAdmin } = useAuth();
  const showRestrictedFields = isAdmin();

  const fields = [
    { id: "nameUSPD", label: "Наименование УСПД", restricted: false },
    { id: "typeUSPD", label: "Тип УСПД", restricted: false },
    { id: "numberUSPD", label: "Серийный номер УСПД", restricted: false },
    { id: "userUSPD", label: "Пользователь УСПД", restricted: false },
    { id: "passwordUSPD", label: "Пароль УСПД", restricted: true }, // Скрыто для не-админов
  ];

  return (
    <>
      {fields
        .filter((field) => !field.restricted || showRestrictedFields)
        .map((field) => (
          <Box key={field.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <EnSelect
              id={`${field.id}-${index}`}
              label={field.label}
              value={connection[field.id]}
              onChange={(e) => onFieldChange(index, field.id, e.target.value)}
              freeInput={true}
              size="small"
              sx={{ width: 360 }}
            />
            <CopyButtons
              pointsCount={pointsCount}
              index={index}
              fieldValue={connection[field.id]}
              onApplyToAll={() => onApplyToAll(index, field.id)}
              onApplyToNext={() => onApplyToNext(index, field.id)}
              totalPoints={pointsCount}
              arrowDirection="right"
            />
          </Box>
        ))}
    </>
  );
};

export default USPDFields;
