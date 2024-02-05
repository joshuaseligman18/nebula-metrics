import React, { useEffect } from 'react';
import LeaderboardBar from '../components/systemBar/LeaderBoardBar';
import Container from 'react-bootstrap/Container';

const HomePage: React.FC = () => {
  useEffect(() => {
    // Will modularize and unit test for gonna add another committ
    document.documentElement.classList.toggle('dark-mode', /* condition */);
  }, []);

  return (
    <>
      <LeaderboardBar />
      <Container className="text-center mt-3 bg-dark p-4">
        <h1 className="text-2xl font-bold text-white">Process List</h1>
      </Container>
    </>
  );
};

export default HomePage;
