import React, { useState, useRef } from "react";
import { useMode } from "../../context/ModeContext";

interface SortingBarProps {
  setCurrentFilter: (newFilter: {
    startTime: Date | null;
    endTime: Date | null;
  }) => void;
}

const SortingBar: React.FC<SortingBarProps> = ({ setCurrentFilter }) => {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const { mode } = useMode();
  const filterForm = useRef<HTMLFormElement>(null);

  const handleStartTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setStartTime(new Date(event.target.value) || null);
  };

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(new Date(event.target.value) || null);
  };

  const filterData = (event: React.SyntheticEvent) => {
    event.preventDefault();
    setCurrentFilter({ startTime, endTime });
  };

  const resetForm = (event: React.SyntheticEvent) => {
    event.preventDefault();
    filterForm.current?.reset();
    setStartTime(null);
    setEndTime(null);
    setCurrentFilter({ startTime: null, endTime: null });
  };

  return (
    <div className={`bg-${mode === "dark" ? "dark" : "gray-200"} p-4 h-100`}>
      <form ref={filterForm}>
        <div className="mb-4">
          <label
            htmlFor="startTime"
            className={`block text-sm font-bold mb-2 ${mode === "dark" ? "text-white" : "text-gray-700"}`}
          >
            Select Start Time
          </label>
          <input
            type="datetime-local"
            id="startTime"
            className="border border-gray-300 rounded-md shadow-sm p-2"
            onChange={handleStartTimeChange}
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className={`block text-sm font-bold mb-2 ${mode === "dark" ? "text-white" : "text-gray-700"}`}
          >
            Select End Time
          </label>
          <input
            type="datetime-local"
            id="endTime"
            className="border border-gray-300 rounded-md shadow-sm p-2"
            onChange={handleEndTimeChange}
          />
        </div>
        <div className="flex justify-evenly mr-10">
          <button
            className={`mt-4 bg-${mode === "dark" ? "blue-500" : "blue-700"} hover:bg-${mode === "dark" ? "blue-700" : "blue-900"} text-white font-bold py-2 px-4 rounded`}
            onClick={filterData}
            style={{
              backgroundColor: mode === "light" ? "#007bff" : "",
              color: mode === "light" ? "white" : "white",
            }}
          >
            Filter
          </button>
          <button
            className={`mt-4 bg-${mode === "dark" ? "blue-500" : "blue-700"} hover:bg-${mode === "dark" ? "blue-700" : "blue-900"} text-white font-bold py-2 px-4 rounded`}
            onClick={resetForm}
            style={{
              backgroundColor: mode === "light" ? "#007bff" : "",
              color: mode === "light" ? "white" : "white",
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default SortingBar;
