import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import the date adapter (replace 'date-fns' with the appropriate adapter you're using)

interface MemoryLineGraphProps {
  data: { time: Date; ram: number; swapped: number }[];
}

const MemoryLineGraph: React.FC<MemoryLineGraphProps> = ({ data }) => {
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
          labels: data.map(d => d.time),
          datasets: [
            {
              label: 'RAM Usage',
              data: data.map(d => ({ x: d.time, y: d.ram })),
              borderColor: 'cyan',
              borderWidth: 2,
              fill: false,
            },
            {
              label: 'Swapped Usage',
              data: data.map(d => ({ x: d.time, y: d.swapped })),
              borderColor: 'orange',
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Memory Usage Over Time',
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
                color: "black" // Set y-axis color to black
              },
              max: 100,
              ticks: {
                color: "black", // Set y-axis ticks color to black
                stepSize: 20, // Set the step size for y-axis ticks 
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

export default MemoryLineGraph;
