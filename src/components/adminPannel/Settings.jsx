import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Save, Refresh, Add, Edit, Delete } from "@mui/icons-material";
import ApiService from "../../services/api";

const Settings = () => {
  /*
    Менеджер конфигурации API/настроек.
    - Загружает и сохраняет конфигурационные параметры через API.
    - Ошибки отображаются через `ErrorAlert`.
  */
  const [apiUrl, setApiUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [emails, setEmails] = useState([]);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailMessageType, setEmailMessageType] = useState("info");
  const [emailLoading, setEmailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [emailForm, setEmailForm] = useState({ email: "" });

  useEffect(() => {
    loadCurrentConfig();
    loadEmails();
  }, []);

  const loadCurrentConfig = () => {
    // loadCurrentConfig: инициализация текущей конфигурации API (берется из localStorage или .env)
    const savedUrl = localStorage.getItem("REACT_APP_API_URL");
    const current = savedUrl || process.env.REACT_APP_API_URL || "http://localhost:3001";
    setCurrentUrl(current);
    setApiUrl(current);
  };

  const handleSave = () => {
    // handleSave: сохраняет URL API в localStorage и предлагает перезагрузить страницу
    try {
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
    // handleReset: сбрасывает локальную конфигурацию и предлагает перезагрузить страницу
    localStorage.removeItem("REACT_APP_API_URL");
    setMessage("Настройки сброшены! Перезагрузите страницу.");
    setMessageType("info");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const loadEmails = async () => {
    try {
      setEmailLoading(true);
      setEmailMessage("");
      const data = await ApiService.getEmails();
      setEmails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ошибка загрузки emails:", error);
      setEmailMessage("Не удалось загрузить список email");
      setEmailMessageType("error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleAddEmail = () => {
    setEditItem(null);
    setEmailForm({ email: "" });
    setDialogOpen(true);
  };

  const handleEditEmail = (item) => {
    setEditItem(item);
    setEmailForm({ email: item.email });
    setDialogOpen(true);
  };

  const handleSaveEmail = async () => {
    const value = (emailForm.email || "").trim();
    if (!value || !value.includes("@")) {
      setEmailMessage("Введите корректный email");
      setEmailMessageType("error");
      return;
    }

    try {
      setEmailLoading(true);
      if (editItem) {
        await ApiService.updateEmail(editItem.id, { email: value });
      } else {
        await ApiService.createEmail({ email: value });
      }
      setDialogOpen(false);
      await loadEmails();
      setEmailMessage("Email сохранен");
      setEmailMessageType("success");
    } catch (error) {
      console.error("Ошибка сохранения email:", error);
      setEmailMessage("Не удалось сохранить email");
      setEmailMessageType("error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteEmail = async (id) => {
    if (!window.confirm("Удалить этот email?")) return;
    try {
      setEmailLoading(true);
      await ApiService.deleteEmail(id);
      await loadEmails();
    } catch (error) {
      console.error("Ошибка удаления email:", error);
      setEmailMessage("Не удалось удалить email");
      setEmailMessageType("error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSetDefaultEmail = async (id) => {
    try {
      setEmailLoading(true);
      await ApiService.setDefaultEmailById(id);
      await loadEmails();
    } catch (error) {
      console.error("Ошибка установки email по умолчанию:", error);
      setEmailMessage("Не удалось установить email по умолчанию");
      setEmailMessageType("error");
    } finally {
      setEmailLoading(false);
    }
  };

  const defaultEmail = emails.find((e) => e.is_default)?.email || "";

  const testConnection = async () => {
    // testConnection: делает HTTP запрос к указанному API URL и показывает результат
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
        Настройки
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

      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Email по умолчанию для отправок</Typography>
            {defaultEmail && <Chip label={defaultEmail} color="primary" variant="outlined" />}
          </Stack>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddEmail}>
              Добавить email
            </Button>
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadEmails} disabled={emailLoading}>
              Обновить
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>По умолчанию</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emails.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      {item.is_default ? (
                        <Chip label="Используется" color="success" size="small" />
                      ) : (
                        <Button size="small" variant="outlined" onClick={() => handleSetDefaultEmail(item.id)}>
                          Сделать по умолчанию
                        </Button>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleEditEmail(item)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteEmail(item.id)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {emailMessage && (
            <Alert severity={emailMessageType} sx={{ mt: 2 }}>
              {emailMessage}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? "Редактировать email" : "Добавить email"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            fullWidth
            variant="outlined"
            placeholder="example@mail.com"
            value={emailForm.email}
            onChange={(e) => setEmailForm({ email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveEmail} variant="contained" startIcon={<Save />} disabled={emailLoading}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
