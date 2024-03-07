import React from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";
import { DiskUsageData } from "../../types/diskUsageData";
import { useMode } from "../../context/ModeContext";

const DiskUsageAgGrid: React.FC<{ data: DiskUsageData }> = ({ data }) => {
  const { mode } = useMode(); // Get the mode from your context
  const columnDefs: ColDef[] = [
    { headerName: "Name", field: "name", width: 150 },
    {
      headerName: "Space (GB)",
      field: "space",
      valueFormatter: formatGB,
      width: 120,
    },
    {
      headerName: "Available (GB)",
      field: "available",
      valueFormatter: formatGB,
      width: 150,
    },
    { headerName: "File System Type", field: "fs_type", width: 150 },
    { headerName: "Mount Point", field: "mount", width: 150 },
  ];

  function formatGB(params: any) {
    return params.value.toFixed(2);
  }

  return (
    <div
      className={`ag-theme-alpine${mode === "dark" ? "-dark" : ""}`}
      style={{ height: "300px", width: "750px" }}
    >
      <AgGridReact
        rowData={data.diskUsage}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={10}
      ></AgGridReact>
    </div>
  );
};

export default DiskUsageAgGrid;
