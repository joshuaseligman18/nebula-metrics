import React, { useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import DonutChart from '../graphs/DonutChart';

const LeaderboardBar: React.FC = () => {
  useEffect(() => {
    // Same Will document and probably make the mode a redux thing
    document.documentElement.classList.toggle('dark-mode', /* condition */);
  }, []);

  // Sample variables for peak percentage use and average
  const peakPercentage = 80;
  const averagePercentage = 50;

  // Sample variables for Disk card
  const diskTotal = 500; // in GB
  const diskUsed = 250; // in GB
  const diskAvailable = diskTotal - diskUsed;

  return (
    <Row className="mt-3 bg-dark p-4">
  <Col lg={4} className="mb-3">
    <Card className="bg-light-dark-mode h-100">
      <Card.Body className="d-flex flex-column align-items-center">
        <Card.Title>CPU</Card.Title>
        <div className="d-flex flex-column align-items-center justify-content-center">
          <DonutChart total={100} inUse={60} />
          <div className="text-black" style={{ textAlign: 'center', marginTop: '10px' }}>
            <p className="m-0" style={{ lineHeight: '1.5' }}><b>Peak:</b> {peakPercentage}%</p>
            <p className="m-0" style={{ lineHeight: '1.5' }}><b>Average:</b> {averagePercentage}%</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  </Col>
  <Col lg={4} className="mb-3">
    <Card className="bg-light-dark-mode h-100">
      <Card.Body className="d-flex flex-column justify-content-between">
        <Card.Title className="text-center">Memory</Card.Title>
        <Row>
          <Col sm={6} className="d-flex flex-column align-items-center justify-content-center">
            <h5><b>RAM</b></h5>
            <DonutChart total={100} inUse={60} />
            <div className="text-black" style={{ textAlign: 'center', marginTop: '10px' }}>
              <p className="m-0" style={{ lineHeight: '1.5' }}><b>Peak:</b> {peakPercentage}%</p>
              <p className="m-0" style={{ lineHeight: '1.5' }}><b>Average:</b> {averagePercentage}%</p>
            </div>
          </Col>
          <Col sm={6} className="d-flex flex-column align-items-center justify-content-center">
            <h5><b>SWAPPED</b></h5>
            <DonutChart total={100} inUse={60} />
            <div className="text-black" style={{ textAlign: 'center', marginTop: '10px' }}>
              <p className="m-0" style={{ lineHeight: '1.5' }}><b>Peak:</b> {peakPercentage}%</p>
              <p className="m-0" style={{ lineHeight: '1.5' }}><b>Average:</b> {averagePercentage}%</p>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  </Col>
  <Col lg={4} className="mb-3">
    <Card className="bg-light-dark-mode h-100">
      <Card.Body className="d-flex flex-column align-items-center justify-content-center">
        <Card.Title>Disk</Card.Title>
        <div className="d-flex flex-column align-items-center justify-content-center">
          <DonutChart total={100} inUse={60} />
          <div className="text-black" style={{ textAlign: 'center', marginTop: '10px' }}>
            <p className="m-0" style={{ lineHeight: '1.5' }}><b>Total:</b> {diskTotal} GB</p>
            <p className="m-0" style={{ lineHeight: '1.5' }}><b>Used:</b> {diskUsed} GB</p>
            <p className="m-0" style={{ lineHeight: '1.5' }}><b>Available:</b> {diskAvailable} GB</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  </Col>
</Row>


  );
};

export default LeaderboardBar;
