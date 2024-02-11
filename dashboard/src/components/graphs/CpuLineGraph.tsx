import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CpuLineGraphProps {
  data: { time: Date; usage: number }[];
}

const CpuLineGraph: React.FC<CpuLineGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const cardWidth = svgRef.current.parentElement?.clientWidth || 400; // Get the width of the parent element (the card)
    const width = cardWidth * 0.75 - margin.left - margin.right; // Set the width of the chart to 75% of the card's width
    const height = 200 - margin.top - margin.bottom;

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.time) as [Date, Date])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g.attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(width / 80).tickSize(0));

    const yAxis = (g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(d3.format('.0f')))
        .call(g => g.select('.domain').remove());

    const line = d3
      .line<{ time: Date; usage: number }>()
      .defined(d => !isNaN(d.usage))
      .x(d => x(d.time) as number)
      .y(d => y(d.usage) as number);

    svg.select('.x-axis').call(xAxis as any).call(g => g.select('.domain').remove());
    svg.select('.y-axis').call(yAxis as any).call(g => g.select('.domain').remove());
    svg
      .select('.line')
      .datum(data)
      .attr('d', line)
      .attr('stroke', 'cyan') // Set line color to cyan blue
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    // Append X axis line
    svg.append('line')
      .attr('x1', margin.left)
      .attr('y1', height - margin.bottom)
      .attr('x2', width - margin.right)
      .attr('y2', height - margin.bottom)
      .attr('stroke', 'black');

    // Append Y axis line
    svg.append('line')
      .attr('x1', margin.left)
      .attr('y1', margin.top)
      .attr('x2', margin.left)
      .attr('y2', height - margin.bottom)
      .attr('stroke', 'black');

    // Add X axis label
    svg
      .append('text')
      .attr('transform', `translate(${width / 2},${height + margin.top + 20})`)
      .style('text-anchor', 'middle')
      .text('Time');

    // Add Y axis label
    svg
      .append('text')
      .attr('transform', `translate(${margin.left - 40},${height / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .text('Usage (%)');

    // Add line label
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', margin.top + 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', 'cyan')
      .text('CPU Usage Over Time');

    // Add horizontal grid lines
    const yTicks = y.ticks(5);
    svg.selectAll('.y-tick-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'y-tick-line')
      .attr('x1', margin.left)
      .attr('y1', d => y(d))
      .attr('x2', width - margin.right)
      .attr('y2', d => y(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Add vertical grid lines
    const xTicks = x.ticks(10);
    svg.selectAll('.x-tick-line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'x-tick-line')
      .attr('x1', d => x(d))
      .attr('y1', margin.top)
      .attr('x2', d => x(d))
      .attr('y2', height - margin.bottom)
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

  }, [data]);

  return (
    <svg ref={svgRef} width="100%" height="200">
      <g className="x-axis" />
      <g className="y-axis" />
      <path className="line" />
    </svg>
  );
};

export default CpuLineGraph;
