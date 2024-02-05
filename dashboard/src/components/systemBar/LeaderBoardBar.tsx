import React, { useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const LeaderboardBar: React.FC = () => {
  useEffect(() => {
    //Same Will document and probably make the mode a redux thing
    document.documentElement.classList.toggle('dark-mode', /* condition */);
  }, []);

  return (
    <Row className="mt-3 bg-dark p-4">
      <Col md={4}>
        <Card className="bg-light-dark-mode">
          <Card.Body>
            <Card.Title>CPU</Card.Title>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="bg-light-dark-mode">
          <Card.Body>
            <Card.Title>Memory</Card.Title>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="bg-light-dark-mode">
          <Card.Body>
            <Card.Title>Disk</Card.Title>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default LeaderboardBar;
