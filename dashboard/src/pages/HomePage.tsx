import React, { useEffect, useState } from "react";
import LeaderboardBar from "../components/systemBar/LeaderBoardBar";
import Container from "react-bootstrap/Container";
import ProcessChart from "../components/AgGrid/ProcessChart";
import { useAllProcesses } from "../hooks/useGetAllProcesses";
import { ProcessDataType } from "../types/processDataType";
import Spinner from "react-bootstrap/Spinner";
import { useMode } from "../context/ModeContext";

const HomePage: React.FC = () => {
  const { mode } = useMode();

  const [aliveProcesses, setAliveProcesses] = useState<Array<ProcessDataType>>([]);
  const [deadProcesses, setDeadProcesses] = useState<Array<ProcessDataType>>([]);
  const {
    data: processData,
    isLoading: loadingTable,
    isError: errorTable,
  } = useAllProcesses();
  console.log(processData);

  useEffect(() => {
    if (processData && processData.length > 0) {
      const aliveProcessesMap = new Map<string, ProcessDataType>(); // Map for alive processes
      const deadProcessesMap = new Map<string, ProcessDataType>(); // Map for dead processes
  
      processData.forEach((process: ProcessDataType) => {
        const { pid, timestamp, start_time, is_alive } = process;
        const elapsedTimeSeconds = timestamp - start_time;
        const minutes = (elapsedTimeSeconds / 60).toFixed(0);
        const seconds = (elapsedTimeSeconds % 600).toFixed(0);
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");
        const elapsedTime = `${formattedMinutes} min ${formattedSeconds} sec`;
  
        const processWithElapsedTime = { ...process, elapsedTime };
  
        // Check if the process is alive or dead and add it to the respective maps
        if (is_alive) {
          aliveProcessesMap.set(String(pid), processWithElapsedTime); // Add alive process to map
        } else {
          deadProcessesMap.set(String(pid), processWithElapsedTime); // Add dead process to map
        }
      });
  
      const aliveProcesses = Array.from(aliveProcessesMap.values());
      const deadProcesses = Array.from(deadProcessesMap.values());
      
      setAliveProcesses(aliveProcesses); // Set state for alive processes
      setDeadProcesses(deadProcesses); // Set state for dead processes
    }
  }, [processData]);

  console.log(aliveProcesses);
  console.log(deadProcesses);

  return (
    <div
      className={`mt-3 ${mode === "dark" ? "bg-dark text-white" : "bg-light text-black"} p-4`}
    >
      <LeaderboardBar />
      <Container
        fluid
        className={` ${mode === "dark" ? "bg-dark text-white" : "bg-light text-black"} p-4`}
      >
        <h1 className="text-2xl font-bold text-center mb-4">Active Process List</h1>
        {loadingTable ? (
          <div className="flex justify-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : errorTable ? (
          <div className="flex justify-center">Error fetching process data</div>
        ) : (
          <div className="flex justify-center">
            <ProcessChart data={aliveProcesses} />
          </div>
        )}
        <h1 className="text-2xl font-bold text-center mb-4 mt-4">InActive Process List</h1>
        {loadingTable ? (
          <div className="flex justify-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : errorTable ? (
          <div className="flex justify-center">Error fetching process data</div>
        ) : (
          <div className="flex justify-center">
            <ProcessChart data={deadProcesses} />
          </div>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
