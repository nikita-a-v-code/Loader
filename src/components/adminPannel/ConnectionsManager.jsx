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
  Менеджер соединений -> CRUD для конфигураций соединений.
  - Загружает список соединений, позволяет добавлять/редактировать/удалять.
  - При ошибках показывает `ErrorAlert` и сохраняет ошибку в `error`.
*/

const IpAddressesManager = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ address: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    // loadItems: загружает список IP адресов/соединений с сервера
    try {
      const data = await ApiService.getIpAddresses();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error("Error loading IP addresses:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: подготовка диалога для добавления нового IP адреса
    setEditItem(null);
    setFormData({ address: "" });
    setOpen(true);
  };

  const handleEdit = (item) => {
    // handleEdit: открыть диалог редактирования и заполнить форму
    setEditItem(item);
    setFormData({ address: item.address });
    setOpen(true);
  };

  const handleSave = async () => {
    // handleSave: отправляет сохранение IP адреса на сервер и обновляет список
    try {
      if (editItem) {
        await ApiService.updateIpAddress(editItem.id, formData);
      } else {
        await ApiService.createIpAddress(formData);
      }

      loadItems();
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving IP address:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: подтверждение удаления и вызов API для удаления
    if (window.confirm("Удалить этот IP адрес?")) {
      try {
        await ApiService.deleteIpAddress(id);
        loadItems();
      } catch (err) {
        console.error("Error deleting IP address:", err);
        setError(err);
      }
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadItems} title="Ошибка загрузки данных из базы" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">IP адреса</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Добавить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>IP адрес</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.address}</TableCell>
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
        <DialogTitle>{editItem ? "Редактировать" : "Добавить"} IP адрес</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="IP адрес"
            fullWidth
            variant="outlined"
            placeholder="192.168.1.1"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

export default IpAddressesManager;
