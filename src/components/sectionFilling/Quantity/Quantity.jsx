import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EnSelect from "../../../ui/EnSelect/EnSelect";

const Quantity = ({ onNext, currentStep, quantityData = {}, onQuantityChange = () => {} }) => {
  // Состояние для хранения количества точек учета
  const [selectedQuantity, setSelectedQuantity] = React.useState(quantityData.quantity || "");

  // Создаем массив опций от 1 до 30
  const quantityOptions = Array.from({ length: 30 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  }));

  // Обработчик изменения количества
  const handleQuantityChange = (event) => {
    const quantity = event.target.value;
    setSelectedQuantity(quantity);

    // Автосохранение
    onQuantityChange({
      quantity: quantity,
    });
  };

  // Проверка заполненности обязательного поля
  const allFilled = selectedQuantity !== "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <EnSelect
          id="quantity"
          label="Количество точек учета"
          options={quantityOptions}
          value={selectedQuantity}
          onChange={handleQuantityChange}
          required={true}
          helperText="Обязательное поле"
          sx={{ maxWidth: 170, flex: 1 }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          gap: 1,
          mt: 1,
        }}
      >
        <Button
          variant="contained"
          onClick={() => typeof onNext === "function" && onNext()}
          disabled={!allFilled}
          color={allFilled ? "success" : "primary"}
        >
          Далее
        </Button>
      </Box>
    </Box>
  );
};

export default Quantity;
