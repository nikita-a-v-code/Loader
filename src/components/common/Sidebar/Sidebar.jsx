import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import NavigationSections from "./NavigationSections/NavigationSections";

const drawerWidth = 240;

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = (e) => {
      if (e && e.detail && typeof e.detail.open === "boolean") setMenuOpen(e.detail.open);
    };
    window.addEventListener("drawer-toggle", handler);
    return () => window.removeEventListener("drawer-toggle", handler);
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ overflow: "auto", paddingTop: "70px" }}>
        <NavigationSections showAsSidebar={true} />
      </Box>
    </Drawer>
  );
}
