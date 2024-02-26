import React, { useEffect, useState } from 'react';
import LeaderboardBar from '../components/systemBar/LeaderBoardBar';
import Container from 'react-bootstrap/Container';
import ProcessChart from '../components/AgGrid/ProcessChart';
import { useAllProcesses } from "../hooks/useGetAllProcesses";
import { ProcessDataType } from '../types/processDataType';
import Spinner from 'react-bootstrap/Spinner';
import { useMode } from '../context/ModeContext';


const HomePage: React.FC = () => {
  const { mode } = useMode(); 

  const [latestProcesses, setLatestProcesses] = useState<Array<ProcessDataType>>([]);
  const { data: processData, isLoading:loadingTable, isError:errorTable} = useAllProcesses();

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
  

  if (loadingTable) {
    // Render loading spinner while loading
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }  if (errorTable) return <div>Error fetching data</div>;

  return (
    <div className={`mt-3 ${mode === 'dark' ? 'bg-dark text-white' : 'bg-light text-black'} p-4`}>
      <LeaderboardBar />
      <Container fluid className={` ${mode === 'dark' ? 'bg-dark text-white' : 'bg-light text-black'} p-4`}>
        <h1 className="text-2xl font-bold text-center mb-4">Process List</h1>
        <div className="flex justify-center">
          <ProcessChart data={latestProcesses}/>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;
