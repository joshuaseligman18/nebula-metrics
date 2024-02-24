import React, { useEffect, useState } from 'react';
import LeaderboardBar from '../components/systemBar/LeaderBoardBar';
import Container from 'react-bootstrap/Container';
import ProcessChart from '../components/AgGrid/ProcessChart';
import { useAllProcesses } from "../hooks/useGetAllProcesses";
import { ProcessDataType } from '../types/processDataType';

const HomePage: React.FC = () => {
  const [latestProcesses, setLatestProcesses] = useState<Array<ProcessDataType>>([]);
  const { data: processData} = useAllProcesses();
  console.log(processData);

  useEffect(() => {
    // Will modularize and unit test for gonna add another committ
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-mode', /* condition */);
    }
  }, []);

  useEffect(() => {
    if (processData && processData.length > 0) {
      // Create a map to store the latest entries for each unique PID
      const latestProcessesMap = new Map();
  
      // Iterate through processData to find the latest entry for each unique PID
      processData.forEach((process: { pid: any; timestamp: any; start_time: any; }) => {
        const { pid, timestamp, start_time } = process;
        if (!latestProcessesMap.has(pid) || latestProcessesMap.get(pid).timestamp < timestamp) {
          const elapsedTimeSeconds = (timestamp - start_time);
          const minutes = (elapsedTimeSeconds / 60).toFixed(0);
          const seconds = (elapsedTimeSeconds % 600).toFixed(0);
          const formattedMinutes = String(minutes).padStart(2, '0');
          const formattedSeconds = String(seconds).padStart(2, '0');
          const elapsedTime = `${formattedMinutes} min ${formattedSeconds} sec`;
  
          // Add elapsedTime to the process object
          const processWithElapsedTime = { ...process, elapsedTime };
  
          // Update the map with the process object
          latestProcessesMap.set(pid, processWithElapsedTime);
        }
      });
  
      // Convert the map values to an array to get the latest process data
      const latestProcesses = Array.from(latestProcessesMap.values());
  
      // Set the state with the latest process data
      setLatestProcesses(latestProcesses);
    }
  }, [processData]);
  
  

  console.log(latestProcesses);

  return (
    <>
      <LeaderboardBar />
      <Container className="text-center mt-3 bg-dark p-4">
        <h1 className="text-2xl font-bold text-white">Process List</h1>
      </Container>
      <ProcessChart data={latestProcesses}/>
    </>
  );
};

export default HomePage;
