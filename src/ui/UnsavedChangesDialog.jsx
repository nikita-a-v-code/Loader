import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import { Warning } from "@mui/icons-material";

const UnsavedChangesDialog = ({ open, onConfirm, onCancel, targetRoute }) => {
  const getRouteTitle = (route) => {
    const routeTitles = {
      "/SectionFilling": "Заполнение по разделам",
      "/SingleFilling": "Заполнение единой карточки",
      "/ImportExcel": "Импорт Excel файла",
      "/AdminPanel": "Панель Администратора",
      "/": "Главная страница",
    };
    return routeTitles[route] || "другую страницу";
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Warning color="warning" />
        Несохраненные изменения
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          У вас есть несохраненные данные. При переходе на "{getRouteTitle(targetRoute)}" все изменения будут потеряны.
        </Typography>

        <Box
          sx={{
            p: 2,
            backgroundColor: "warning.light",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "warning.main",
          }}
        >
          <Typography variant="body2" color="warning.dark">
            <strong>Внимание:</strong> В данный момент функция сохранения не реализована. Все введенные данные будут
            потеряны при переходе.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Остаться на странице
        </Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          Продолжить без сохранения
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
