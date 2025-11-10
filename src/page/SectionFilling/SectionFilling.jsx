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
  const [content, setContent] = React.useState("quantity");
  const [currentStep, setCurrentStep] = React.useState(0);

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
  const [addressData, setAddressData] = React.useState({});
  const [structureData, setStructureData] = React.useState({});
  const [consumerData, setConsumerData] = React.useState({});
  const [networkData, setNetworkData] = React.useState({});
  const [deviceData, setDeviceData] = React.useState({});
  const [transformData, setTransformData] = React.useState({});
  const [connectionData, setConnectionData] = React.useState({});

  const handleBack = () => {
    if (currentStep > 0) {
      if (currentStep === 1) {
        setContent("quantity");
        setCurrentStep(0);
      } else if (currentStep === 2) {
        setContent("consumer");
        setCurrentStep(1);
      } else if (currentStep === 3) {
        setContent("structure");
        setCurrentStep(2);
      } else if (currentStep === 4) {
        setContent("address");
        setCurrentStep(3);
      } else if (currentStep === 5) {
        setContent("networkcode");
        setCurrentStep(4);
      } else if (currentStep === 6) {
        setContent("device");
        setCurrentStep(5);
      } else if (currentStep === 7) {
        setContent("transform");
        setCurrentStep(6);
      }
    }
  };

  const isStepAccessible = (stepIndex) => {
    return stepIndex <= currentStep;
  };

  const handleStepClick = (stepIndex) => {
    if (isStepAccessible(stepIndex)) {
      setCurrentStep(stepIndex);
      setContent(stepSections[stepIndex].key);
    }
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
            <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
              {stepSections.map((section, index) => (
                <Step key={index}>
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
              onNext={() => {
                setContent("consumer");
                setCurrentStep(1);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              quantityData={quantityData}
              onQuantityChange={setQuantityData}
              consumerData={consumerData}
            />
          ) : content === "consumer" ? (
            <Consumer
              onNext={() => {
                setContent("structure");
                setCurrentStep(2);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              consumerData={consumerData}
              onConsumerChange={setConsumerData}
              pointsCount={quantityData.quantity || 1}
            />
          ) : content === "structure" ? (
            <Structure
              onNext={() => {
                setContent("address");
                setCurrentStep(3);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              structureData={structureData}
              onStructureChange={setStructureData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "address" ? (
            <Adress
              onNext={() => {
                setContent("networkcode");
                setCurrentStep(4);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              addressData={addressData}
              onAddressChange={setAddressData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "networkcode" ? (
            <NetworkCode
              onNext={() => {
                setContent("device");
                setCurrentStep(5);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              networkData={networkData}
              onNetworkChange={setNetworkData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "device" ? (
            <Device
              onNext={() => {
                setContent("transform");
                setCurrentStep(6);
              }}
              onBack={handleBack}
              currentStep={currentStep}
              deviceData={deviceData}
              onDeviceChange={setDeviceData}
              pointsCount={quantityData.quantity || 1}
              consumerData={consumerData}
            />
          ) : content === "transform" ? (
            <TTandTN
              onNext={() => {
                setContent("connection");
                setCurrentStep(7);
              }}
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
            />
          )}
        </Box>
      </Box>
    </>
  );
};

export default SectionFilling;
