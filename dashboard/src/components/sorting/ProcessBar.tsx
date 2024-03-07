import React, { useState, useEffect } from "react";

interface ProcessBarProps {
  pids: number[];
  onSelectPid: (pid: number | null) => void;
  allProcessesData: any[]; // Define allProcessesData prop
}

const ProcessBar: React.FC<ProcessBarProps> = ({
  pids,
  onSelectPid,
  allProcessesData,
}) => {
  const [selectedProcess, setSelectedProcess] = useState<any | null>(null);

  useEffect(() => {
    // Auto-select process 1 when the component mounts
    if (!selectedProcess && allProcessesData && allProcessesData.length > 0) {
      const process1 = allProcessesData.find(
        (process: any) => process.pid === 1,
      );
      setSelectedProcess(process1);
    }
  }, [selectedProcess, allProcessesData]);

  const handlePidChange = (pid: number | null) => {
    onSelectPid(pid);
    if (pid !== null) {
      const process = allProcessesData.find(
        (process: any) => process.pid === pid,
      );
      setSelectedProcess(process);
    } else {
      const process1 = allProcessesData.find(
        (process: any) => process.pid === 1,
      );
      setSelectedProcess(process1);
    }
  };

  // Helper function to format the keys nicely
  const formatKey = (key: string) => {
    // Replace underscores with spaces and capitalize the first letter of each word
    return key
      .replace(/_/g, " ")
      .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
  };

  // Helper function to format values based on their types
  const formatValue = (key: string, value: any) => {
    if (typeof value === "number") {
      if (key === "timestamp" || key === "start_time") {
        // Convert timestamp to date and time
        return new Date(value * 1000).toLocaleString();
      } else if (
        key === "virtual_memory" ||
        key === "resident_memory" ||
        key === "shared_memory"
      ) {
        // Convert memory values to GB
        return `${(value / 1024 / 1024).toFixed(2)} GB`;
      } else if (key === "percent_cpu") {
        // Format percent_cpu to percentage
        return `${(value * 100).toFixed(2)}%`;
      }
    }
    return value;
  };

  return (
    <div className="bg-gray-200 p-4 h-100">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select PID
        </label>
        <select
          className="border border-gray-300 rounded-md shadow-sm p-2 mb-2"
          onChange={(e) => handlePidChange(parseInt(e.target.value) || null)}
          value={selectedProcess ? selectedProcess.pid : ""}
        >
          <option value="">Select a PID</option>{" "}
          {/* Handle null value explicitly */}
          {pids.map((pid) => (
            <option key={pid} value={pid}>
              {pid}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Selected Process Details:</h3>
        <ul>
          {selectedProcess &&
            Object.entries(selectedProcess).map(([key, value]) => (
              <li key={key} style={{ marginBottom: "8px" }}>
                <strong>{formatKey(key)}: </strong> {formatValue(key, value)}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default ProcessBar;