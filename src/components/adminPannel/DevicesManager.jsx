import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
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
  TextField,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import ApiService from "../../services/api";
import ErrorAlert from "../../ui/ErrorAlert";

/*
  Менеджер типов приборов/устройств.
  - Загружает устройства, открывает диалог для CRUD операций.
  - Ошибки сохраняются в `error` и отображаются пользователю.
*/

const DeviceTypesManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", password: "", requests: "", adv_settings: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // loadItems: загружает список моделей счетчиков/устройств с сервера
    try {
      const data = await ApiService.getDevices();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading device types:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: подготовка формы для добавления новой модели
    setEditItem(null);
    setFormData({ name: "", password: "", requests: "", adv_settings: "" });
    setOpen(true);
  };

  const handleEdit = (item) => {
    // handleEdit: открыть форму редактирования и заполнить данными
    setEditItem(item);
    setFormData({ name: item.name, password: item.password, requests: item.requests || "", adv_settings: item.adv_settings || "" });
    setOpen(true);
  };

  const handleSave = async () => {
    // handleSave: отправляет create/update и обновляет список моделей
    try {
      if (editItem) {
        await ApiService.updateDevice(editItem.id, formData);
      } else {
        await ApiService.createDevice(formData);
      }

      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving device type:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: подтверждение и удаление модели по id
    if (window.confirm("Удалить эту модель счетчика?")) {
      try {
        await ApiService.deleteDevice(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting device type:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Модели счетчиков</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Добавить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Модель</TableCell>
              <TableCell>Пароль</TableCell>
              <TableCell>Запросы</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>Доп. параметры</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.password}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.requests}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.adv_settings}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(item)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(item.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} модель счетчика</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Модель"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Пароль"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Запросы"
            fullWidth
            variant="outlined"
            value={formData.requests}
            onChange={(e) => setFormData({ ...formData, requests: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Дополнительные параметры"
            fullWidth
            variant="outlined"
            value={formData.adv_settings}
            onChange={(e) => setFormData({ ...formData, adv_settings: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceTypesManager;
