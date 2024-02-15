import React, { useRef, useEffect } from "react";
import { Chart } from "chart.js/auto"; 

interface DiskUsageData {
  totalDiskSpace: number;
  diskUsage: { name: string; space: number }[];
}

const DiskUsagePieChart: React.FC<{ data: DiskUsageData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    if (ctx) {
      Chart.getChart(ctx)?.destroy();

      new Chart(ctx, {
        type: "pie",
        data: {
          labels: data.diskUsage.map((entry) => entry.name),
          datasets: [
            {
              data: data.diskUsage.map((entry) => entry.space),
              backgroundColor: [
                "rgba(0, 255, 255, 0.5)", // Light cyan
                "rgba(0, 191, 191, 0.5)", // Cyan
                "rgba(0, 127, 127, 0.5)", // Dark cyan
                // Add more shades of cyan here as needed
              ],
              borderColor: "rgba(255, 255, 255, 0.5)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "black",
              },
            },
          },
          elements: {
            arc: {
              borderWidth: 1,
            },
          },
        },
      });
    }
  }, [data]);

  return <canvas ref={chartRef} width={165} height={165}></canvas>;
};

export default DiskUsagePieChart;
