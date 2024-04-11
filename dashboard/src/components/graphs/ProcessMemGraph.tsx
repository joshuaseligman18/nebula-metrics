import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

interface MemoryLineGraphProps {
  data: { time: Date; ram: number; swapped: number }[];
}

const ProcessMemoryLineGraph: React.FC<MemoryLineGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart<"line"> | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map((d) => d.time),
          datasets: [
            {
              label: "Resident Memory Usage",
              data: data.map((d) => ({ x: d.time, y: d.ram })),
              borderColor: "cyan",
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          elements: {
            point: {
              radius: 0,
              hoverRadius: 4,
            },
          },
          animation: {
            duration: 0,
          },
          plugins: {
            title: {
              display: true,
              text: "Memory Usage Over Time",
              font: {
                size: 14,
              },
              color: "black", // Set title color to black
            },
            legend: {
              display: true,
              labels: {
                color: "black", // Set legend text color to black
              },
            },
          },
          scales: {
            x: {
              type: "time",
              time: {
                unit: "minute",
              },
              title: {
                display: true,
                text: "Time",
                color: "black", // Set x-axis color to black
              },
              ticks: {
                color: "black", // Set x-axis ticks color to black
              },
            },
            y: {
              title: {
                display: true,
                text: "Resident Memory Total (MB)",
                color: "black", // Set y-axis color to black
              },
              ticks: {
                color: "black", // Set y-axis ticks color to black
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <canvas ref={chartRef} style={{ width: "100%", maxHeight: "400px" }} />
  );
};

export default ProcessMemoryLineGraph;
