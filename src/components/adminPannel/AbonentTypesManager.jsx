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
  Компонент для управления типами абонентов (CRUD):
  - Загружает список типов из API (`loadItems`).
  - Открывает диалог добавления/редактирования (`handleAdd`, `handleEdit`).
  - Сохраняет изменения через API (`handleSave`) и обновляет список.
  - Удаляет запись через API (`handleDelete`) с подтверждением пользователя.
  - При ошибках сохраняет состояние ошибки в `error` и отображает `ErrorAlert`.
*/

const AbonentTypesManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // loadItems: Запрашивает текущий список типов абонентов у сервера
    // - При успешном ответе обновляет `items` и сбрасывает `error`.
    // - При ошибке фиксирует `error` для отображения через `ErrorAlert`.
    try {
      const data = await ApiService.getAbonentTypes();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading abonent types:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: Подготавливает диалог для создания новой записи
    setEditItem(null);
    setFormData({ name: "" });
    setOpen(true);
  };

  const handleEdit = (item) => {
    // handleEdit: Открывает диалог редактирования и заполняет форму значениями
    setEditItem(item);
    setFormData({ name: item.name });
    setOpen(true);
  };

  const handleSave = async () => {
    // handleSave: Отправляет create/update запрос в API.
    // После успешного сохранения обновляет список и закрывает диалог.
    try {
      if (editItem) {
        await ApiService.updateAbonentType(editItem.id, formData);
      } else {
        await ApiService.createAbonentType(formData);
      }

      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving abonent type:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: Запрашивает подтверждение и удаляет запись через API.
    // После удаления обновляет список; при ошибке сохраняет `error`.
    if (window.confirm("Удалить этот тип абонента?")) {
      try {
        await ApiService.deleteAbonentType(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting abonent type:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Типы абонентов</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Добавить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
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
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} тип абонента</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

export default AbonentTypesManager;
