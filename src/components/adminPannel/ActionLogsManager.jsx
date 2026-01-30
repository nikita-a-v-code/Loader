import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import { ExpandMore, ExpandLess, Refresh, SettingsBluetooth } from "@mui/icons-material";
import ApiService from "../../services/api";
import ErrorAlert from "../../ui/ErrorAlert";

/*
  Журнал действий -> просмотр истории действий пользователей
*/

const ActionLogsManager = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Фильтры
  const [filters, setFilters] = useState({
    action: "",
    user_id: "",
    date_from: "",
    date_to: "",
  });

  // Данные для фильтров
  const [actionTypes, setActionTypes] = useState([]);
  const [users, setUsers] = useState([]);

  // Развернутые строки для показа details
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [pagination.page, filters]);

  const loadFilterData = async () => {
    try {
      const [actionsData, usersData] = await Promise.all([
        ApiService.getActionTypes().catch(() => []),
        ApiService.getUsers().catch(() => []),
      ]);
      setActionTypes(actionsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error("Error loading filter data:", err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };

      const response = await ApiService.getActionLogs(params);
      setLogs(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0,
      }));
      setError(null);
    } catch (err) {
      console.error("Error loading logs:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getActionLabel = (action) => {
    const labels = {
      login: "Вход в систему",
      logout: "Выход из системы",
      send_email: "Отправка на email",
      send_email_failed: "Ошибка отправки на email",
      export_excel: "Экспорт Excel",
      create: "Создание",
      update: "Обновление",
      delete: "Удаление",
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      login: "success",
      logout: "default",
      send_email: "primary",
      send_email_failed: "error",
      export_excel: "info",
      create: "success",
      update: "warning",
      delete: "error",
    };
    return colors[action] || "default";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDetails = (details, action, entityType) => {
    if (!details) return null;

    try {
      const parsed = typeof details === "string" ? JSON.parse(details) : details;

      // Специальное форматирование для создания сущностей
      if (action === "create" && (entityType === "street" || entityType === "settlement")) {
        const entries = Object.entries(parsed);
        return (
          <Box sx={{ p: 1, backgroundColor: "#f5f5f5", borderRadius: 1, fontSize: "0.85rem" }}>
            {entries.map(([key, value], index) => (
              <Box key={key} sx={{ mb: index < entries.length - 1 ? 0.5 : 0 }}>
                <strong>{key}:</strong> {String(value)}
              </Box>
            ))}
          </Box>
        );
      }

      // Стандартное отображение для остальных случаев
      return (
        <Box sx={{ p: 1, backgroundColor: "#f5f5f5", borderRadius: 1, fontSize: "0.85rem" }}>
          {Object.entries(parsed).map(([key, value]) => (
            <Box key={key} sx={{ mb: 0.5 }}>
              <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value)}
            </Box>
          ))}
        </Box>
      );
    } catch {
      return <Box sx={{ p: 1, backgroundColor: "#f5f5f5", borderRadius: 1 }}>{String(details)}</Box>;
    }
  };

  return (
    <Box>
      {error && <ErrorAlert error={error} onRetry={loadLogs} title="Ошибка загрузки журнала" />}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6">Журнал действий</Typography>
        <IconButton onClick={loadLogs} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Фильтры */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Действие</InputLabel>
          <Select
            value={filters.action}
            label="Действие"
            onChange={(e) => handleFilterChange("action", e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            {actionTypes.map((action) => (
              <MenuItem key={action} value={action}>
                {getActionLabel(action)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Пользователь</InputLabel>
          <Select
            value={filters.user_id}
            label="Пользователь"
            onChange={(e) => handleFilterChange("user_id", e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.full_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="Дата от"
          value={filters.date_from}
          onChange={(e) => handleFilterChange("date_from", e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />

        <TextField
          size="small"
          type="date"
          label="Дата до"
          value={filters.date_to}
          onChange={(e) => handleFilterChange("date_to", e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
      </Box>

      {/* Таблица */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40}></TableCell>
              <TableCell>Дата/Время</TableCell>
              <TableCell>Пользователь</TableCell>
              <TableCell>Действие</TableCell>
              <TableCell>IP адрес</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Записи не найдены
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow hover>
                    <TableCell>
                      {log.details && (
                        <IconButton size="small" onClick={() => toggleRowExpand(log.id)}>
                          {expandedRows[log.id] ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                    <TableCell>
                      <Tooltip title={log.user_login || ""}>
                        <span>{log.user_name || "Система"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip label={getActionLabel(log.action)} color={getActionColor(log.action)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                        {log.ip_address || "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {log.details && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 0, border: 0 }}>
                        <Collapse in={expandedRows[log.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 1, px: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Детали:
                            </Typography>
                            {formatDetails(log.details, log.action, log.entity_type)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
        Всего записей: {pagination.total}
      </Typography>
    </Box>
  );
};

export default ActionLogsManager;
