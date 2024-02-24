import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css'; 
import { ColDef } from 'ag-grid-community';
import { ProcessDataType } from '../../types/processDataType';

interface ProcessChartProps {
  data: ProcessDataType[];
}

const convertKBToGB = (value: number): string => {
  const valueInGB = value / (1024 * 1024); // Convert KB to GB
  return valueInGB.toFixed(2); // Return the value rounded to 2 decimal places as a string
};


const ProcessChart: React.FC<ProcessChartProps> = ({ data }) => {
  // Define initial column definitions using useState
  const [colDefs] = useState<ColDef<ProcessDataType, any>[]>([
    { field: 'pid', headerName: 'PID' },
    { field: 'exec', headerName: 'Executable' },
    { field: 'percent_cpu', headerName: 'CPU %' },
    { field: 'resident_memory', headerName: 'Resident Memory (GB)', valueFormatter: (params) => convertKBToGB(params.value) },
    { field: 'shared_memory', headerName: 'Shared Memory (GB)', valueFormatter: (params) => convertKBToGB(params.value) },
    { field: 'elapsedTime', headerName: 'Elapsed Time'},
    { field: 'total_cpu', headerName: 'Total CPU' },
    { field: 'virtual_memory', headerName: 'Virtual Memory (GB)', valueFormatter: (params) => convertKBToGB(params.value) }
  ]);

  return (
    <div className="ag-theme-alpine-dark" style={{ width: '100%' }}>
      <AgGridReact rowData={data} columnDefs={colDefs} domLayout="autoHeight" />
    </div>
  );
};

export default ProcessChart;
