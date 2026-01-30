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
  Менеджер номеров трансформаторных подстанций (ТП) -> CRUD-интерфейс.
  - Загружает список ТП (`loadItems`).
  - Открывает диалог добавления/редактирования (`handleAdd`, `handleEdit`).
  - Сохраняет через API (`handleSave`) и удаляет (`handleDelete`).
  - Ошибки сохраняются в `error` и отображаются через `ErrorAlert`.
  - Валидация: только заглавные буквы, цифры и ровно одно тире.
*/

const NumberTPManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await ApiService.getNumberTP();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading number TP:", err);
      setError(err);
    }
  };

  // Валидация номера ТП
  const validateTPNumber = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return "Название не может быть пустым";

    // Только заглавные буквы, цифры и тире
    if (!/^[A-ZА-Я0-9\-]+$/.test(trimmed)) {
      return "Только заглавные буквы, цифры и тире";
    }

    // Ровно одно тире
    const dashCount = (trimmed.match(/-/g) || []).length;
    if (dashCount !== 1) {
      return "Название должно содержать ровно одно тире";
    }

    // Проверка на дубликат (кроме редактируемого элемента)
    const exists = items.some((item) => {
      if (editItem && item.id === editItem.id) return false;
      return item.name.toUpperCase() === trimmed;
    });
    if (exists) {
      return "Такой номер ТП уже существует";
    }

    return "";
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, name: value });
    setValidationError(validateTPNumber(value));
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: "" });
    setValidationError("");
    setOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({ name: item.name });
    setValidationError("");
    setOpen(true);
  };

  const handleSave = async () => {
    const validation = validateTPNumber(formData.name);
    if (validation) {
      setValidationError(validation);
      return;
    }

    try {
      if (editItem) {
        await ApiService.updateNumberTP(editItem.id, formData);
      } else {
        await ApiService.createNumberTP(formData);
      }

      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving number TP:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить этот номер ТП?")) {
      try {
        await ApiService.deleteNumberTP(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting number TP:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Номера трансформаторных подстанций (ТП)</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Добавить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Номер ТП</TableCell>
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
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} номер ТП</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Номер ТП"
            placeholder="Например: ТП-1, КТП-102"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            error={!!validationError}
            helperText={validationError || "Только заглавные буквы, цифры и одно тире"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={!!validationError || !formData.name.trim()}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NumberTPManager;
