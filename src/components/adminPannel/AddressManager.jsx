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
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import ApiService from "../../services/api";
import ErrorAlert from "../../ui/ErrorAlert";

/*
  Менеджер адресов (населенные пункты и улицы).
  - Загружает `settlements` и `streets`.
  - Поддерживает выбор населенного пункта и CRUD операций для поселений/улиц.
  - При ошибках отображает `ErrorAlert` и сохраняет ошибку в `error`.
*/

const AddressManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settlements, setSettlements] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedSettlement, setSelectedSettlement] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", settlementId: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettlements();
  }, []);

  useEffect(() => {
    if (selectedSettlement) {
      loadStreetsBySettlement(selectedSettlement);
    } else {
      setStreets([]);
    }
  }, [selectedSettlement]);

  const reloadCurrentData = () => {
    // reloadCurrentData: очищает ошибку и перезагружает settlements и streets (если выбран settlement)
    setError(null);
    loadSettlements();
    if (selectedSettlement) {
      loadStreetsBySettlement(selectedSettlement);
    } else {
      setStreets([]);
    }
  };

  const loadSettlements = async () => {
    // loadSettlements: загружает список населенных пунктов из API
    try {
      const data = await ApiService.getSettlements();
      setSettlements(data);
      setError(null);
    } catch (err) {
      console.error("Error loading settlements:", err);
      setError(err);
    }
  };

  const loadStreetsBySettlement = async (settlementId) => {
    // loadStreetsBySettlement: загружает улицы для заданного settlementId
    if (!settlementId) {
      setStreets([]);
      return;
    }

    try {
      const data = await ApiService.getStreetsBySettlement(settlementId);
      setStreets(data);
      setError(null);
    } catch (err) {
      console.error("Error loading streets:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    // handleAdd: подготовка формы для добавления населенного пункта или улицы
    setEditItem(null);
    setFormData({
      name: "",
      settlementId: tabValue === 1 ? selectedSettlement : "",
    });
    setOpen(true);
  };

  const handleEdit = (item) => {
    // handleEdit: открыть диалог редактирования и заполнить форму из выбранного элемента
    setEditItem(item);
    if (tabValue === 0) {
      setFormData({ name: item.name, settlementId: "" });
    } else {
      setFormData({ name: item.name, settlementId: item.settlement_id || "" });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    // handleSave: сохранить населенный пункт или улицу через API и обновить список
    try {
      if (tabValue === 0) {
        // Населенные пункты
        if (editItem) {
          await ApiService.updateSettlement(editItem.id, { name: formData.name });
        } else {
          await ApiService.createSettlement({ name: formData.name });
        }
        loadSettlements();
      } else {
        // Улицы
        const streetData = {
          name: formData.name,
          settlement_id: formData.settlementId || selectedSettlement,
        };

        console.log("Creating street with data:", streetData);

        if (editItem) {
          await ApiService.updateStreet(editItem.id, streetData);
        } else {
          await ApiService.createStreet(streetData);
        }
        if (selectedSettlement) {
          loadStreetsBySettlement(selectedSettlement);
        }
      }
      setOpen(false);
      setError(null);
    } catch (err) {
      console.error("Error saving:", err);
      setError(err);
    }
  };

  const handleDelete = async (id) => {
    // handleDelete: подтвердить и удалить населенный пункт или улицу через API
    const confirmText = tabValue === 0 ? "населенный пункт" : "улицу";
    if (window.confirm(`Удалить ${confirmText}?`)) {
      try {
        if (tabValue === 0) {
          await ApiService.deleteSettlement(id);
          loadSettlements();
        } else {
          await ApiService.deleteStreet(id);
          if (selectedSettlement) {
            loadStreetsBySettlement(selectedSettlement);
          }
        }
      } catch (err) {
        console.error("Error deleting:", err);
        setError(err);
      }
    }
  };

  const getSettlementName = (settlementId) => {
    const settlement = settlements.find((s) => s.id === settlementId);
    return settlement ? settlement.name : "Не найден";
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={reloadCurrentData} title="Ошибка загрузки данных из базы" />}
      <Typography variant="h6" sx={{ mb: 3 }}>
        Управление адресами
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Населенные пункты" />
        <Tab label="Улицы" />
      </Tabs>

      {tabValue === 1 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Выберите населенный пункт</InputLabel>
            <Select
              value={selectedSettlement}
              onChange={(e) => setSelectedSettlement(e.target.value)}
              label="Выберите населенный пункт"
            >
              {settlements.map((settlement) => (
                <MenuItem key={settlement.id} value={settlement.id}>
                  {settlement.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">{tabValue === 0 ? "Населенные пункты" : "Улицы"}</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
          disabled={tabValue === 1 && !selectedSettlement}
        >
          Добавить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Название</TableCell>
              {tabValue === 1 && <TableCell>Населенный пункт</TableCell>}
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? settlements : streets).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                {tabValue === 1 && <TableCell>{getSettlementName(item.settlement_id)}</TableCell>}
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
        <DialogTitle>
          {editItem ? "Редактировать" : "Добавить"} {tabValue === 0 ? "населенный пункт" : "улицу"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          {tabValue === 1 && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>Населенный пункт</InputLabel>
              <Select
                value={formData.settlementId || selectedSettlement}
                onChange={(e) => setFormData({ ...formData, settlementId: e.target.value })}
                label="Населенный пункт"
              >
                {settlements.map((settlement) => (
                  <MenuItem key={settlement.id} value={settlement.id}>
                    {settlement.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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

export default AddressManager;
