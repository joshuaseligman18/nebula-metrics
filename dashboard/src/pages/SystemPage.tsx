import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import DonutChart from "../components/graphs/DonutChart";
import CpuLineGraph from "../components/graphs/CpuLineGraph";
import MemoryLineGraph from "../components/graphs/MemLineGraph";
import { useGetCpuData } from "../hooks/useGetCpuData";
import { useGetMemoryData } from "../hooks/useGetMemoryData";
import { useGetDiskData } from "../hooks/useGetDiskData";
import { useMode } from "../context/ModeContext";
import { CpuData } from "../types/cpuDataType";
import DiskUsageAgGrid from "../components/AgGrid/DiskChart";
import { DiskUsageData } from "../types/diskUsageData";
import { Spinner } from "react-bootstrap";
import SortingBar from "../components/sorting/SortingBar";

const SystemPage: React.FC = () => {
  const { mode } = useMode();
  const [cpuData, setCpuData] = useState<{ x: Date; y: number }[]>([]);
  const {
    data: rawCpuData,
    isLoading: cpuLoading,
    isError: cpuError,
  } = useGetCpuData();
  const [memoryUsageData, setMemoryUsageData] = useState<
    { time: Date; ram: number; swapped: number }[]
  >([]);
  const {
    data: memoryData,
    isLoading: memoryLoading,
    isError: memoryError,
  } = useGetMemoryData();
  const [latestDisk, setLatestDisk] = useState<{
    avalible: number;
    used: number;
  } | null>(null);
  const {
    data: diskData,
    isLoading: diskLoading,
    isError: diskError,
  } = useGetDiskData();
  const [formattedDiskData, setFormattedDiskData] =
    useState<DiskUsageData | null>(null);
  console.log(diskData);

  useEffect(() => {
    if (rawCpuData) {
      const processedData: { x: Date; y: number }[] = [];
      const usageMap = new Map<number, number>();

      rawCpuData.forEach((cpu: CpuData) => {
        const { timestamp, usage } = cpu;
        if (usageMap.has(timestamp)) {
          const currentUsage = usageMap.get(timestamp) || 0;
          usageMap.set(timestamp, currentUsage + usage * 100);
        } else {
          usageMap.set(timestamp, usage);
        }
      });

      usageMap.forEach((usage, timestamp) => {
        processedData.push({ x: new Date(timestamp * 1000), y: usage });
      });

      setCpuData(processedData);
    }
  }, [rawCpuData]);

  useEffect(() => {
    if (memoryData) {
      const processedData: { time: Date; ram: number; swapped: number }[] = [];

      memoryData.forEach((memory: any) => {
        const { timestamp, free, total, swap_free, swap_total } = memory;
        const ramUsage = ((total - free) / total) * 100;
        const swappedUsage = ((swap_total - swap_free) / swap_total) * 100;

        processedData.push({
          time: new Date(timestamp * 1000),
          ram: ramUsage,
          swapped: swappedUsage,
        });
      });

      setMemoryUsageData(processedData);
    }
  }, [memoryData]);

  console.log(diskData);

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

  useEffect(() => {
    if (diskData) {
      // Group disk data by device_name
      const groupedData: Record<string, any> = {};
      diskData.forEach((disk: any) => {
        if (
          !(disk.device_name in groupedData) ||
          disk.timestamp > groupedData[disk.device_name].timestamp
        ) {
          // Include additional fields in the grouped data
          groupedData[disk.device_name] = {
            device_name: disk.device_name,
            available: disk.available,
            used: disk.used,
            fs_type: disk.fs_type,
            mount: disk.mount,
          };
        }
      });

      // Calculate total disk space and format disk usage data
      const totalDiskSpace = Object.values(groupedData).reduce(
        (total, disk) => total + disk.available + disk.used,
        0
      );
      const diskUsage = Object.values(groupedData).map((disk) => ({
        name: disk.device_name,
        space: (disk.available + disk.used) / 1024,
        // Include additional fields in the formatted data
        available: disk.available / 1024,
        fs_type: disk.fs_type,
        mount: disk.mount,
        timestamp: disk.timestamp,
      }));

      setFormattedDiskData({ totalDiskSpace, diskUsage });
    }
  }, [diskData]);

  return (
    <div className="container-fluid px-0 mt-4 d-flex">
      <div style={{ flex: "1 0 10%" }}>
        <div className="d-flex flex-column h-100">
          <div className="flex-grow-1">
            <SortingBar />
          </div>
        </div>
      </div>
      <div
        style={{ flex: "1 0 90%" }}
        className={`container-fluid px-0 mt-4 ${mode === "dark" ? "dark-mode" : "light-mode"}`}
      >
        {/* CPU Section */}
        <div className="col mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                CPU Usage Over Time
              </Card.Title>
              {cpuLoading ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "100%" }}
                >
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : cpuError ? (
                <div>Error fetching CPU data</div>
              ) : (
                <CpuLineGraph data={cpuData} />
              )}
            </Card.Body>
          </Card>
        </div>
        {/* Memory Section */}
        <div className="col mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                Memory Usage Over Time
              </Card.Title>
              {memoryLoading ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "100%" }}
                >
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : memoryError ? (
                <div>Error fetching memory data</div>
              ) : (
                <MemoryLineGraph data={memoryUsageData} />
              )}
            </Card.Body>
          </Card>
        </div>
        {/* Disk Section */}
        <div className="col">
          <Card className={`bg-${mode === "dark" ? "secondary" : "light"}`}>
            <Card.Body className="flex flex-col items-center">
              <h5 className="text-xl font-semibold mb-4">
                DISK Usage Over Time
              </h5>
              {diskLoading ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{ height: "100%" }}
                >
                  <Spinner animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                </div>
              ) : diskError ? (
                <div>Error fetching disk data</div>
              ) : (
                <div className="row">
                  {/* Left side */}
                  <div className="col-md-6">
                    {/* Disk Usage */}
                    <div className="mr-4">
                      {/* Donut Chart */}
                      <div
                        className="flex justify-center"
                        style={{ width: "250px", height: "250px" }}
                      >
                        <DonutChart
                          total={
                            (latestDisk?.avalible ?? 0) +
                            (latestDisk?.used ?? 0)
                          }
                          inUse={latestDisk?.used ?? 0}
                          width={50}
                          height={50}
                        />
                      </div>
                      {/* Disk Usage details */}
                      <div className="text-black text-left mt-2">
                        <p>
                          <b>Total:</b>{" "}
                          {(
                            latestDisk?.avalible ?? 0 + (latestDisk?.used ?? 0)
                          ).toFixed(2)}{" "}
                          GB
                        </p>
                        <p>
                          <b>Used:</b> {(latestDisk?.used ?? 0).toFixed(2)} GB
                        </p>
                        <p>
                          <b>Available:</b>{" "}
                          {(latestDisk?.avalible ?? 0).toFixed(2)} GB
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="col-md-6">
                    {/* Total Disk Storage */}
                    <div
                      className="flex justify-center"
                      style={{ width: "100%", height: "400px" }}
                    >
                      {formattedDiskData ? (
                        <DiskUsageAgGrid data={formattedDiskData} />
                      ) : (
                        <div>No data available</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
