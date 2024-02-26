import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import DonutChart from "../components/graphs/DonutChart";
import DiskUsagePieChart from "../components/graphs/PieChart";
import CpuLineGraph from "../components/graphs/CpuLineGraph";
import MemoryLineGraph from "../components/graphs/MemLineGraph";
import { useGetCpuData } from "../hooks/useGetCpuData";
import { useGetMemoryData } from "../hooks/useGetMemoryData";
import { useGetDiskData } from "../hooks/useGetDiskData";
import { useMode } from "../context/ModeContext";
import { CpuData } from "../types/cpuDataType";

const SystemPage: React.FC = () => {
  const { mode } = useMode();
  const [cpuData, setCpuData] = useState<{ x: Date; y: number }[]>([]);
  const { data: rawCpuData } = useGetCpuData();
  const [memoryUsageData, setMemoryUsageData] = useState<
    { time: Date; ram: number; swapped: number }[]
  >([]);
  const { data: memoryData } = useGetMemoryData();
  const [latestDisk, setLatestDisk] = useState<{
    avalible: number;
    used: number;
  } | null>(null);
  const { data: diskData } = useGetDiskData();
  const [formattedDiskData, setFormattedDiskData] = useState<{
    totalDiskSpace: number;
    diskUsage: { name: string; space: number }[];
  } | null>(null);
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
          groupedData[disk.device_name] = disk;
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
      }));

      setFormattedDiskData({ totalDiskSpace, diskUsage });
    }
  }, [diskData]);

  return (
    <div
      className={`container-fluid px-0 mt-4 ${mode === "dark" ? "dark-mode" : "light-mode"}`}
    >
      <div className="row mx-0">
        <div className="col px-0 mb-4">
          <Card
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
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
            className={`bg-${mode === "dark" ? "secondary" : "light"}`}
            style={{ height: "450px" }}
          >
            <Card.Body>
              <Card.Title className="text-xl font-semibold mb-4 text-center">
                Memory Usage Over Time
              </Card.Title>
              <MemoryLineGraph data={memoryUsageData} />
            </Card.Body>
          </Card>
        </div>
      </div>
      <div className="row mx-0">
        <div className="col px-0">
          <Card className={`bg-${mode === "dark" ? "secondary" : "light"}`}>
            <Card.Body className="flex flex-col items-center">
              <h5 className="text-xl font-semibold mb-4">
                DISK Usage Over Time
              </h5>
              <div className="flex">
                <div className="mr-4">
                  <h6 className="text-lg font-semibold mb-2">Disk Usage</h6>
                  <div className="flex justify-center">
                    <DonutChart
                      total={
                        (latestDisk?.avalible ?? 0) + (latestDisk?.used ?? 0)
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
                        (latestDisk?.avalible ?? 0) + (latestDisk?.used ?? 0)
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                    <p>
                      <b>Used:</b> {(latestDisk?.used ?? 0).toFixed(2)} GB
                    </p>
                    <p>
                      <b>Available:</b> {(latestDisk?.avalible ?? 0).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                </div>
                <div>
                  <h6 className="text-lg font-semibold mb-2">
                    Total Disk Storage
                  </h6>
                  <div className="flex justify-center">
                    {formattedDiskData && (
                      <DiskUsagePieChart data={formattedDiskData} />
                    )}
                  </div>
                  <div className="text-black text-center mt-2">
                    <p>
                      {formattedDiskData &&
                        formattedDiskData.diskUsage.map((disk, index) => (
                          <p key={index}>
                            <b>{disk.name}:</b> {disk.space.toFixed(2)} GB
                          </p>
                        ))}
                    </p>
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
