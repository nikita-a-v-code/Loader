import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Typography,
} from "@mui/material";
import { Error, Refresh, ExpandMore, ExpandLess } from "@mui/icons-material";
import { useState } from "react";

const ErrorAlert = ({ 
  error, 
  onRetry, 
  title = "Ошибка загрузки данных",
  showDetails = true 
}) => {
  const [showFullError, setShowFullError] = useState(false);

  if (!error) return null;

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.toString) return error.toString();
    return 'Неизвестная ошибка';
  };

  const getErrorType = (error) => {
    const message = getErrorMessage(error);
    
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return {
        type: 'network',
        userMessage: 'Не удается подключиться к серверу. Проверьте подключение к интернету или обратитесь к администратору.',
        suggestion: 'Убедитесь, что сервер запущен и доступен.'
      };
    }
    
    if (message.includes('404')) {
      return {
        type: 'notFound',
        userMessage: 'Запрашиваемый ресурс не найден на сервере.',
        suggestion: 'Проверьте настройки API или обратитесь к администратору.'
      };
    }
    
    if (message.includes('500')) {
      return {
        type: 'server',
        userMessage: 'Внутренняя ошибка сервера.',
        suggestion: 'Попробуйте повторить запрос позже или обратитесь к администратору.'
      };
    }
    
    return {
      type: 'unknown',
      userMessage: message,
      suggestion: 'Попробуйте обновить страницу или повторить операцию.'
    };
  };

  const errorInfo = getErrorType(error);

  return (
    <Alert 
      severity="error" 
      sx={{ mb: 2 }}
      action={
        onRetry && (
          <Button
            color="inherit"
            size="small"
            startIcon={<Refresh />}
            onClick={onRetry}
          >
            Повторить
          </Button>
        )
      }
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Error />
        {title}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: 1 }}>
        {errorInfo.userMessage}
      </Typography>
      
      <Typography variant="caption" color="text.secondary">
        {errorInfo.suggestion}
      </Typography>

      {showDetails && (
        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowFullError(!showFullError)}
            startIcon={showFullError ? <ExpandLess /> : <ExpandMore />}
            sx={{ p: 0, minWidth: 'auto' }}
          >
            Технические детали
          </Button>
          
          <Collapse in={showFullError}>
            <Box sx={{ 
              mt: 1, 
              p: 1, 
              backgroundColor: 'grey.100', 
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              wordBreak: 'break-all'
            }}>
              {getErrorMessage(error)}
            </Box>
          </Collapse>
        </Box>
      )}
    </Alert>
  );
};

export default ErrorAlert;