import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const OfferUsageD3Chart = ({ data = [] }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 280 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observeTarget = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries[0]) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ width, height: 280 });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => resizeObserver.unobserve(observeTarget);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 25, right: 30, bottom: 55, left: 45 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(80, height - margin.top - margin.bottom);

    // Clear SVG
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const hasData = data && data.length > 0;
    const chartData = hasData ? data.slice(0, 6) : [];

    // IF NO DATA -> CLEAN EMPTY STATE
    if (!hasData || chartData.length === 0) {
      const emptyGroup = chartGroup
        .append('g')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight / 2 - 10})`);

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '28px')
        .attr('dy', '-15px')
        .text('🌟');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('dy', '15px')
        .text('No Offer Performance Data');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '12px')
        .attr('dy', '35px')
        .text('Create active promotional offers to track conversion metrics');

      return;
    }

    const formatTitle = (str) => {
      const safe = str || 'Offer';
      return safe.length > 14 ? safe.substring(0, 12) + '…' : safe;
    };

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(chartData.map((d) => formatTitle(d.title)))
      .range([0, innerWidth])
      .padding(0.4);

    const maxUses = d3.max(chartData, (d) => d.estimatedUses) || 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(maxUses * 1.3, 3)])
      .range([innerHeight, 0]);

    // Color Gradient
    const defs = svg.append('defs');
    const barGradient = defs
      .append('linearGradient')
      .attr('id', 'offerD3BarGradPerfect')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    barGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
    barGradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669');

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSize(4);
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('d')).tickSize(-innerWidth);

    // Grid & Y Axis
    const yAxisGroup = chartGroup.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup.selectAll('.tick line').attr('stroke', '#F1F5F9').attr('stroke-dasharray', '3,3');
    yAxisGroup.selectAll('.tick text').attr('fill', '#94A3B8').attr('font-size', '11px');
    yAxisGroup.select('.domain').remove();

    // X Axis
    const xAxisGroup = chartGroup
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#334155')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')
      .attr('dx', '-4px')
      .attr('dy', '6px');

    xAxisGroup.select('.domain').attr('stroke', '#E2E8F0');

    // Tooltip DIV
    const tooltip = d3
      .select(containerRef.current)
      .selectAll('.d3-tooltip-offer')
      .data([0])
      .join('div')
      .attr('class', 'd3-tooltip-offer')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('background', '#0F172A')
      .style('color', '#FFFFFF')
      .style('padding', '10px 14px')
      .style('border-radius', '10px')
      .style('font-size', '12px')
      .style('box-shadow', '0 10px 25px -5px rgba(0,0,0,0.3)')
      .style('z-index', 100);

    // Bars
    chartGroup
      .selectAll('.offer-bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'offer-bar')
      .attr('x', (d) => xScale(formatTitle(d.title)))
      .attr('y', (d) => yScale(d.estimatedUses || 0))
      .attr('width', Math.min(xScale.bandwidth(), 45))
      .attr('height', (d) => innerHeight - yScale(d.estimatedUses || 0))
      .attr('rx', 6)
      .attr('fill', 'url(#offerD3BarGradPerfect)')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight:800;color:#F8FAFC;margin-bottom:3px;">${d.title}</div>
            <div style="color:#CBD5E1">Display Type: <span style="color:#FBBF24">${d.displayType}</span></div>
            <div style="color:#CBD5E1">Conversions: <strong style="color:#FFFFFF">${d.estimatedUses || 0}</strong></div>
            <div style="color:#CBD5E1">Revenue: <strong style="color:#60A5FA">₹${d.estimatedRevenue || 0}</strong></div>
          `);
      })
      .on('mousemove', (event) => {
        const bounds = containerRef.current.getBoundingClientRect();
        const x = Math.min(event.clientX - bounds.left + 15, width - 180);
        const y = Math.max(10, event.clientY - bounds.top - 40);
        tooltip.style('left', `${x}px`).style('top', `${y}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('opacity', 1);
        tooltip.style('opacity', 0);
      });
  }, [data, dimensions]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '280px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default OfferUsageD3Chart;
