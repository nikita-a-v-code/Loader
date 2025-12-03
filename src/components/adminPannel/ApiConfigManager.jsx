import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, Alert, Chip } from "@mui/material";
import { Save, Refresh } from "@mui/icons-material";

const ApiConfigManager = () => {
  const [apiUrl, setApiUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = () => {
    // Получаем актуальный URL (сначала из localStorage, потом из .env)
    const savedUrl = localStorage.getItem("REACT_APP_API_URL");
    const current = savedUrl || process.env.REACT_APP_API_URL || "http://localhost:3001";
    setCurrentUrl(current);
    setApiUrl(current);
  };

  const handleSave = () => {
    try {
      // Сохраняем в localStorage для текущей сессии
      localStorage.setItem("REACT_APP_API_URL", apiUrl);

      setMessage("URL сохранен! Перезагрузите страницу для применения изменений.");
      setMessageType("success");

      // Автоматически перезагружаем через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage("Ошибка при сохранении URL");
      setMessageType("error");
    }
  };

  const handleReset = () => {
    localStorage.removeItem("REACT_APP_API_URL");
    setMessage("Настройки сброшены! Перезагрузите страницу.");
    setMessageType("info");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const testConnection = async () => {
    try {
      setMessage("Проверка соединения...");
      setMessageType("info");

      const response = await fetch(`${apiUrl}/api/db-test`);

      if (response.ok) {
        setMessage("Соединение успешно!");
        setMessageType("success");
      } else {
        setMessage(`Ошибка соединения: ${response.status}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage(`Ошибка соединения: ${error.message}`);
      setMessageType("error");
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Настройки API
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Текущий API URL:
          </Typography>
          <Chip label={currentUrl} color="primary" variant="outlined" sx={{ mb: 3 }} />

          <TextField
            fullWidth
            label="API URL"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3001"
            helperText="Введите базовый URL для API сервера (без /api)"
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!apiUrl || apiUrl === currentUrl}
            >
              Сохранить
            </Button>

            <Button variant="outlined" onClick={testConnection} disabled={!apiUrl}>
              Проверить соединение
            </Button>

            <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} color="warning">
              Сбросить
            </Button>
          </Box>

          {message && (
            <Alert severity={messageType} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApiConfigManager;
