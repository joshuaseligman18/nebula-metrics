import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

interface CpuLineGraphProps {
  data: {
    cpu_core: string;
    mhz: number;
    timestamp: Date;
    total_cache: number;
    usage: number;
  }[];
}

const CpuLineGraph: React.FC<CpuLineGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart<"line"> | null>(null);


  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const cores: Record<string, { mhz: number; cache: number }> = {};
    data.forEach((cpu) => {
      if (!Object.keys(cores).includes(cpu.cpu_core)) {
        cores[cpu.cpu_core] = { mhz: cpu.mhz, cache: cpu.total_cache };
      }
    });

    const dataSet = Object.entries(cores).map(([key, value]) => {
      return {
        label: `Core ${key} (${value.mhz} MHz | Cache ${value.cache} MB) `,
        data: data
          .filter(({ cpu_core }) => cpu_core.toString() === key)
          .map(({ timestamp, usage }) => ({ x: timestamp, y: usage * 100 })),
        borderWidth: 2,
        fill: false,
      };
    });

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          datasets: dataSet,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          resizeDelay: 0,
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
              text: "CPU Usage Over Time",
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
                text: "Usage (%)",
                color: "black", // Set y-axis color to black
                // Ensure Y-axis goes up to 100
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
    <div style={{height: "400px"}}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default CpuLineGraph;
