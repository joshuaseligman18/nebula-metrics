import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DiskUsageData {
  totalDiskSpace: number;
  diskUsage: { name: string; space: number }[];
}

const DiskUsagePieChart: React.FC<{ data: DiskUsageData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data) return;

    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<DiskUsageData['diskUsage'][0]>().value(d => d.space);

    const arcGenerator = d3
      .arc<d3.PieArcDatum<DiskUsageData['diskUsage'][0]>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc').data(pie(data.diskUsage)).enter().append('g');

    arcs
      .append('path')
      .attr('d', d => arcGenerator(d)!)
      .attr('fill', (d, i) => color(String(i)));

    arcs
      .append('text')
      .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text(d => `${d.data.name} (${(((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100).toFixed(1)}%)`);
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default DiskUsagePieChart;
