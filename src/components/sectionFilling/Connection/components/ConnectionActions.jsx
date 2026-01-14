import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

/**
 * Кнопки действий для страницы подключения
 */
const ConnectionActions = ({ onBack, onExport, onSendEmail, allFilled }) => {
  return (
    <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}>
      <Button variant="outlined" onClick={() => typeof onBack === "function" && onBack()}>
        Назад
      </Button>
      <Button variant="contained" onClick={onExport} color="success" disabled={!allFilled}>
        Выгрузить в Excel
      </Button>
      <Button variant="contained" onClick={onSendEmail} color="primary" disabled={!allFilled}>
        Отправить на Email
      </Button>
    </Box>
  );
};

export default ConnectionActions;
