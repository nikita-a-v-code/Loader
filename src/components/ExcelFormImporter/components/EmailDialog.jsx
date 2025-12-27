import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

/**
 * Диалог для отправки Excel файла на email.
 */
const EmailDialog = ({ open, onClose, email, onEmailChange, onSend, sending }) => {
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onSend} variant="contained" disabled={sending}>
          {sending ? "Отправляем..." : "Отправить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;
