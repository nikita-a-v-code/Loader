import React, { useState } from "react";
import { Box, Typography, Tabs, Tab, Card, CardContent } from "@mui/material";
import AbonentTypesManager from "../../components/adminPannel/AbonentTypesManager";
import StatusesManager from "../../components/adminPannel/StatusesManager";
import StructureManager from "../../components/adminPannel/StructureManager";
import DevicesManager from "../../components/adminPannel/DevicesManager";
import ConnectionsManager from "../../components/adminPannel/ConnectionsManager";
import ProtocolsManager from "../../components/adminPannel/ProtocolsManager";
import Settings from "../../components/adminPannel/Settings";
import Navbar from "../../components/common/Navbar/Navbar";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import AddressManager from "../../components/adminPannel/AddressManager";
import UsersManager from "../../components/adminPannel/UsersManager";
import ActionLogsManager from "../../components/adminPannel/ActionLogsManager";
import NumberTPManager from "../../components/adminPannel/NumberTPManager";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: "Типы абонентов", component: <AbonentTypesManager /> },
    { label: "Статусы счетов", component: <StatusesManager /> },
    { label: "МПЭС/РКЭС/МУ", component: <StructureManager /> },
    { label: "Модели счетчиков", component: <DevicesManager /> },
    { label: "Номера ТП", component: <NumberTPManager /> },
    { label: "Населенные пункты/Улицы", component: <AddressManager /> },
    { label: "Пользователи", component: <UsersManager /> },
    { label: "Журнал действий", component: <ActionLogsManager /> },
    { label: "Настройки", component: <Settings /> },
  ];

  return (
    <>
      <Navbar />
      <Sidebar />
      <Box sx={{ p: 3, ml: "240px", mt: "64px" }}>
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>{tabs[activeTab]?.component}</CardContent>
        </Card>
      </Box>
    </>
  );
};

export default AdminPanel;
