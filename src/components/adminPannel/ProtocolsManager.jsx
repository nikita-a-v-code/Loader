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
  Менеджер протоколов -> CRUD-интерфейс для поддерживаемых протоколов.
  - Загружает список протоколов (`loadItems`).
  - Управляет диалогом добавления/редактирования и удалением.
  - Ошибки отображаются через `ErrorAlert`.
*/

const ProtocolsManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // loadItems: запрашивает список протоколов у сервера и обновляет `items`.
    try {
      const data = await ApiService.getProtocols();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading protocols:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: подготовка диалога для создания нового протокола
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
    // handleSave: отправляет запрос на создание/обновление протокола и обновляет список
    try {
      if (editItem) {
        await ApiService.updateProtocol(editItem.id, formData);
      } else {
        await ApiService.createProtocol(formData);
      }
      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving protocol:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: подтверждение и удаление протокола через API
    if (window.confirm("Удалить этот протокол?")) {
      try {
        await ApiService.deleteProtocol(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting protocol:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Протоколы</Typography>
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
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} протокол</DialogTitle>
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

export default ProtocolsManager;
