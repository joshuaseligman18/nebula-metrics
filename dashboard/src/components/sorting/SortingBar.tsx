import React, { useState } from "react";

interface SortingBarProps {
  cpuMinuteValues: string[];
  onMinuteRangeChange: (startMinute: number, endMinute: number) => void;
}

const SortingBar: React.FC<SortingBarProps> = ({
  cpuMinuteValues,
  onMinuteRangeChange,
}) => {
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endMinute, setEndMinute] = useState<number>(0);

  const handleStartMinuteChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const minute = parseInt(event.target.value);
    setStartMinute(minute);
    onMinuteRangeChange(minute, endMinute);
  };

  const handleEndMinuteChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const minute = parseInt(event.target.value);
    setEndMinute(minute);
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
        >
          {cpuMinuteValues.map((value, index) => (
            <option
              key={index}
              value={value}
              selected={startMinute === parseInt(value)}
            >
              {`${value}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select End Minute
        </label>
        <select
          className="border border-gray-300 rounded-md shadow-sm p-2"
          onChange={handleEndMinuteChange}
        >
          {cpuMinuteValues
            .filter((value) => parseInt(value) > startMinute)
            .map((value, index) => (
              <option
                key={index}
                value={value}
                selected={endMinute === parseInt(value)}
              >
                {`${value}`}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default SortingBar;
