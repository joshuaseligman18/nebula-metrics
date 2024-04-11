import React, { useEffect, useState } from "react";
import ProcessBar from "../components/sorting/ProcessBar";
import { Card, Spinner } from "react-bootstrap";
import ProcessMemoryLineGraph from "../components/graphs/ProcessMemGraph";
import ProcessCpuLineGraph from "../components/graphs/ProcessCpuGraph";
import { useMode } from "../context/ModeContext";
import { useAllProcesses } from "../hooks/useGetAllProcesses";
import { useGetProcessData } from "../hooks/useGetProcess";
import { useProcessContext } from "../context/PIDcontext";
import { CpuData } from "../types/cpuDataType";

const ProcessPage: React.FC = () => {
  const { selectedPID } = useProcessContext();
  const { mode } = useMode();
  const [currentFilter, setCurrentFilter] = useState<{
    startTime: Date | null;
    endTime: Date | null;
  }>({ startTime: null, endTime: null });

  const {
    data: allProcessesData,
    isLoading: processLoad,
    isError: processesError,
  } = useAllProcesses(); // Get all processes data

  const {
    data: processData,
    isLoading: loadingTable,
    isError: errorTable,
    refetch,
  } = useGetProcessData(selectedPID || 1);

  useEffect(() => {
    // Fetch process data whenever selectedPID changes
    refetch();
  }, [selectedPID, refetch]);

  const [cpuData, setCpuData] = useState([]);

  useEffect(() => {
    if (processData) {
      const processedData = processData
        .filter((data: CpuData) => {
          const timestampDate: Date = new Date(data.timestamp * 1000);
          let valid: boolean = true;
          if (currentFilter.startTime) {
            valid = valid && timestampDate >= currentFilter.startTime;
          }

          if (currentFilter.endTime) {
            valid = valid && timestampDate <= currentFilter.endTime;
          }
          return valid;
        })
        .map((cpu: { timestamp: number; percent_cpu: number }) => ({
          x: new Date(cpu.timestamp * 1000),
          y: cpu.percent_cpu * 100, // Assuming CPU percentage is in decimal form
        }));
      setCpuData(processedData);
    }
  }, [processData, currentFilter]);

  const [memoryData, setMemoryData] = useState([]);

  useEffect(() => {
    if (processData) {
      const processedMemoryData = processData
        .filter((data: CpuData) => {
          const timestampDate: Date = new Date(data.timestamp * 1000);
          let valid: boolean = true;
          if (currentFilter.startTime) {
            valid = valid && timestampDate >= currentFilter.startTime;
          }

          if (currentFilter.endTime) {
            valid = valid && timestampDate <= currentFilter.endTime;
          }
          return valid;
        })
        .map((memory: { timestamp: number; resident_memory: number }) => ({
          time: new Date(memory.timestamp * 1000),
          ram: memory.resident_memory / 1000,
        }));
      setMemoryData(processedMemoryData);
    }
  }, [processData, currentFilter]);

  return (
    <div className="container-fluid px-0 mt-4 d-flex" >
      <div style={{ flex: "1 0 15%" }}>
        <div className="d-flex flex-column h-100">
          <div className="flex-grow-1">
            {processLoad ? (
              <Spinner animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            ) : processesError ? (
              <div>Error fetching process data</div>
            ) : (
              <ProcessBar
                pids={Array.from(
                  new Set(allProcessesData.map((process: any) => process.pid)),
                )} // Pass unique PIDs
                allProcessesData={allProcessesData} // Pass allProcessesData to ProcessBar
                setCurrentFilter={setCurrentFilter}
              />
            )}
          </div>
        </div>
      </div>
      <div
        style={{ flex: "1 0 80%" }}
        className={`container-fluid px-0 mt-4 ${
          mode === "dark" ? "dark-mode" : "light-mode"
        }`}
      >
        {/* CPU and Memory Sections */}
        <div className="col mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                CPU Usage Over Time
              </Card.Title>
              {loadingTable ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "100%" }}
                >
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : errorTable ? (
                <div>Error fetching CPU data</div>
              ) : (
                <ProcessCpuLineGraph data={cpuData} />
              )}
            </Card.Body>
          </Card>
        </div>
        <div className="col mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                Memory Usage Over Time
              </Card.Title>
              {loadingTable ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "100%" }}
                >
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : errorTable ? (
                <div>Error fetching memory data</div>
              ) : (
                <ProcessMemoryLineGraph data={memoryData} />
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcessPage;
