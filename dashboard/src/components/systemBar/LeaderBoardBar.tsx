import React, { useEffect } from "react";
import Card from "react-bootstrap/Card";
import DonutChart from "../graphs/DonutChart";

const LeaderboardBar: React.FC = () => {
  useEffect(() => {
    // Apply dark mode toggle
    document.documentElement.classList.toggle("dark-mode");
  }, []);

  // Sample variables for peak percentage use and average
  const peakPercentage = 80;
  const averagePercentage = 50;

  // Sample variables for Disk card
  const diskTotal = 500; // in GB
  const diskUsed = 250; // in GB
  const diskAvailable = diskTotal - diskUsed;

  return (
    <div className="container mx-auto mt-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="w-full md:w-auto">
          <Card className="bg-light-dark-mode h-full">
            <Card.Body className="flex flex-col items-center">
              <Card.Title>CPU</Card.Title>
              <h5>
                <b>Usage</b>
              </h5>
              <div className="w-40 h-40">
                <DonutChart total={100} inUse={25} width={150} height={150} />
              </div>
              <div className="text-black text-center mt-2">
                <p>
                  <b>Peak:</b> {peakPercentage}%
                </p>
                <p>
                  <b>Average:</b> {averagePercentage}%
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="w-full md:w-auto">
          <Card className="bg-light-dark-mode h-full">
            <Card.Body className="flex flex-col items-center">
              <Card.Title>Memory</Card.Title>

              <div className="flex justify-center items-center flex-col md:flex-row">
                <div className="w-40 h-40  flex flex-col items-center">
                  <h5 className="text-center">
                    <b>RAM</b>
                  </h5>
                  <DonutChart total={100} inUse={25} width={150} height={150} />
                </div>
                <div className="w-40 h-40 flex flex-col items-center">
                  <h5 className="text-center">
                    <b>SWAPPED</b>
                  </h5>
                  <DonutChart total={100} inUse={25} width={150} height={150} />
                </div>
              </div>
              <div className="text-black text-center mt-2">
                <p>
                  <b>Peak:</b> {peakPercentage}%
                </p>
                <p>
                  <b>Average:</b> {averagePercentage}%
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="w-full md:w-auto">
          <Card className="bg-light-dark-mode h-full">
            <Card.Body className="flex flex-col items-center">
              <Card.Title>Disk</Card.Title>
              <h5>
                <b>Usage</b>
              </h5>
              <div className="w-40 h-40">
                <DonutChart total={100} inUse={25} width={150} height={150} />
              </div>
              <div className="text-black text-center mt-2">
                <p>
                  <b>Total:</b> {diskTotal} GB
                </p>
                <p>
                  <b>Used:</b> {diskUsed} GB
                </p>
                <p>
                  <b>Available:</b> {diskAvailable} GB
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardBar;
