import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Toolbar from "@mui/material/Toolbar";
import Navbar from "../../components/common/Navbar/Navbar";
import Sidebar from "../../components/common/Sidebar/Sidebar";
import Quantity from "../../components/sectionFilling/Quantity/Quantity";
import Structure from "../../components/sectionFilling/Structure/Structure";
import Adress from "../../components/sectionFilling/Adress/Adress";
import Consumer from "../../components/sectionFilling/Consumer/Consumer";
import NetworkCode from "../../components/sectionFilling/NetworkCode/NetworkCode";
import Device from "../../components/sectionFilling/Device/Device";
import TTandTN from "../../components/sectionFilling/TTandTN/TTandTN";
import Connection from "../../components/sectionFilling/Connection/Connection";

const SectionFilling = () => {
  /* Строка, определяющая какой компонент сейчас отображается */
  const [content, setContent] = React.useState("quantity");
  /* Текущий активный шаг в stepper */
  const [currentStep, setCurrentStep] = React.useState(0);
  /* Максимальный шаг до которого дошел пользователь */
  const [maxReachedStep, setMaxReachedStep] = React.useState(0);

  const stepSections = [
    { title: "Количество точек учета", key: "quantity" },
    { title: "Потребитель", key: "consumer" },
    { title: "Структура организации", key: "structure" },
    { title: "Адрес точки учета", key: "address" },
    { title: "Код сети", key: "networkcode" },
    { title: "Прибор учета", key: "device" },
    { title: "ТТ и ТН", key: "transform" },
    { title: "Параметры подключения", key: "connection" },
  ];

  const [quantityData, setQuantityData] = React.useState({});
  const [addressData, setAddressData] = React.useState([]);
  const [structureData, setStructureData] = React.useState({});
  const [consumerData, setConsumerData] = React.useState({});
  const [networkData, setNetworkData] = React.useState({});
  const [deviceData, setDeviceData] = React.useState({});
  const [transformData, setTransformData] = React.useState({});
  const [connectionData, setConnectionData] = React.useState({});

  /* Кнопка "Назад" на 1 шаг */
  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1; // Вычисляем предыдущий шаг
      setCurrentStep(prevStep); // Устанавливаем предыдущий шаг как текущий
      setContent(stepSections[prevStep].key); // Меняем контент на соответствующий
    }
  };

  /* Логика доступности только шагов до максимального достигнутого включительно */
  // stepIndex - номер шага для проврки
  const isStepAccessible = (stepIndex) => {
    return stepIndex <= maxReachedStep;
  };

  /* Обработка клика по шагу в stepper */
  const handleStepClick = (stepIndex) => {
    // Проверяем доступность шага
    if (isStepAccessible(stepIndex)) {
      // Устанавливаем выбранный шаг как текущий
      setCurrentStep(stepIndex);
      // Меняем контент
      setContent(stepSections[stepIndex].key);
    }
  };

  /* Переход к новому шагу через кнопку "Далее" */
  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex); // Устанавливаем новый текущий шаг в степпере
    setContent(stepSections[stepIndex].key); // Меняем контент
    setMaxReachedStep(Math.max(maxReachedStep, stepIndex)); // Обновляем максимальный достигнутый шаг
  };

  return (
    <>
      <Navbar />
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Box sx={{ mb: 4 }}>
            {/* Определяет какой шаг подсвечен как активный (синий) */}
            <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
              {stepSections.map((section, index) => (
                /* Помечает шаг как завершенный (синий с галочкой) */
                <Step key={index} completed={index < maxReachedStep && index !== currentStep}>
                  {/* Визуальное оформление степпера */}
                  <StepLabel
                    sx={{
                      cursor: isStepAccessible(index) ? "pointer" : "not-allowed",
                      opacity: isStepAccessible(index) ? 1 : 0.5,
                    }}
                    onClick={() => handleStepClick(index)}
                  >
                    {section.title}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          {content === "quantity" ? (
            <Quantity
              onNext={() => goToStep(1)}
              onBack={handleBack}
              currentStep={currentStep}
              quantityData={quantityData}
              onQuantityChange={setQuantityData}
              consumerData={consumerData}
            />
          ) : content === "consumer" ? (
            <Consumer
              onNext={() => goToStep(2)}
              onBack={handleBack}
              currentStep={currentStep}
              consumerData={consumerData}
              onConsumerChange={setConsumerData}
              pointsCount={quantityData.quantity || 1}
            />
          ) : content === "structure" ? (
            <Structure
              onNext={() => goToStep(3)}
              onBack={handleBack}
              currentStep={currentStep}
              structureData={structureData}
              onStructureChange={setStructureData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "address" ? (
            <Adress
              onNext={() => goToStep(4)}
              onBack={handleBack}
              currentStep={currentStep}
              addressData={addressData}
              onAddressChange={setAddressData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "networkcode" ? (
            <NetworkCode
              onNext={() => goToStep(5)}
              onBack={handleBack}
              currentStep={currentStep}
              networkData={networkData}
              onNetworkChange={setNetworkData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "device" ? (
            <Device
              onNext={() => goToStep(6)}
              onBack={handleBack}
              currentStep={currentStep}
              deviceData={deviceData}
              onDeviceChange={setDeviceData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "transform" ? (
            <TTandTN
              onNext={() => goToStep(7)}
              onBack={handleBack}
              currentStep={currentStep}
              transformData={transformData}
              onTransformChange={setTransformData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : (
            <Connection
              onNext={() => {
                setContent("xxxx");
                setCurrentStep(8);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              connectionData={connectionData}
              onConnectionChange={setConnectionData}
              pointsCount={quantityData.quantity || 1}
              transformData={transformData}
              deviceData={deviceData}
              consumerData={consumerData}
              structureData={structureData}
              addressData={addressData}
              networkData={networkData}
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default SectionFilling;
