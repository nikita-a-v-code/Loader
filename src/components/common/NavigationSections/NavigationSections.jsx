import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";

export default function NavigationSections({ showAsSidebar = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    {
      title: "Заполнение по разделам",
      subtitle: "Множественное заполнение по шагам",
      description: "Пошаговое заполнение всех разделов для нескольких точек учета",
      icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
      route: "/SectionFilling",
      color: "#2196f3",
    },
    {
      title: "Заполнение единой карточки",
      subtitle: "Одна форма для всех данных",
      description: "Заполнение всех данных о точке учета на одной странице",
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      route: "/SingleFilling",
      color: "#ff9800",
    },
    {
      title: "Импорт Excel файла",
      subtitle: "Проверка и валидация",
      description: "Загрузка и проверка данных из Excel файла",
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      route: "/ImportExcel",
      color: "#4caf50",
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  if (showAsSidebar) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
          Способ заполнения
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sections.map((section, index) => {
            const isActive = location.pathname === section.route;
            return (
              <Button
                key={index}
                variant={isActive ? "contained" : "outlined"}
                onClick={() => handleCardClick(section.route)}
                sx={{
                  height: 80,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1,
                  borderColor: section.color,
                  backgroundColor: isActive ? section.color : "transparent",
                  color: isActive ? "white" : section.color,
                  "&:hover": {
                    borderColor: section.color,
                    backgroundColor: isActive ? section.color : `${section.color}15`,
                    transform: "scale(1.02)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <Box sx={{ color: isActive ? "white" : section.color }}>
                  {React.cloneElement(section.icon, { sx: { fontSize: 24 } })}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "medium",
                    textAlign: "center",
                    lineHeight: 1.2,
                    fontSize: "11px",
                  }}
                >
                  {section.title}
                </Typography>
              </Button>
            );
          })}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Typography variant="h4" sx={{ mb: 1, textAlign: "center", fontWeight: "bold" }}>
        Выберите способ заполнения
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, textAlign: "center", color: "text.secondary" }}>
        Выберите наиболее подходящий вариант для вашей задачи
      </Typography>

      <Grid container spacing={3}>
        {sections.map((section, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea onClick={() => handleCardClick(section.route)} sx={{ height: "100%", p: 3 }}>
                <CardContent sx={{ textAlign: "center", height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ color: section.color, mb: 2 }}>{section.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                    {section.title}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: section.color, fontWeight: "medium" }}>
                    {section.subtitle}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", flexGrow: 1 }}>
                    {section.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
