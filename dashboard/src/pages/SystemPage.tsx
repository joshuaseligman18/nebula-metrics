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
  const [cpuMinuteValues, setCpuMinuteValues] = useState<string[]>([]); // State for formatted CPU minute values
  const { mode } = useMode();
  const [cpuData, setCpuData] = useState<{ x: Date; y: number }[]>([]);
  const [originalCpuData, setOriginalCpuData] = useState<
    { x: Date; y: number }[]
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

  useEffect(() => {
    if (rawCpuData) {
      const processedData: { x: Date; y: number }[] = [];
      const minuteSet: Set<string> = new Set(); // Use a Set to store unique timestamps

      rawCpuData.forEach((cpu: CpuData) => {
        const { timestamp, usage } = cpu;
        const date = new Date(timestamp * 1000);
        const hours =
          date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
        const amPm = date.getHours() >= 12 ? "PM" : "AM";
        const formattedTime = `${hours === 0 ? 12 : hours}:${date.getMinutes().toString().padStart(2, "0")} ${amPm}`;

        // Add the formatted timestamp to the Set
        minuteSet.add(formattedTime);
        processedData.push({ x: date, y: usage });
      });

      setCpuData(processedData);
      setOriginalCpuData(processedData);
      setOriginalCpuData(processedData);
      // Convert the Set to an array and set the state
      setCpuMinuteValues(Array.from(minuteSet));
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

  const handleMinuteRangeChange = (
    startMinute: string | null,
    endMinute: string | null
  ) => {
    if (
      startMinute &&
      endMinute &&
      cpuData.length > 0 &&
      memoryUsageData.length > 0
    ) {
      const startMinuteParts = startMinute.split(":");
      const endMinuteParts = endMinute.split(":");
      let startHour = parseInt(startMinuteParts[0]);
      const startMinuteValue = parseInt(startMinuteParts[1]);
      let endHour = parseInt(endMinuteParts[0]);
      const endMinuteValue = parseInt(endMinuteParts[1]);

      // Adjust hours for PM times
      if (startHour < 12) {
        startHour += 12;
      }
      if (endHour < 12) {
        endHour += 12;
      }

      // Get the date from the first CPU data point
      const firstDataDate = new Date(cpuData[0].x);
      const year = firstDataDate.getFullYear();
      const month = firstDataDate.getMonth();
      const day = firstDataDate.getDate();

      const startTimestamp = new Date(
        year,
        month,
        day,
        startHour,
        startMinuteValue
      ).getTime();
      const endTimestamp = new Date(
        year,
        month,
        day,
        endHour,
        endMinuteValue
      ).getTime();

      if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
        const filteredCpuData = cpuData.filter((data) => {
          const dataTimestamp = new Date(data.x).getTime();

          return (
            dataTimestamp >= startTimestamp && dataTimestamp <= endTimestamp
          );
        });

        const filteredMemoryData = memoryUsageData.filter((memory) => {
          const memoryTimestamp = memory.time.getTime();

          return (
            memoryTimestamp >= startTimestamp && memoryTimestamp <= endTimestamp
          );
        });

        setCpuData(filteredCpuData);
        setMemoryUsageData(filteredMemoryData);
      } else {
        console.error("Invalid startMinute or endMinute values.");
      }
    } else {
    }
  };

  const resetData = () => {
    console.log(originalCpuData);
    // Reset CPU data
    setCpuData(originalCpuData);

    // Reset memory usage data
    setMemoryUsageData(originalMemoryUsageData);
  };

  return (
    <div className="container-fluid px-0 mt-4 d-flex">
      <div style={{ flex: "1 0 10%" }}>
        <div className="d-flex flex-column h-100">
          <div className="flex-grow-1">
            <SortingBar
              cpuMinuteValues={cpuMinuteValues} // Pass CPU minute values here
              onMinuteRangeChange={handleMinuteRangeChange} // Pass event handler here
              resetData={resetData}
            />
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
