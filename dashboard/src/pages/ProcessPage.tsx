import React, { useEffect, useState } from "react";
import ProcessBar from "../components/processes/ProcessBar";
import { ProcessDataType } from "../types/processDataType";
import { Card, Spinner } from "react-bootstrap";
import MemoryLineGraph from "../components/graphs/MemLineGraph";
import CpuLineGraph from "../components/graphs/CpuLineGraph";
import { useMode } from "../context/ModeContext";
import { useGetProcessData } from "../hooks/useGetProcess";

const ProcessPage: React.FC = () => {
  const { mode } = useMode();
  const { data,  isLoading:loadingTable, isError:errorTable } = useGetProcessData(319);
  console.log(data);

  // Preprocess CPU data
  const [cpuData, setCpuData] = useState([]);

  useEffect(() => {
    if (data) {
      const processedData = data.map((cpu: { timestamp: number; percent_cpu: number; }) => ({
        x: new Date(cpu.timestamp * 1000),
        y: cpu.percent_cpu * 100 // Assuming CPU percentage is in decimal form
      }));
      setCpuData(processedData);
    }
  }, [data]);

  const [memoryData, setMemoryData] = useState([]);

  useEffect(() => {
    if (data) {
      const processedMemoryData = data.map((memory: { timestamp: number; virtual_memory: number; resident_memory: number; }) => ({
        time: new Date(memory.timestamp * 1000),
        ram: (memory.virtual_memory - memory.resident_memory) / memory.virtual_memory * 100,
        swapped: 0 // Assuming no swap usage data is available
      }));
      setMemoryData(processedMemoryData);
    }
  }, [data]);

  const sampleProcess: ProcessDataType = {
    pid: 1234,
    exec: 'sample_executable',
    percent_cpu: 50,
    resident_memory: 1024 * 1024 * 512, // 512 MB in KB
    shared_memory: 1024 * 1024 * 256, // 256 MB in KB
    elapsedTime: '2 hours',
    total_cpu: 100,
    virtual_memory: 1024 * 1024 * 1024,
    cpu_core: 0,
    is_alive: false,
    start_time: 0,
    timestamp: 0
  };

  if (loadingTable) {
    // Render loading spinner while loading
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }  if (errorTable) return <div>Error fetching data</div>;
  
  return(
    <>
    <ProcessBar process={sampleProcess}/>
    <div
      className={`container-fluid px-0 mt-4 ${mode === "dark" ? "dark-mode" : "light-mode"}`}
    >
      <div className="row mx-0">
        <div className="col px-0 mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                CPU Usage Over Time
              </Card.Title>
              <CpuLineGraph data={cpuData} />
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row mx-0 mb-4">
        <div className="col px-0">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                Memory Usage Over Time
              </Card.Title>
              <MemoryLineGraph data={memoryData} />
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProcessPage;
