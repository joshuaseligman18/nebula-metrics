import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import DonutChart from "../graphs/DonutChart";
import { useGetCurrentCpuData } from "../../hooks/useGetCurrentCpu";
import { useGetCurrentMemoryData } from "../../hooks/useGetCurrentMemory";
import { useGetDiskData } from "../../hooks/useGetDiskData";
import { CpuData } from "../../types/cpuDataType";
import { useMode } from "../../context/ModeContext";

const LeaderboardBar: React.FC = () => {
  const { mode } = useMode();

  const [latestMemory, setLatestMemory] = useState<{
    timestamp: number;
    total: number;
    free: number;
    swap_total: number;
    swap_free: number;
  } | null>(null);

  const [latestDisk, setLatestDisk] = useState<{
    available: number;
    used: number;
  } | null>(null);

  const [latestCpuData, setLatestCpuData] = useState<CpuData[] | null>(null);
  const [totalSystemUsage, setTotalSystemUsage] = useState<number | null>(null);

  const {
    data: cpuData,
    isLoading: cpuLoading,
    isError: cpuError,
  } = useGetCurrentCpuData();

  const {
    data: memoryData,
    isLoading: memoryLoading,
    isError: memoryError,
  } = useGetCurrentMemoryData();
  

  const {
    data: diskData,
    isLoading: diskLoading,
    isError: diskError,
  } = useGetDiskData();

  useEffect(() => {
    if (cpuData && Array.isArray(cpuData) && cpuData.length > 0) {
      // Calculate total usage across all cores
      const totalUsage = cpuData.reduce((total, core) => total + core.usage, 0);
  
      // Calculate the total number of cores
      const totalCores = cpuData.reduce((total, core) => {
        if (!total.includes(core.cpu_core)) {
          total.push(core.cpu_core);
        }
        return total;
      }, []).length;
  
      // Update the total system usage
      setTotalSystemUsage((totalUsage * 100) / totalCores); // Convert to percentage
  
      // Set the latest CPU data
      setLatestCpuData(cpuData);
    }
  }, [cpuData]);

  useEffect(() => {
    if (memoryData && memoryData.length > 0) {
      const totalInGB = memoryData[memoryData.length - 1].total / (1024 * 1024);
      const freeInGB = memoryData[memoryData.length - 1].free / (1024 * 1024);
      const swapTotalInGB = memoryData[memoryData.length - 1].swap_total / (1024 * 1024);
      const swapFreeInGB = memoryData[memoryData.length - 1].swap_free / (1024 * 1024);

      setLatestMemory({
        ...memoryData[memoryData.length - 1],
        total: totalInGB,
        free: freeInGB,
        swap_total: swapTotalInGB,
        swap_free: swapFreeInGB,
      });
    }
  }, [memoryData]);

  useEffect(() => {
    if (diskData && diskData.length > 0) {
      // Initialize variables to hold total values
      let totalAvailable = 0;
      let totalUsed = 0;
  
      // Calculate the sum of available and used space for each disk
      diskData.forEach((disk: { available: number; used: number; }) => {
        totalAvailable += disk.available;
        totalUsed += disk.used;
      });
  
      // Convert total values from MB to GB
      const totalAvailableInGB = totalAvailable / 1024;
      const totalUsedInGB = totalUsed / 1024;
  
      // Create an object representing the sum of values for all disks
      const latestDiskTotal = {
        available: totalAvailableInGB,
        used: totalUsedInGB,
        // You might want to include other properties here if needed
      };
  
      // Set the state with the total values
      setLatestDisk(latestDiskTotal);
    }
  }, [diskData]);
  

  return (
    <div
      className={`container mx-auto mt-3 ${mode === "dark" ? "dark-mode bg-dark" : "bg-light"}`}
    >
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${mode === "dark" ? "dark-mode bg-dark" : "bg-light"}`}
      >
        {/* CPU Section */}
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
              <Card.Title>CPU</Card.Title>
              {cpuLoading ? (
                <Spinner animation="border" variant="primary" />
              ) : cpuError ? (
                <div>Error fetching CPU data</div>
              ) : (
                <>
                  <h5>
                    <b>Usage</b>
                  </h5>
                  <div className="w-40 h-40">
                    <DonutChart
                      total={100}
                      inUse={totalSystemUsage ?? 0}
                      width={150}
                      height={150}
                    />
                  </div>
                  <div className="text-black text-center mt-2">
                    <p>
                      <b>Used:</b>{" "}
                      {totalSystemUsage !== null
                        ? totalSystemUsage.toFixed(2)
                        : "N/A"}{" "}
                      %
                    </p>
                    <p>
                      <b>Cores:</b> {latestCpuData?.length}
                    </p>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Memory Section */}
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
              <Card.Title>Memory</Card.Title>
              {memoryLoading ? (
                <Spinner animation="border" variant="primary" />
              ) : memoryError ? (
                <div>Error fetching memory data</div>
              ) : (
                <>
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
                      <b>Total RAM:</b> {(latestMemory?.total ?? 0).toFixed(2)}{" "}
                      GB
                    </p>
                    <p>
                      <b>Used RAM:</b>{" "}
                      {(
                        (latestMemory?.total ?? 0) - (latestMemory?.free ?? 0)
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                    <p>
                      <b>Total SWAPPED:</b>{" "}
                      {(latestMemory?.swap_total ?? 0).toFixed(2)} GB
                    </p>
                    <p>
                      <b>Used SWAPPED:</b>{" "}
                      {(
                        (latestMemory?.swap_total ?? 0) -
                        (latestMemory?.swap_free ?? 0)
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Disk Section */}
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
              <Card.Title>Disk</Card.Title>
              {diskLoading ? (
                <Spinner animation="border" variant="primary" />
              ) : diskError ? (
                <div>Error fetching disk data</div>
              ) : (
                <>
                  <h5>
                    <b>Usage</b>
                  </h5>
                  <div className="w-40 h-40">
                    <DonutChart
                      total={
                        (latestDisk?.available ?? 0) + (latestDisk?.used ?? 0)
                      }
                      inUse={latestDisk?.used ?? 0}
                      width={150}
                      height={150}
                    />
                  </div>
                  <div className="text-black text-center mt-2">
                    <p>
                      <b>Total:</b>{" "}
                      {(
                        (latestDisk?.available ?? 0) + (latestDisk?.used ?? 0)
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                    <p>
                      <b>Used:</b> {(latestDisk?.used ?? 0).toFixed(2)} GB
                    </p>
                    <p>
                      <b>Available:</b> {(latestDisk?.available ?? 0).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardBar;
