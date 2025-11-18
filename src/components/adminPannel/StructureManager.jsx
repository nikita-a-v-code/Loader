import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import ApiService from "../../services/api";

const StructureManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mpes, setMpes] = useState([]);
  const [rkes, setRkes] = useState([]);
  const [masterUnits, setMasterUnits] = useState([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", mpes_id: "", rkes_id: "" });

  useEffect(() => {
    loadMpes();
    loadRkes();
    loadMasterUnits();
  }, []);

  const loadMpes = async () => {
    try {
      const data = await ApiService.getMpes();
      setMpes(data);
    } catch (err) {
      console.error("Error loading mpes:", err);
    }
  };

  const loadRkes = async () => {
    try {
      const data = await ApiService.getRkes();
      setRkes(data);
    } catch (err) {
      console.error("Error loading rkes:", err);
    }
  };

  const loadMasterUnits = async () => {
    try {
      const data = await ApiService.getMasterUnits();
      setMasterUnits(data);
    } catch (err) {
      console.error("Error loading master units:", err);
    }
  };

  const handleSave = async () => {
    try {
      const endpoint = getApiEndpoint();

      if (editItem) {
        // Обновление
        switch (activeTab) {
          case 0:
            await ApiService.updateMpes(editItem.id, formData);
            break;
          case 1:
            await ApiService.updateRkes(editItem.id, formData);
            break;
          case 2:
            await ApiService.updateMasterUnit(editItem.id, formData);
            break;
        }
      } else {
        // Создание
        switch (activeTab) {
          case 0:
            await ApiService.createMpes(formData);
            break;
          case 1:
            await ApiService.createRkes(formData);
            break;
          case 2:
            await ApiService.createMasterUnit(formData);
            break;
        }
      }

      loadMpes();
      loadRkes();
      loadMasterUnits();
      setOpen(false);
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Удалить этот ${getTitle().toLowerCase()}?`)) {
      try {
        switch (activeTab) {
          case 0:
            await ApiService.deleteMpes(id);
            break;
          case 1:
            await ApiService.deleteRkes(id);
            break;
          case 2:
            await ApiService.deleteMasterUnit(id);
            break;
        }
        loadMpes();
        loadRkes();
        loadMasterUnits();
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 0:
        return mpes;
      case 1:
        return rkes;
      case 2:
        return masterUnits;
      default:
        return [];
    }
  };

  const getApiEndpoint = () => {
    switch (activeTab) {
      case 0:
        return "mpes";
      case 1:
        return "rkes";
      case 2:
        return "master-units";
      default:
        return "";
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 0:
        return "МПЭС";
      case 1:
        return "РКЭС";
      case 2:
        return "Мастерские участки";
      default:
        return "";
    }
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ name: "", mpes_id: "", rkes_id: "" });
    setOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      mpes_id: item.mpes_id || "",
      rkes_id: item.rkes_id || "",
    });
    setOpen(true);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Управление структурой
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="МПЭС" />
        <Tab label="РКЭС" />
        <Tab label="Мастерские участки" />
      </Tabs>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">{getTitle()}</Typography>
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
              {activeTab === 1 && <TableCell>МПЭС</TableCell>}
              {activeTab === 2 && <TableCell>РКЭС</TableCell>}
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getCurrentData().map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                {activeTab === 1 && <TableCell>{mpes.find((m) => m.id === item.mpes_id)?.name || "—"}</TableCell>}
                {activeTab === 2 && <TableCell>{rkes.find((r) => r.id === item.rkes_id)?.name || "—"}</TableCell>}
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
          {editItem ? "Редактировать" : "Добавить"} {getTitle().toLowerCase()}
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

          {activeTab === 1 && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>МПЭС</InputLabel>
              <Select
                value={formData.mpes_id}
                onChange={(e) => setFormData({ ...formData, mpes_id: e.target.value })}
                label="МПЭС"
              >
                {mpes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {activeTab === 2 && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>РКЭС</InputLabel>
              <Select
                value={formData.rkes_id}
                onChange={(e) => setFormData({ ...formData, rkes_id: e.target.value })}
                label="РКЭС"
              >
                {rkes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
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

export default StructureManager;
