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
  const [cpuData, setCpuData] = useState<
    {
      cpu_core: string;
      mhz: number;
      timestamp: Date;
      total_cache: number;
      usage: number;
    }[]
  >([]);
  const [originalCpuData, setOriginalCpuData] = useState<
    {
      cpu_core: string;
      mhz: number;
      timestamp: Date;
      total_cache: number;
      usage: number;
    }[]
  >([]);
  const [originalMemoryUsageData, setOriginalMemoryUsageData] = useState<
    { time: Date; ram: number; swapped: number }[]
  >([]);
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

  const [currentFilter, setCurrentFilter] = useState<{
    startTime: Date | null;
    endTime: Date | null;
  }>({ startTime: null, endTime: null });

  useEffect(() => {
    if (rawCpuData) {
      const processedData = rawCpuData.map((cpu: CpuData) => {
        return {
          cpu_core: cpu.cpu_core,
          mhz: cpu.mhz,
          timestamp: new Date(cpu.timestamp * 1000),
          total_cache: cpu.total_cache,
          usage: cpu.usage,
        };
      });

      setOriginalCpuData(processedData);
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

      setOriginalMemoryUsageData(processedData);
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
        0,
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

  useEffect(() => {
    const filteredCpuData = originalCpuData.filter((data) => {
      let valid: boolean = true;
      if (currentFilter.startTime) {
        valid = valid && data.timestamp >= currentFilter.startTime;
      }

      if (currentFilter.endTime) {
        valid = valid && data.timestamp <= currentFilter.endTime;
      }
      return valid;
    });
    setCpuData(filteredCpuData);
  }, [originalCpuData, currentFilter]);

  useEffect(() => {
    const filteredMemoryData = originalMemoryUsageData.filter((memory) => {
      let valid: boolean = true;
      if (currentFilter.startTime) {
        valid = valid && memory.time >= currentFilter.startTime;
      }

      if (currentFilter.endTime) {
        valid = valid && memory.time <= currentFilter.endTime;
      }
      return valid;
    });
    setMemoryUsageData(filteredMemoryData);
  }, [originalMemoryUsageData, currentFilter]);

  return (
    <div className="container-fluid px-0 mt-4 d-flex flex-wrap">
      {/* Sorting Bar */}
      <div style={{ flex: "0 0 15%", minWidth: "205px", height: "100vh" }}>
        <SortingBar setCurrentFilter={setCurrentFilter} />
      </div>
      <div
        className={`container-fluid px-0 mt-4 ${mode === "dark" ? "dark-mode" : "light-mode"}`}
        style={{ flex: "1 0 70%", overflowY: "auto" }}
      >
        {/* CPU Section */}
        <div style={{ marginBottom: "10px" }}>
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "100%" }}
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
                <div className="text-center">Error fetching CPU data</div>
              ) : cpuData.length > 0 ? (
                <CpuLineGraph data={cpuData} />
              ) : (
                <div className="text-center">No CPU data available</div>
              )}
            </Card.Body>
          </Card>
        </div>
        {/* Memory Section */}
        <div style={{ marginBottom: "10px" }}>
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
                <div className="text-center">Error fetching memory data</div>
              ) : memoryUsageData.length > 0 ? (
                <MemoryLineGraph data={memoryUsageData} />
              ) : (
                <div className="text-center">No Memory data available</div>
              )}
            </Card.Body>
          </Card>
        </div>
        {/* Disk Section */}
        <div>
          <Card className={`bg-${mode === "dark" ? "secondary" : "light"}`}>
            <Card.Body className="flex flex-col items-center">
              <h5 className="text-xl font-semibold mb-4">
                DISK Usage Over Time
              </h5>
              {diskLoading ? (
                <div
                  className="d-flex justify-content-center justify-between align-items-center"
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
                  <div className="col-md-4">
                    <div className="mr-4 pr-4">
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
                  <div className="col-md-8">
                    <div className="flex justify-center">
                      <div
                        className="table-responsive"
                        style={{ minWidth: "100%" }}
                      >
                        {formattedDiskData ? (
                          <div style={{ width: "100%", minWidth: "100%" }}>
                            <DiskUsageAgGrid data={formattedDiskData} />
                          </div>
                        ) : (
                          <div>No data available</div>
                        )}
                      </div>
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
