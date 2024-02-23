import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import DonutChart from "../graphs/DonutChart";
import { useAllProcesses } from "../../hooks/useGetAllProcesses";
import { useGetCpuData } from "../../hooks/useGetCpuData";
import { useGetMemoryData } from "../../hooks/useGetMemoryData";
import { useGetDiskData } from "../../hooks/useGetDiskData";

const LeaderboardBar: React.FC = () => {
  const [latestMemory, setLatestMemory] = useState<{
    timestamp: number;
    total: number;
    free: number;
    swap_total: number;
    swap_free: number;
  } | null>(null);

  const { data: processData, isLoading, isError } = useAllProcesses();
  console.log(processData);

  const { data: cpuData } = useGetCpuData();
  console.log(cpuData);

  const { data: memoryData } = useGetMemoryData();
  console.log(memoryData);

  const { data: diskData } = useGetDiskData();
  console.log(diskData);

  useEffect(() => {
    // Apply dark mode toggle
    document.documentElement.classList.toggle("dark-mode");
  }, []);

  useEffect(() => {
    if (memoryData && memoryData.length > 0) {
      const latestMemoryEntry = memoryData[memoryData.length - 1];
      const totalInGB = latestMemoryEntry.total / (1024 * 1024);
      const freeInGB = latestMemoryEntry.free / (1024 * 1024);
      const swapTotalInGB = latestMemoryEntry.swap_total / (1024 * 1024);
      const swapFreeInGB = latestMemoryEntry.swap_free / (1024 * 1024);

      setLatestMemory({
        ...latestMemoryEntry,
        total: totalInGB,
        free: freeInGB,
        swap_total: swapTotalInGB,
        swap_free: swapFreeInGB,
      });
    }
  }, [memoryData]);

  // Sample variables for peak percentage use and average
  const peakPercentage = 80;
  const averagePercentage = 50;

  // Sample variables for Disk card
  const diskTotal = 500; // in GB
  const diskUsed = 250; // in GB
  const diskAvailable = diskTotal - diskUsed;

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching data</div>;

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
                  <DonutChart
                    total={latestMemory?.total ?? 0}
                    inUse={
                      (latestMemory?.total ?? 0) - (latestMemory?.free ?? 0)
                    }
                    width={150}
                    height={150}
                  />
                </div>
                <div className="w-40 h-40 flex flex-col items-center">
                  <h5 className="text-center">
                    <b>SWAPPED</b>
                  </h5>
                  <DonutChart
                    total={latestMemory?.swap_total ?? 0}
                    inUse={
                      (latestMemory?.swap_total ?? 0) -
                      (latestMemory?.swap_free ?? 0)
                    }
                    width={150}
                    height={150}
                  />
                </div>
              </div>
              <div className="text-black text-center mt-4">
                <p>
                  <b>Total RAM:</b> {(latestMemory?.total ?? 0).toFixed(2)} GB
                </p>
                <p>
                  <b>Avalible RAM:</b> {((latestMemory?.total ?? 0) - (latestMemory?.free ?? 0)).toFixed(2)} GB
                </p>
                <p>
                  <b>Total SWAPPED:</b>{" "}
                  {(latestMemory?.swap_total ?? 0).toFixed(2)} GB
                </p>
                <p>
                  <b>Avalible SWAPPED:</b> {((latestMemory?.swap_total ?? 0) - (latestMemory?.swap_free ?? 0)).toFixed(2)} GB
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
