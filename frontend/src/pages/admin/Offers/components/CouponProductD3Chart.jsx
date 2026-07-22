import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CouponProductD3Chart = ({ data = [] }) => {
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
    const margin = { top: 25, right: 80, bottom: 35, left: 140 };
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
    const chartData = hasData ? data.slice(0, 5) : [];

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
        .text('🛍️');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('dy', '15px')
        .text('No Product Coupon Data');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '12px')
        .attr('dy', '35px')
        .text('Coupon usage by product will appear here when orders are placed');

      return;
    }

    const formatName = (str) => {
      const safe = str || 'Product';
      return safe.length > 18 ? safe.substring(0, 16) + '…' : safe;
    };

    // Scales
    const yScale = d3
      .scaleBand()
      .domain(chartData.map((d) => formatName(d.productName)))
      .range([0, innerHeight])
      .padding(0.4);

    const maxCount = d3.max(chartData, (d) => d.totalCouponOrders) || 1;
    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(maxCount * 1.3, 3)])
      .range([0, innerWidth]);

    // Color Gradient
    const defs = svg.append('defs');
    const barGradient = defs
      .append('linearGradient')
      .attr('id', 'prodD3BarGradClamped')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    barGradient.append('stop').attr('offset', '0%').attr('stop-color', '#8B5CF6');
    barGradient.append('stop').attr('offset', '100%').attr('stop-color', '#EC4899');

    // Axes
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.format('d')).tickSize(-innerHeight);

    // Grid & X Axis
    const xAxisGroup = chartGroup
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('.tick line').attr('stroke', '#F1F5F9');
    xAxisGroup.selectAll('.tick text').attr('fill', '#94A3B8').attr('font-size', '11px');
    xAxisGroup.select('.domain').attr('stroke', '#E2E8F0');

    // Y Axis
    const yAxisGroup = chartGroup.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#334155')
      .attr('font-size', '12px')
      .attr('font-weight', '700');
    yAxisGroup.select('.domain').remove();

    // Tooltip DIV
    const tooltip = d3
      .select(containerRef.current)
      .selectAll('.d3-tooltip-prod')
      .data([0])
      .join('div')
      .attr('class', 'd3-tooltip-prod')
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

    // Clamp bar height so 1 item doesn't become a giant 150px box
    const maxBarHeight = 28;
    const actualBandwidth = yScale.bandwidth();
    const barHeight = Math.min(actualBandwidth, maxBarHeight);
    const yOffset = (actualBandwidth - barHeight) / 2;

    // Bars
    chartGroup
      .selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => yScale(formatName(d.productName)) + yOffset)
      .attr('x', 0)
      .attr('height', barHeight)
      .attr('width', (d) => Math.max(xScale(d.totalCouponOrders), 6))
      .attr('rx', 6)
      .attr('fill', 'url(#prodD3BarGradClamped)')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight:800;color:#F8FAFC;margin-bottom:3px;">${d.productName || 'Product'}</div>
            <div style="color:#CBD5E1">Coupon Orders: <strong style="color:#FFFFFF">${d.totalCouponOrders}</strong></div>
            <div style="color:#CBD5E1">Total Discount: <strong style="color:#4ADE80">₹${d.totalDiscount || 0}</strong></div>
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

    // Bar Count Labels
    chartGroup
      .selectAll('.bar-label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('y', (d) => yScale(formatName(d.productName)) + actualBandwidth / 2 + 4)
      .attr('x', (d) => xScale(d.totalCouponOrders) + 8)
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .text((d) => `${d.totalCouponOrders} orders`);
  }, [data, dimensions]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '280px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default CouponProductD3Chart;
