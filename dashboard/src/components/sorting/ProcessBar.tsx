import React, { useState } from "react";

interface ProcessBarProps {
  pids: number[];
  onSelectPid: (pid: number | null) => void; // Update the type of onSelectPid
}

const ProcessBar: React.FC<ProcessBarProps> = ({ pids, onSelectPid }) => {

  return (
    <div className="bg-gray-200 p-4 h-100">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Select PID
        </label>
        <select
          className="border border-gray-300 rounded-md shadow-sm p-2"
          onChange={(e) => onSelectPid(parseInt(e.target.value) || null)} // Parse selected PID to number or null
        >
          {pids.map((pid) => (
            <option key={pid} value={pid}>
              {pid}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProcessBar;
