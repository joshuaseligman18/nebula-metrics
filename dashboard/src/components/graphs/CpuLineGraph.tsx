import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import the date adapter (replace 'date-fns' with the appropriate adapter you're using)

interface CpuLineGraphProps {
  data: { x: Date; y: number }[];
}

const CpuLineGraph: React.FC<CpuLineGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart<'line'> | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'CPU Usage',
            data: data.map(({ x, y }) => ({ x, y })),
            borderColor: 'cyan',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'CPU Usage Over Time',
              font: {
                size: 14,
              },
              color: "black" // Set title color to black
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
              type: 'time',
              time: {
                unit: 'minute',
              },
              title: {
                display: true,
                text: 'Time',
                color: "black" // Set x-axis color to black
              },
              ticks: {
                color: "black" // Set x-axis ticks color to black
              }
            },
            y: {
              title: {
                display: true,
                text: 'Usage (%)',
                color: "black", // Set y-axis color to black
                 // Ensure Y-axis goes up to 100
              },
              max: 100,
              ticks: {
                color: "black", // Set y-axis ticks color to black
                stepSize: 10, // Set the step size for y-axis ticks
                
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

  return <canvas ref={chartRef} style={{ width: '100%', maxHeight: '400px' }} />;
};

export default CpuLineGraph;
