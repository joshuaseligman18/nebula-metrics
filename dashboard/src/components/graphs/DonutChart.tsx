import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DonutChartProps {
  total: number;
  inUse: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ total, inUse }) => {
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const data = [{ label: 'In Use', value: inUse }, { label: 'Available', value: total - inUse }];

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(['#ff7f0e', '#1f77b4']);

    const pie = d3.pie<any>().value((d: any) => d.value);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.label) as string); 
    }, [total, inUse]);

  return <svg ref={chartRef}></svg>;
};

export default DonutChart;
