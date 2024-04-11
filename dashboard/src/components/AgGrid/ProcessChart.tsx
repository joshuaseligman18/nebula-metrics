import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useNavigate } from "react-router-dom";
import { ColDef } from "ag-grid-community";
import { ProcessDataType } from "../../types/processDataType";
import { useMode } from "../../context/ModeContext";
import { useProcessContext } from "../../context/PIDcontext";

interface ProcessChartProps {
  data: ProcessDataType[];
}

const convertKBToGB = (value: number): string => {
  const valueInGB = value / (1024 * 1024); // Convert KB to GB
  return valueInGB.toFixed(2); // Return the value rounded to 2 decimal places as a string
};

const ProcessChart: React.FC<ProcessChartProps> = ({ data }) => {
  const { mode } = useMode(); // Get the mode from your context
  const navigate = useNavigate();
  const { setSelectedPID } = useProcessContext();

  // Memoize the column definitions to avoid unnecessary re-renders
  const colDefs = useMemo<ColDef<ProcessDataType, any>[]>(
    () => [
      { field: "pid", headerName: "PID" },
      { field: "exec", headerName: "Executable" },
      { field: "percent_cpu", headerName: "CPU %" },
      {
        field: "resident_memory",
        headerName: "Resident Memory (GB)",
        valueFormatter: (params) => convertKBToGB(params.value),
      },
      {
        field: "shared_memory",
        headerName: "Shared Memory (GB)",
        valueFormatter: (params) => convertKBToGB(params.value),
      },
      { field: "elapsedTime", headerName: "Elapsed Time" },
      { field: "total_cpu", headerName: "Total CPU" },
      {
        field: "virtual_memory",
        headerName: "Virtual Memory (GB)",
        valueFormatter: (params) => convertKBToGB(params.value),
      },
    ],
    [],
  ); // Empty dependency array ensures memoization only occurs once

  const handleRowClick = (event:any) => {
    const rowData = event.data as ProcessDataType;
    setSelectedPID(rowData.pid);
    navigate(`/process`);
  };

  return (
    <div
      className={`ag-theme-alpine${mode === "dark" ? "-dark" : ""}`}
      style={{ height: "100%", width: "85%" }}
    >
      <AgGridReact
        rowData={data}
        columnDefs={colDefs}
        domLayout="autoHeight"
        pagination={true}
        paginationPageSize={50}
        onRowClicked={handleRowClick}
        rowClass="cursor-pointer"
      />
    </div>
  );
};

export default ProcessChart;
