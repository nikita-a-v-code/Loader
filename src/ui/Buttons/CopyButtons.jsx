import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const CopyButtons = ({
  pointsCount,
  index,
  fieldValue,
  onApplyToAll,
  onApplyToNext,
  totalPoints,
  arrowDirection = "down",
}) => {
  if (pointsCount <= 1 || !fieldValue) return <Box sx={{ width: 40 }} />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
      {index < totalPoints - 1 && (
        <Tooltip title="Копировать в следующую строку">
          <IconButton
            size="small"
            onClick={onApplyToNext}
            sx={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(76, 175, 80, 0.2)",
              },
              height: 24,
              width: 24,
            }}
          >
            {arrowDirection === "right" ? (
              <ArrowForwardIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
      {index === 0 && (
        <Tooltip title="Применить ко всем точкам">
          <IconButton
            size="small"
            onClick={onApplyToAll}
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.2)",
              },
              height: 24,
              width: 24,
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default CopyButtons;
