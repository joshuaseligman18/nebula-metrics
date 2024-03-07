import React from "react";
import { ProcessDataType } from "../../types/processDataType";
import { useMode } from "../../context/ModeContext"; // Import your mode context

interface ProcessBarProps {
  process: ProcessDataType;
}

const convertKBToGB = (value: number): string => {
  const valueInGB = value / (1024 * 1024); // Convert KB to GB
  return valueInGB.toFixed(2); // Return the value rounded to 2 decimal places as a string
};

const ProcessBar: React.FC<ProcessBarProps> = ({ process }) => {
  const { mode } = useMode(); // Get the mode from your context

  return (
    <div
      className={`process-bar${mode === "dark" ? "-dark" : ""}`}
      style={{
        display: "flex",
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>PID:</strong>
        <span>{process.pid}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>Executable:</strong>
        <span>{process.exec}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>CPU %:</strong>
        <span>{process.percent_cpu}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>Resident Memory (GB):</strong>
        <span>{convertKBToGB(process.resident_memory)}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>Shared Memory (GB):</strong>
        <span>{convertKBToGB(process.shared_memory)}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>Elapsed Time:</strong>
        <span>{process.elapsedTime}</span>
      </div>
      <div style={{ display: "inline-flex", marginRight: "16px" }}>
        <strong style={{ marginRight: "8px" }}>Total CPU:</strong>
        <span>{process.total_cpu}</span>
      </div>
      <div style={{ display: "inline-flex" }}>
        <strong style={{ marginRight: "8px" }}>Virtual Memory (GB):</strong>
        <span>{convertKBToGB(process.virtual_memory)}</span>
      </div>
    </div>
  );
};

export default ProcessBar;
