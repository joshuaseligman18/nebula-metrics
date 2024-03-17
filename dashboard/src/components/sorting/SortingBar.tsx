import React, { useState, useEffect } from "react";

interface SortingBarProps {
  cpuMinuteValues: string[];
  onMinuteRangeChange: (startMinute: string | null, endMinute: string | null) => void;
}

const SortingBar: React.FC<SortingBarProps> = ({
  cpuMinuteValues,
  onMinuteRangeChange,
}) => {
  const [startMinute, setStartMinute] = useState<string | null>(null);
  const [endMinute, setEndMinute] = useState<string | null>(null);
  const [endMinuteOptions, setEndMinuteOptions] = useState<string[]>([]);

  useEffect(() => {
    if (startMinute === null) {
      return; // Do not update end minute options if start minute is not selected
    }

    const startMinuteIndex = cpuMinuteValues.findIndex((value) => value === startMinute);

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
    console.log("start minute ", startMinute);
    console.log("end minute ", minute);
    onMinuteRangeChange(startMinute, minute);
  };

  return (
    <div className="bg-gray-200 p-4 h-100">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select Start Minute
        </label>
        <select
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
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select End Minute
          </label>
          <select
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
    </div>
  );
};

export default SortingBar;
