import React, { useState } from "react";
import ApiService from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { transformToKe, getKeFilename } from "../singleFilling/utils/keTransformer";
import Connection from "./Connection/Connection";

/**
 * Главный компонент финального этапа заполнения секций.
 * Знает обо всех данных предыдущих шагов и отвечает за генерацию и экспорт итоговых данных.
 */
const SectionFillingExporter = ({
  onNext,
  onBack,
  connectionData = {},
  onConnectionChange = () => {},
  pointsCount = 1,
  transformData = {},
  deviceData = {},
  consumerData = {},
  structureData = {},
  addressData = {},
  networkData = {},
}) => {
  const { user } = useAuth();

  const [emailDialog, setEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState({ text: "", type: "success" });
  const [keFileModeEnabled, setKeFileModeEnabled] = useState(false);
  const [deviceListFull, setDeviceListFull] = useState([]);

  // Загрузка параметра KE режима и полного списка устройств
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const keMode = await ApiService.getAppSetting("ke_file_mode_enabled");
        setKeFileModeEnabled(keMode?.value === "true" || keMode?.value === true);
        
        const devices = await ApiService.getDevices();
        setDeviceListFull(devices || []);
      } catch (error) {
        console.error("Ошибка загрузки параметров:", error);
      }
    };
    loadSettings();
  }, []);

  // Загрузка дефолтного email
  React.useEffect(() => {
    ApiService.getDefaultEmail()
      .then((resp) => {
        if (resp?.defaultEmail) setEmail(resp.defaultEmail);
      })
      .catch((err) => console.error("Не удалось получить дефолтный email:", err));
  }, []);

  /**
   * Генерирует итоговый объект данных из всех шагов заполнения.
   * Именно здесь агрегируются данные всех компонентов.
   */
  const generateExportData = (connectionPoints, includePort, isAdminExport, helpers) => {
    const {
      getNetworkAddress,
      getIpFromDeviceModel,
      getRequestsFromDeviceModel,
      getAdvSettingsFromDeviceModel,
      calculateFinalCoeff,
    } = helpers;
    const data = [];

    for (let i = 0; i < pointsCount; i++) {
      const point = {
        mpes: structureData[i]?.s1 || "",
        rkes: structureData[i]?.s2 || "",
        masterUnit: structureData[i]?.s3 || "",
        settlement: addressData[i]?.settlement || "",
        microdistrict: addressData[i]?.microdistrict || "",
        street: addressData[i]?.street || "",
        house: addressData[i]?.house || "",
        building: addressData[i]?.building || "",
        apartment: addressData[i]?.apartment || "",
        consumerName: consumerData[i]?.consumerName || "",
        deliveryPoint: consumerData[i]?.deliveryPoint || "",
        subscriberType: consumerData[i]?.subscriberType || "",
        accountStatus: consumerData[i]?.accountStatus || "",
        contractNumber: consumerData[i]?.contractNumber || "",
        networkCode: networkData[i]?.networkCode || "",
        transformerSubstationNumber: networkData[i]?.transformerSubstationNumber || "",
        numberSupport04: networkData[i]?.numberSupport04 || "",
        maxPower: networkData[i]?.maxPower || "",
        deviceModel: deviceData[i]?.typeDevice || "",
        numberPhases: deviceData[i]?.numberPhases || "",
        serialNumber: deviceData[i]?.serialNumber || "",
        objectID: deviceData[i]?.objectID || "",
        verificationDate: deviceData[i]?.verificationDate || "",
        verificationInterval: deviceData[i]?.verificationInterval || "",
        dateInstallation: deviceData[i]?.dateInstallation || "",
        numberTerminal: deviceData[i]?.numberTerminal || "",
        numberCasing: deviceData[i]?.numberCasing || "",
        password: deviceData[i]?.password || "",
        note: deviceData[i]?.note || "",
        ttType: transformData[i]?.ttType || "",
        ttSerialA: transformData[i]?.ttSerialA || "",
        ttSerialB: transformData[i]?.ttSerialB || "",
        ttSerialC: transformData[i]?.ttSerialC || "",
        ttDateA: transformData[i]?.ttDateA || "",
        ttIntervalA: transformData[i]?.ttIntervalA || "",
        ttDateB: transformData[i]?.ttDateB || "",
        ttIntervalB: transformData[i]?.ttIntervalB || "",
        ttDateC: transformData[i]?.ttDateC || "",
        ttIntervalC: transformData[i]?.ttIntervalC || "",
        ttCoeff: transformData[i]?.ttCoeff || "1",
        ttSealA: transformData[i]?.ttSealA || "",
        ttSealB: transformData[i]?.ttSealB || "",
        ttSealC: transformData[i]?.ttSealC || "",
        tnType: transformData[i]?.tnType || "",
        tnSerialA: transformData[i]?.tnSerialA || "",
        tnSerialB: transformData[i]?.tnSerialB || "",
        tnSerialC: transformData[i]?.tnSerialC || "",
        tnDateA: transformData[i]?.tnDateA || "",
        tnIntervalA: transformData[i]?.tnIntervalA || "",
        tnDateB: transformData[i]?.tnDateB || "",
        tnIntervalB: transformData[i]?.tnIntervalB || "",
        tnDateC: transformData[i]?.tnDateC || "",
        tnIntervalC: transformData[i]?.tnIntervalC || "",
        tnCoeff: transformData[i]?.tnCoeff || "1",
        tnSealA: transformData[i]?.tnSealA || "",
        tnSealB: transformData[i]?.tnSealB || "",
        tnSealC: transformData[i]?.tnSealC || "",
        networkAddress: getNetworkAddress(i) || connectionPoints[i]?.networkAddress || "",
        simCardFull: connectionPoints[i]?.simCardFull || "",
        simCardShort: connectionPoints[i]?.simCardShort || "",
        ipAddress: connectionPoints[i]?.ipAddress || getIpFromDeviceModel(deviceData[i]?.typeDevice) || "",
        ...(includePort || isAdminExport ? { port: connectionPoints[i]?.port || "" } : {}),
        communicatorNumber: connectionPoints[i]?.communicatorNumber || "",
        protocol: connectionPoints[i]?.protocol || "",
        finalCoeff: calculateFinalCoeff(i) || "",
        comPorts: connectionPoints[i]?.comPorts || "",
        advSettings: connectionPoints[i]?.advSettings || getAdvSettingsFromDeviceModel(deviceData[i]?.typeDevice) || "",
        nameConnection: connectionPoints[i]?.nameConnection || "",
        requests: connectionPoints[i]?.requests || getRequestsFromDeviceModel(deviceData[i]?.typeDevice) || "",
        nameUSPD: connectionPoints[i]?.nameUSPD || "",
        typeUSPD: connectionPoints[i]?.typeUSPD || "",
        numberUSPD: connectionPoints[i]?.numberUSPD || "",
        userUSPD: connectionPoints[i]?.userUSPD || "",
        passwordUSPD: connectionPoints[i]?.passwordUSPD || "",
      };

      if (!isAdminExport) {
        delete point.networkAddress;
        delete point.ipAddress;
        delete point.password;
        delete point.protocol;
        delete point.port;
        delete point.requests;
        delete point.advSettings;
        delete point.objectID;
      }

      data.push(point);
    }
    return data;
  };

  const handleExport = async (connectionPoints, helpers) => {
    try {
      const exportData = generateExportData(connectionPoints, false, user?.role_name === "admin", helpers);
      
      // Помечаем objectID как использованные (хранятся в deviceData)
      const objectIDsToMark = [];
      for (let i = 0; i < pointsCount; i++) {
        if (deviceData[i]?.objectID) {
          objectIDsToMark.push(deviceData[i].objectID);
        }
      }
      if (objectIDsToMark.length > 0) {
        await ApiService.markObjectIDsAsUsed(objectIDsToMark);
      }

      // Экспортируем основной файл
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `section_filling_${dateStr}.xlsx`;
      await ApiService.exportToExcel(exportData, filename, false);

      // Если включен режим KE, создаем второй файл
      if (keFileModeEnabled) {
        const keExportData = exportData.map((data) => transformToKe(data, deviceListFull));
        const keFilename = getKeFilename(filename);
        await ApiService.exportToExcel(keExportData, keFilename, true);
      }
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Ошибка при экспорте в Excel");
    }
  };

  const handleSendToEmail = async (connectionPoints, helpers) => {
    if (!email || !email.includes("@")) {
      setEmailMessage({ text: "Введите корректный email адрес", type: "error" });
      return;
    }
    try {
      setEmailSending(true);
      setEmailMessage({ text: "", type: "success" });
      const exportData = generateExportData(connectionPoints, true, true, helpers);

      // Помечаем objectID как использованные (хранятся в deviceData)
      const objectIDsToMark = [];
      for (let i = 0; i < pointsCount; i++) {
        if (deviceData[i]?.objectID) {
          objectIDsToMark.push(deviceData[i].objectID);
        }
      }
      if (objectIDsToMark.length > 0) {
        await ApiService.markObjectIDsAsUsed(objectIDsToMark);
      }

      // Отправляем основной файл
      await ApiService.sendExcelToEmail(exportData, email, user?.id, "section_filling");

      // Если включен режим KE, отправляем второй файл
      if (keFileModeEnabled) {
        const keExportData = exportData.map((data) => transformToKe(data, deviceListFull));
        await ApiService.sendExcelToEmail(keExportData, email, user?.id, "section_filling_ke");
      }

      setEmailMessage({ text: `Файл успешно отправлен на ${email}`, type: "success" });
    } catch (error) {
      console.error("Ошибка при отправке:", error);
      setEmailMessage({ text: "Ошибка при отправке на email", type: "error" });
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Connection
      onNext={onNext}
      onBack={onBack}
      connectionData={connectionData}
      onConnectionChange={onConnectionChange}
      pointsCount={pointsCount}
      transformData={transformData}
      deviceData={deviceData}
      consumerData={consumerData}
      onExport={handleExport}
      onSendToEmail={handleSendToEmail}
      emailDialog={emailDialog}
      onEmailDialogOpen={() => setEmailDialog(true)}
      onEmailDialogClose={() => setEmailDialog(false)}
      email={email}
      onEmailChange={(value) => {
        setEmail(value);
        setEmailMessage({ text: "", type: "success" });
      }}
      emailSending={emailSending}
      emailMessage={emailMessage}
      keFileModeEnabled={keFileModeEnabled}
    />
  );
};

export default SectionFillingExporter;
