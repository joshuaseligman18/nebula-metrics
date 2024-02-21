import React, { useEffect } from 'react';
import LeaderboardBar from '../components/systemBar/LeaderBoardBar';
import Container from 'react-bootstrap/Container';
import ProcessChart from '../components/AgGrid/ProcessChart';
import { useAllProcesses } from '../hooks/useGetAllProcesses';

const HomePage: React.FC = () => {
  const { data:processData, isLoading, isError } = useAllProcesses();
  console.log(processData);

  
  useEffect(() => {
    // Will modularize and unit test for gonna add another committ
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-mode', /* condition */);
    }
  }, []);

  const data = [
    { id: 1, user: 'User 1', cpuUsage: 10, memoryUsage: 20, elapsedTime: '1h', command: 'Command 1' },
    { id: 2, user: 'User 2', cpuUsage: 15, memoryUsage: 25, elapsedTime: '2h', command: 'Command 2' },
    // Add more data as needed
  ];

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching data</div>

  return (
    <>
      <LeaderboardBar />
      <Container className="text-center mt-3 bg-dark p-4">
        <h1 className="text-2xl font-bold text-white">Process List</h1>
      </Container>
      <ProcessChart data={data}/>
    </>
  );
};

export default HomePage;
