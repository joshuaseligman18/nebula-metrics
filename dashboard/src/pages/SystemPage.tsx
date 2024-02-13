import React from 'react';
import Card from 'react-bootstrap/Card';
import MemoryLineGraph from '../components/graphs/MemLineGraph';
import CpuLineGraph from '../components/graphs/CpuLineGraph';
import DiskUsagePieChart from '../components/graphs/PieChart';
import DonutChart from '../components/graphs/DonutChart';

const SystemPage: React.FC = () => {
  // Sample data for CPU and Memory usage
  const cpuData = [
    { time: new Date('2024-02-10T10:00:00Z'), usage: 20 },
    { time: new Date('2024-02-10T10:10:00Z'), usage: 30 },
    { time: new Date('2024-02-10T10:20:00Z'), usage: 40 },
    // Add more data points as needed
  ];

  // Sample data for Memory usage
  const memoryData = [
    { time: new Date('2024-02-10T10:00:00Z'), ram: 40, swapped: 10 },
    { time: new Date('2024-02-10T10:10:00Z'), ram: 50, swapped: 20 },
    { time: new Date('2024-02-10T10:20:00Z'), ram: 60, swapped: 30 },
    // Add more data points as needed
  ];

  //Sample data for Disk usage
  const diskUsageData = {
    totalDiskSpace: 1000, 
    diskUsage: [
      { name: '1', space: 400 },
      { name: '2', space: 300 },
      { name: '3', space: 200 },
      // Add more disks as needed
    ],
  };


  return (
    <div className="container-fluid px-0 mt-4">
      <div className="row mx-0">
        <div className="col px-0 mb-4">
          <Card className="bg-light-dark-mode h-100">
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">CPU Usage Over Time</Card.Title>
              <CpuLineGraph data={cpuData} />
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row mx-0 mb-4">
        <div className="col px-0">
          <Card className="bg-light-dark-mode h-100">
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">Memory Usage Over Time</Card.Title>
              <MemoryLineGraph data={memoryData} />
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row mx-0">
        <div className="col px-0">
          <Card className="bg-light-dark-mode h-100">
            <Card.Body className="flex flex-col items-center">
              <h5 className="text-xl font-semibold mb-4">DISK Usage Over Time</h5>
              <div className="flex">
                <div className="mr-4">
                  <h6 className="text-lg font-semibold mb-2">Disk Usage</h6>
                  <div className="flex justify-center">
                    <DiskUsagePieChart data={diskUsageData} />
                  </div>
                </div>
                <div>
                  <h6 className="text-lg font-semibold mb-2">Total Disk Storage</h6>
                  <div className="flex justify-center">
                    <DonutChart total={100} inUse={60} />
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
