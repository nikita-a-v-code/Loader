import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SectionFilling from "./page/SectionFilling/SectionFilling";
import SingleFilling from "./page/SingleFilling/SingleFilling";
import ImportExcel from "./page/ImportExcel/ImportExcel";
import Home from "./page/Home/Home";
import AdminPanel from "./page/AdminPanel/AdminPanel";
import Login from "./page/Login/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CircularProgress, Box } from "@mui/material";

// Компонент для защиты роутов
const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #263238 0%, #0d90d1 50%, #263238 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#ffc107" }} />
      </Box>
    );
  }

  // Если не авторизован - показываем страницу входа
  if (!isAuthenticated) {
    return <Login />;
  }

  // Если авторизован - показываем приложение
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/SectionFilling" element={<SectionFilling />} />
      <Route path="/SingleFilling" element={<SingleFilling />} />
      <Route path="/ImportExcel" element={<ImportExcel />} />
      <Route path="/AdminPanel" element={<AdminPanel />} />
    </Routes>
  );
};

// Главный компонент приложения, включает компонент для защиты роутов
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
