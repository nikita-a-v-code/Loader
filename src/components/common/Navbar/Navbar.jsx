import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import MoreIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { Chip } from "@mui/material";
import { useAuth } from "../../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  // helper to set drawer state and notify other components via a custom event
  const notifyDrawer = (open) => {
    setDrawerOpen(open);
    try {
      window.dispatchEvent(new CustomEvent("drawer-toggle", { detail: { open } }));
    } catch (e) {
      // ignore environments without CustomEvent
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
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

  const menuId = "primary-search-account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #eee", minWidth: 200 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Вы вошли как:
        </Typography>
        <Typography variant="body1" fontWeight="bold">
          {user?.full_name}
        </Typography>
        <Chip
          label={getRoleLabel(user?.role_name)}
          color={getRoleColor(user?.role_name)}
          size="small"
          sx={{ mt: 0.5 }}
        />
      </Box>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1 }} />
        Выйти
      </MenuItem>
    </Menu>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";
  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem disabled>
        <PersonIcon sx={{ mr: 1 }} />
        {user?.full_name}
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon sx={{ mr: 1 }} />
        Выйти
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 2,
          background: "linear-gradient(45deg, #263238 0%, #0d90d1ff 100%)",
          borderTop: "4px solid #ffc107",
          borderBottom: "4px solid #ffc107",
          boxShadow: "0 0 20px rgba(255,193,7,0.3)",
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            onClick={() => notifyDrawer(!drawerOpen)}
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: "none", sm: "block" } }}>
            Универсальный загрузчик
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Отображение информации о пользователе */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
            <Chip
              label={user?.full_name}
              color="default"
              size="small"
              sx={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                "& .MuiChip-label": { fontWeight: 500 },
              }}
            />
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <PersonIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="show more"
              aria-controls={mobileMenuId}
              aria-haspopup="true"
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {renderMobileMenu}
      {renderMenu}
    </Box>
  );
}
