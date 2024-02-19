import Chart from "chart.js/auto";
import type { ChartOptions } from "chart.js";
import { useRef, useEffect } from "react";

interface DonutChartProps {
  total: number;
  inUse: number;
  width: number;
  height: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
  total,
  inUse,
  width,
  height,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();

  useEffect(() => {
    if (!chartRef.current) return;

    const data = {
      labels: ["In Use", "Available"],
      datasets: [
        {
          data: [inUse, total - inUse],
          backgroundColor: ["#ff7f0e", "#1f77b4"],
          borderColor: "black",
          borderWidth: 1,
        },
      ],
    };

    const chartOptions: ChartOptions<"doughnut"> = {
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "black",
          },
        },
      },
      cutout: "70%",
    };

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: data,
        options: chartOptions,
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [total, inUse, width, height]);

  return (
    <canvas
      ref={chartRef}
      width={width}
      height={height}
      style={{ width: "100%", height: "100%" }}
    ></canvas>
  );
};

export default DonutChart;
