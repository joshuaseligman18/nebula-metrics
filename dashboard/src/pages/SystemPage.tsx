import React from "react";
import Card from "react-bootstrap/Card";
import DonutChart from "../components/graphs/DonutChart";
import DiskUsagePieChart from "../components/graphs/PieChart";
import CpuLineGraph from "../components/graphs/CpuLineGraph";
import MemoryLineGraph from "../components/graphs/MemLineGraph";

const SystemPage: React.FC = () => {
  // Sample data for Memory usage
  const cpuData = [
    { x: new Date("2024-02-14T00:00:00"), y: 10 },
    { x: new Date("2024-02-14T01:00:00"), y: 20 },
    { x: new Date("2024-02-14T02:00:00"), y: 30 },
  ];

  const memoryData = [
    { time: new Date("2024-02-14T00:00:00"), ram: 50, swapped: 20 },
    { time: new Date("2024-02-14T01:00:00"), ram: 60, swapped: 25 },
    { time: new Date("2024-02-14T02:00:00"), ram: 70, swapped: 30 },
    // Add more data points as needed
  ];

  //Sample data for Disk usage
  const diskUsageData = {
    totalDiskSpace: 1000,
    diskUsage: [
      { name: "Hard Drive", space: 400 },
      { name: "SSD", space: 300 },
      { name: "M.2", space: 200 },
      // Add more disks as needed
    ],
  };
  return (
    <div className="container-fluid px-0 mt-4">
      <div className="row mx-0">
        <div className="col px-0 mb-4">
          <Card className="bg-light-dark-mode" style={{ height: "450px" }}>
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
            className="bg-light-dark-mode h-100"
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
      <div className="row mx-0">
        <div className="col px-0">
          <Card className="bg-light-dark-mode h-100">
            <Card.Body className="flex flex-col items-center">
              <h5 className="text-xl font-semibold mb-4">
                DISK Usage Over Time
              </h5>
              <div className="flex">
                <div className="mr-4">
                  <h6 className="text-lg font-semibold mb-2">Disk Usage</h6>
                  <div className="flex justify-center">
                    <DonutChart
                      total={100}
                      inUse={25}
                      width={150}
                      height={150}
                    />
                  </div>
                </div>
                <div>
                  <h6 className="text-lg font-semibold mb-2">
                    Total Disk Storage
                  </h6>
                  <div className="flex justify-center">
                    <DiskUsagePieChart data={diskUsageData} />
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
