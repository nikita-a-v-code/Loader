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
  Менеджер статусов -> CRUD-интерфейс для статусов счетов.
  - Загружает список статусов (`loadItems`).
  - Открывает диалог добавления/редактирования (`handleAdd`, `handleEdit`).
  - Сохраняет через API (`handleSave`) и удаляет (`handleDelete`).
  - Ошибки сохраняются в `error` и отображаются через `ErrorAlert`.
*/

const StatusesManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // loadItems: запрашивает список статусов у сервера,
    // при успехе обновляет `items`, при ошибке — сохраняет `error`.
    try {
      const data = await ApiService.getStatuses();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading statuses:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: подготовка диалога для создания новой записи
    setEditItem(null);
    setFormData({ name: "" });
    setOpen(true);
  };

  const handleEdit = (item) => {
    // handleEdit: открыть диалог редактирования и заполнить форму
    setEditItem(item);
    setFormData({ name: item.name });
    setOpen(true);
  };

  const handleSave = async () => {
    // handleSave: отправляет create/update запрос в API и обновляет список
    try {
      if (editItem) {
        await ApiService.updateStatus(editItem.id, formData);
      } else {
        await ApiService.createStatus(formData);
      }

      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving status:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: подтверждение и удаление записи через API
    if (window.confirm("Удалить этот статус?")) {
      try {
        await ApiService.deleteStatus(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting status:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Статусы счетов</Typography>
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
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} статус</DialogTitle>
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

export default StatusesManager;
