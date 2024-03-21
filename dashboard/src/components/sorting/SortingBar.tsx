import React, { useState, useEffect } from "react";
import { useMode } from "../../context/ModeContext";

interface SortingBarProps {
  cpuMinuteValues: string[];
  onMinuteRangeChange: (
    startMinute: string | null,
    endMinute: string | null
  ) => void;
  resetData: () => void;
}

const SortingBar: React.FC<SortingBarProps> = ({
  cpuMinuteValues,
  onMinuteRangeChange,
  resetData,
}) => {
  const [startMinute, setStartMinute] = useState<string | null>(null);
  const [endMinute, setEndMinute] = useState<string | null>(null);
  const [endMinuteOptions, setEndMinuteOptions] = useState<string[]>([]);
  const { mode } = useMode();

  useEffect(() => {
    if (startMinute === null) {
      return; // Do not update end minute options if start minute is not selected
    }

    const startMinuteIndex = cpuMinuteValues.findIndex(
      (value) => value === startMinute
    );

    if (startMinuteIndex === -1) {
      return; // Start minute not found in the list
    }

    const filteredMinutes = cpuMinuteValues
      .slice(startMinuteIndex + 1) // Get minutes after the selected start minute
      .filter((value) => value !== startMinute);

    setEndMinuteOptions(filteredMinutes);
    setEndMinute(null); // Reset end minute when start minute changes
  }, [cpuMinuteValues, startMinute]);

  const handleStartMinuteChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const minute = event.target.value;
    setStartMinute(minute);
  };

  const handleEndMinuteChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const minute = event.target.value;
    setEndMinute(minute);
    onMinuteRangeChange(startMinute, minute);
  };

  return (
    <div className={`bg-${mode === "dark" ? "dark" : "gray-200"} p-4 h-100`}>
      <div className="mb-4">
        <label
          htmlFor="startMinute"
          className={`block text-sm font-bold mb-2 ${mode === "dark" ? "text-white" : "text-gray-700"}`}
        >
          Select Start Minute
        </label>
        <select
          id="startMinute"
          className="border border-gray-300 rounded-md shadow-sm p-2"
          onChange={handleStartMinuteChange}
          value={startMinute || ""}
        >
          <option value="">Select...</option>
          {cpuMinuteValues.map((value, index) => (
            <option key={index} value={value}>
              {`${value}`}
            </option>
          ))}
        </select>
      </div>
      {startMinute !== null && (
        <div>
          <label
            htmlFor="endMinute"
            className={`block text-sm font-bold mb-2 ${mode === "dark" ? "text-white" : "text-gray-700"}`}
          >
            Select End Minute
          </label>
          <select
            id="endMinute"
            className="border border-gray-300 rounded-md shadow-sm p-2"
            onChange={handleEndMinuteChange}
            value={endMinute || ""}
          >
            <option value="">Select...</option>
            {endMinuteOptions.map((value, index) => (
              <option key={index} value={value}>
                {`${value}`}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        className={`mt-4 bg-${mode === "dark" ? "blue-500" : "blue-700"} hover:bg-${mode === "dark" ? "blue-700" : "blue-900"} text-white font-bold py-2 px-4 rounded`}
        onClick={resetData}
        style={{
          backgroundColor: mode === "light" ? "#007bff" : "",
          color: mode === "light" ? "white" : "white",
        }}
      >
        Reset
      </button>
    </div>
  );
};

export default SortingBar;
