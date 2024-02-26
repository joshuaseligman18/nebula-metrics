import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Spinner from "react-bootstrap/Spinner";
import DonutChart from "../graphs/DonutChart";
import { useGetCpuData } from "../../hooks/useGetCpuData";
import { useGetMemoryData } from "../../hooks/useGetMemoryData";
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
    avalible: number;
    used: number;
  } | null>(null);

  const [latestCpuData, setLatestCpuData] = useState<CpuData[] | null>(null);
  const [totalSystemUsage, setTotalSystemUsage] = useState<number | null>(null);

  const { data: cpuData, isLoading, isError } = useGetCpuData();

  const { data: memoryData } = useGetMemoryData();

  const { data: diskData } = useGetDiskData();

  useEffect(() => {
    if (cpuData && Array.isArray(cpuData)) {
      // Process the received data to extract unique cpu_core attributes
      const uniqueCores: Record<string, CpuData> = {};
      cpuData.forEach((core: CpuData) => {
        const cpuCore = core.cpu_core;
        if (!(cpuCore in uniqueCores)) {
          uniqueCores[cpuCore] = core;
        } else {
          // Check if the current data is newer than the one stored
          if (core.timestamp > uniqueCores[cpuCore].timestamp) {
            uniqueCores[cpuCore] = core;
          }
        }
      });

      // Get the latest two unique CPU cores
      const latestTwoCores = Object.values(uniqueCores).slice(-2);

      // Calculate the total usage for the latest two CPU cores
      let totalUsage = 0;
      latestTwoCores.forEach((core: CpuData) => {
        // Add the usage percentage of each core to the total usage
        totalUsage += core.usage;
      });

      // Convert the total usage to a percentage out of 100
      const totalUsagePercentage = totalUsage * 100;

      // Update the total system usage
      setTotalSystemUsage(totalUsagePercentage);

      // Set the latest CPU data for the latest two unique CPU cores
      setLatestCpuData(latestTwoCores);
    }
  }, [cpuData]); // Run the effect whenever cpuData changes

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

  useEffect(() => {
    if (diskData && diskData.length > 0) {
      // Create a map to store the latest entries for each unique disk name
      const latestEntriesMap = new Map();

      // Iterate through diskData to find the latest entry for each unique disk name
      diskData.forEach((disk: { device_name: any; timestamp: number }) => {
        if (!latestEntriesMap.has(disk.device_name)) {
          latestEntriesMap.set(disk.device_name, disk);
        } else {
          const currentLatestEntry = latestEntriesMap.get(disk.device_name);
          if (currentLatestEntry.timestamp < disk.timestamp) {
            latestEntriesMap.set(disk.device_name, disk);
          }
        }
      });

      // Initialize variables to hold total values
      let totalAvailable = 0;
      let totalUsed = 0;

      // Calculate the sum of values for the latest entries with unique disk names
      latestEntriesMap.forEach((entry) => {
        totalAvailable += entry.available;
        totalUsed += entry.used;
      });

      // Convert total values from MB to GB
      const totalAvailableInGB = totalAvailable / 1024;
      const totalUsedInGB = totalUsed / 1024;

      // Create an object representing the sum of values for the latest entries with unique disk names
      const latestDiskTotal = {
        avalible: totalAvailableInGB,
        used: totalUsedInGB,
        // You might want to include other properties here if needed
      };

      // Set the state with the total values
      setLatestDisk(latestDiskTotal);
    }
  }, [diskData]);

  console.log("MODE", mode);

  if (isLoading) {
    // Render loading spinner while loading
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }
  if (isError) return <div>Error fetching data</div>;

  return (
    <div
      className={`container mx-auto mt-3 ${mode === "dark" ? "dark-mode bg-dark" : "bg-light"}`}
    >
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${mode === "dark" ? "dark-mode bg-dark" : "bg-light"}`}
      >
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
              <Card.Title>CPU</Card.Title>
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
            </Card.Body>
          </Card>
        </div>
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
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
                  <b>Avalible RAM:</b>{" "}
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
                  <b>Avalible SWAPPED:</b>{" "}
                  {(
                    (latestMemory?.swap_total ?? 0) -
                    (latestMemory?.swap_free ?? 0)
                  ).toFixed(2)}{" "}
                  GB
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="w-full md:w-auto">
          <Card
            className={`bg-${mode === "dark" ? "dark" : "light"}-mode h-full ${mode === "dark" ? "bg-dark" : "bg-light"}`}
          >
            <Card.Body
              className={`flex flex-col items-center ${mode === "dark" ? "bg-secondary" : "bg-light"}`}
            >
              <Card.Title>Disk</Card.Title>
              <h5>
                <b>Usage</b>
              </h5>
              <div className="w-40 h-40">
                <DonutChart
                  total={latestDisk?.avalible ?? 0}
                  inUse={latestDisk?.used ?? 0}
                  width={150}
                  height={150}
                />
              </div>
              <div className="text-black text-center mt-2">
                <p>
                  <b>Total:</b> {(latestDisk?.avalible ?? 0).toFixed(2)} GB
                </p>
                <p>
                  <b>Used:</b> {(latestDisk?.used ?? 0).toFixed(2)} GB
                </p>
                <p>
                  <b>Available:</b>{" "}
                  {(
                    (latestDisk?.avalible ?? 0) - (latestDisk?.used ?? 0)
                  ).toFixed(2)}{" "}
                  GB
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
