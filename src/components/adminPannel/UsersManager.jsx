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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  InputAdornment,
} from "@mui/material";
import { Add, Edit, Delete, Visibility, VisibilityOff } from "@mui/icons-material";
import ApiService from "../../services/api";
import ErrorAlert from "../../ui/ErrorAlert";

/*
  Менеджер пользователей -> CRUD-интерфейс для пользователей системы.
  - Загружает список пользователей и ролей.
  - Открывает диалог добавления/редактирования.
  - Сохраняет через API и удаляет.
*/

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    login: "",
    password: "",
    role_id: "",
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([ApiService.getUsers(), ApiService.getUserRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err);
    }
  };

  const handleAdd = () => {
    setEditUser(null);
    setFormData({
      full_name: "",
      login: "",
      password: "",
      role_id: roles[0]?.id || "",
      is_active: true,
    });
    setFormError("");
    setShowPassword(false);
    setOpen(true);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      full_name: user.full_name,
      login: user.login,
      password: "", // Пароль пустой при редактировании
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setFormError("");
    setShowPassword(false);
    setOpen(true);
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setFormError("Введите ФИО");
      return false;
    }
    if (!formData.login.trim()) {
      setFormError("Введите логин");
      return false;
    }
    if (!editUser && !formData.password) {
      setFormError("Введите пароль");
      return false;
    }
    if (formData.password && formData.password.length < 4) {
      setFormError("Пароль должен содержать минимум 4 символа");
      return false;
    }
    if (!formData.role_id) {
      setFormError("Выберите роль");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const dataToSend = {
        full_name: formData.full_name.trim(),
        login: formData.login.trim(),
        role_id: formData.role_id,
        is_active: formData.is_active,
      };

      // Добавляем пароль только если он заполнен
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      if (editUser) {
        await ApiService.updateUser(editUser.id, dataToSend);
      } else {
        await ApiService.createUser(dataToSend);
      }

      loadData();
      setOpen(false);
      setError(null);
      setFormError("");
    } catch (err) {
      console.error("Error saving user:", err);
      setFormError(err.message || "Ошибка сохранения");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить этого пользователя?")) {
      try {
        await ApiService.deleteUser(id);
        loadData();
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(err);
      }
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case "admin":
        return "error";
      case "operator":
        return "primary";
      case "viewer":
        return "default";
      default:
        return "default";
    }
  };

  const getRoleLabel = (roleName) => {
    switch (roleName) {
      case "admin":
        return "Администратор";
      case "operator":
        return "Оператор";
      case "viewer":
        return "Просмотр";
      default:
        return roleName;
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadData} title="Ошибка загрузки данных" />}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Управление пользователями</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAdd}>
          Добавить пользователя
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>ФИО</TableCell>
              <TableCell>Логин</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.login}</TableCell>
                <TableCell>
                  <Chip label={getRoleLabel(user.role_name)} color={getRoleColor(user.role_name)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? "Активен" : "Неактивен"}
                    color={user.is_active ? "success" : "default"}
                    size="small"
                    variant={user.is_active ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(user)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Нет пользователей
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? "Редактировать пользователя" : "Добавить пользователя"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}

            <TextField
              autoFocus
              label="ФИО"
              fullWidth
              variant="outlined"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />

            <TextField
              label="Логин"
              fullWidth
              variant="outlined"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              required
            />

            <TextField
              label={editUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
              fullWidth
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editUser}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Роль</InputLabel>
              <Select
                value={formData.role_id}
                label="Роль"
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {getRoleLabel(role.name)} - {role.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Активен"
            />
          </Box>
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

export default UsersManager;
