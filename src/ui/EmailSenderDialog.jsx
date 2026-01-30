import React, { useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from "@mui/material";

/**
 * Диалог для отправки файла на email.
 */
const EmailSenderDialog = ({ open, onClose, email, onEmailChange, onSend, sending, message }) => {
  useEffect(() => {
    if (message && message.type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Отправить Excel файл на электронную почту</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Email адрес"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="example@mail.com"
          sx={{ mt: 2 }}
        />
        {message && message.text && (
          <Alert severity={message.type} sx={{ mt: 1 }}>
            {message.text}
          </Alert>
        )}
      </DialogContent>
      {/* Кнопки отображаются только если нет успешного сообщения */}
      {!(message && message.type === "success" && message.text) && (
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button onClick={onSend} variant="contained" disabled={sending}>
            {sending ? "Отправляем..." : "Отправить"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default EmailSenderDialog;
