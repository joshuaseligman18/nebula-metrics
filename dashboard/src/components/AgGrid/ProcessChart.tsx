import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css'; 
import { ColDef } from 'ag-grid-community';

interface DataItem {
  id: number;
  user: string;
  cpuUsage: number;
  memoryUsage: number;
  elapsedTime: string;
  command: string;
}

interface ProcessChartProps {
  data: DataItem[];
}

const ProcessChart: React.FC<ProcessChartProps> = ({ data }) => {
  // Define initial column definitions using useState
  const [colDefs] = useState<ColDef<DataItem, any>[]>([
    { field: 'id', headerName: 'Process ID' },
    { field: 'user', headerName: 'User' },
    { field: 'cpuUsage', headerName: 'CPU Usage %' },
    { field: 'memoryUsage', headerName: 'Memory Usage %' },
    { field: 'elapsedTime', headerName: 'Elapsed Time' },
    { field: 'command', headerName: 'Exe Name' }
  ]);

  return (
    <div className="ag-theme-alpine-dark" style={{ width: '100%' }}>
      <AgGridReact rowData={data} columnDefs={colDefs} domLayout="autoHeight" />
    </div>
  );
};

export default ProcessChart;