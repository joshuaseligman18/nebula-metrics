import React from "react";

const SortingBar: React.FC = () => {
  return (
    <div className="bg-gray-200 p-4  h-100">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Sort CPU Data</label>
        {/* Dropdown for CPU data */}
        <select className="border border-gray-300 rounded-md shadow-sm p-2">
          {/* Options for sorting CPU data */}
          <option value="all">All</option>
          <option value="day">Last 24 hours</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
        </select>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">Sort Disk Data</label>
        {/* Dropdown for Disk data */}
        <select className="border border-gray-300 rounded-md shadow-sm p-2">
          {/* Options for sorting Disk data */}
          <option value="all">All</option>
          <option value="day">Last 24 hours</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
        </select>
      </div>
    </div>
  );
};

export default SortingBar;
