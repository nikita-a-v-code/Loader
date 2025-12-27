import { useMemo } from "react";

export const useExportData = ({
  pointsCount,
  structureData,
  addressData,
  consumerData,
  networkData,
  deviceData,
  transformData,
  connectionData,
  calculateNetworkAddress,
  calculateFinalCoeff,
  includePort = false,
}) => {
  const exportData = useMemo(
    () => {
      const data = [];

      for (let i = 0; i < pointsCount; i++) {
        const point = {
          // Структура
          mpes: structureData[i]?.s1 || "",
          rkes: structureData[i]?.s2 || "",
          masterUnit: structureData[i]?.s3 || "",

          // Адрес
          settlement: addressData[i]?.settlement || "",
          microdistrict: addressData[i]?.microdistrict || "",
          street: addressData[i]?.street || "",
          house: addressData[i]?.house || "",
          building: addressData[i]?.building || "",
          apartment: addressData[i]?.apartment || "",

          // Потребитель
          consumerName: consumerData[i]?.consumerName || "",
          deliveryPoint: consumerData[i]?.deliveryPoint || "",
          subscriberType: consumerData[i]?.subscriberType || "",
          accountStatus: consumerData[i]?.accountStatus || "",
          contractNumber: consumerData[i]?.contractNumber || "",

          // Код сети
          networkCode: networkData[i]?.networkCode || "",
          numberSupport04: networkData[i]?.numberSupport04 || "",
          maxPower: networkData[i]?.maxPower || "",

          // Прибор учета
          deviceModel: deviceData[i]?.typeDevice || "",
          numberPhases: deviceData[i]?.numberPhases || "",
          serialNumber: deviceData[i]?.serialNumber || "",
          verificationDate: deviceData[i]?.verificationDate || "",
          verificationInterval: deviceData[i]?.verificationInterval || "",
          dateInstallation: deviceData[i]?.dateInstallation || "",
          numberTerminal: deviceData[i]?.numberTerminal || "",
          numberCasing: deviceData[i]?.numberCasing || "",
          password: deviceData[i]?.password || "",
          note: deviceData[i]?.note || "",

          // ТТ
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

          // ТН
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

          // Подключение
          networkAddress: calculateNetworkAddress(i) || connectionData[i]?.networkAddress || "",
          simCardFull: connectionData[i]?.simCardFull || "",
          simCardShort: connectionData[i]?.simCardShort || "",
          ipAddress: connectionData[i]?.ipAddress || "",
          ...(includePort ? { port: connectionData[i]?.port || "" } : {}),
          communicatorNumber: connectionData[i]?.communicatorNumber || "",
          protocol: connectionData[i]?.protocol || "",
          finalCoeff: calculateFinalCoeff(i) || "",
          comPorts: connectionData[i]?.comPorts || "",
          advSettings: connectionData[i]?.advSettings || "",
          nameConnection: connectionData[i]?.nameConnection || "",
          requests: connectionData[i]?.requests || "",
          nameUSPD: connectionData[i]?.nameUSPD || "",
          typeUSPD: connectionData[i]?.typeUSPD || "",
          numberUSPD: connectionData[i]?.numberUSPD || "",
          userUSPD: connectionData[i]?.userUSPD || "",
          passwordUSPD: connectionData[i]?.passwordUSPD || "",
        };

        data.push(point);
      }

      return data;
    },
    // Массив для useMemo, определяет когда пересчитывать данные экспорта
    [
      pointsCount,
      structureData,
      addressData,
      consumerData,
      networkData,
      deviceData,
      transformData,
      connectionData,
      calculateNetworkAddress,
      calculateFinalCoeff,
      includePort,
    ]
  );

  return exportData;
};
