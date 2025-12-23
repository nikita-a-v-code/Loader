import React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Navbar from "../../components/common/Navbar/Navbar";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import ExcelFormImporter from "../../components/ExcelFormImporter/ExcelFormImporter";

const ImportExcel = () => {
  return (
    <>
      <Navbar />
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <ExcelFormImporter />
        </Box>
      </Box>
    </>
  );
};

export default ImportExcel;
