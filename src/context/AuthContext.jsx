import React, { createContext, useContext, useState, useEffect } from "react";
import ApiService from "../services/api";

const AuthContext = createContext(null);
// Кастомный хук
export const useAuth = () => {
  // Реакт хук
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
// Хранит состояние авторизации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При загрузке проверяем токен и получаем данные пользователя с сервера
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Запрашиваем данные пользователя с сервера по токену
        const response = await ApiService.getCurrentUser();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          // Токен невалидный - удаляем
          localStorage.removeItem("auth_token");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Токен невалидный или истёк - удаляем
        localStorage.removeItem("auth_token");
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (loginValue, password) => {
    try {
      const response = await ApiService.login(loginValue, password);
      if (response.success && response.token && response.user) {
        // Сохраняем токен в localStorage
        localStorage.setItem("auth_token", response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.error || "Ошибка авторизации" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Ошибка подключения к серверу" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  // Проверка прав доступа
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions?.all) return true;
    return user.permissions?.[permission] === true;
  };

  // Проверка роли
  const isAdmin = () => user?.role_name === "admin";
  const isOperator = () => user?.role_name === "operator";
  const isViewer = () => user?.role_name === "viewer";

  const value = {
    user, // { id, name, role, permissions... } или null
    loading, // true/false - идет проверка авторизации
    login, // функция для входа
    logout, // функция для выхода
    hasPermission, // проверка прав доступа
    isAdmin, // проверка роли
    isOperator, // проверка роли
    isViewer, // проверка роли
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
