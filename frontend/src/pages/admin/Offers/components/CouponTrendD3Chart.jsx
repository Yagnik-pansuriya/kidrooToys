import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CouponTrendD3Chart = ({ data = [], timeframe = 'monthly' }) => {
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
    const totalUsesSum = hasData ? d3.sum(data, (d) => d.couponUses || 0) : 0;

    // IF NO USAGES -> CLEAN EMPTY STATE
    if (!hasData || totalUsesSum === 0) {
      const emptyGroup = chartGroup
        .append('g')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight / 2 - 10})`);

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '28px')
        .attr('dy', '-15px')
        .text('📊');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('dy', '15px')
        .text('No Coupon Usage Recorded');

      emptyGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#9CA3AF')
        .attr('font-size', '12px')
        .attr('dy', '35px')
        .text(`No orders placed with coupons in this ${timeframe} timeframe`);

      return;
    }

    const chartData = data;

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const maxUses = d3.max(chartData, (d) => d.couponUses || 0) || 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(maxUses * 1.3, 3)])
      .range([innerHeight, 0]);

    // Color Gradient
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'couponAreaGradPerfect')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#FF6B35').attr('stop-opacity', 0.35);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF6B35').attr('stop-opacity', 0.02);

    // Filter X-axis tick labels if too crowded
    const tickStep = chartData.length > 20 ? 4 : chartData.length > 10 ? 2 : 1;
    const visibleLabels = chartData.filter((_, idx) => idx % tickStep === 0).map((d) => d.label);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickValues(visibleLabels).tickSize(4);
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('d')).tickSize(-innerWidth);

    // Gridlines & Y-Axis
    const yAxisGroup = chartGroup.append('g').attr('class', 'y-axis').call(yAxis);
    yAxisGroup.selectAll('.tick line').attr('stroke', '#F1F5F9').attr('stroke-dasharray', '3,3');
    yAxisGroup.selectAll('.tick text').attr('fill', '#94A3B8').attr('font-size', '11px');
    yAxisGroup.select('.domain').remove();

    // X-Axis
    const xAxisGroup = chartGroup
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .attr('dx', '-4px')
      .attr('dy', '6px');

    xAxisGroup.select('.domain').attr('stroke', '#E2E8F0');

    // Area
    const area = d3
      .area()
      .x((d) => xScale(d.label))
      .y0(innerHeight)
      .y1((d) => yScale(d.couponUses || 0))
      .curve(d3.curveMonotoneX);

    chartGroup.append('path').datum(chartData).attr('fill', 'url(#couponAreaGradPerfect)').attr('d', area);

    // Line
    const line = d3
      .line()
      .x((d) => xScale(d.label))
      .y((d) => yScale(d.couponUses || 0))
      .curve(d3.curveMonotoneX);

    chartGroup
      .append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#FF6B35')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Tooltip DIV (Outside SVG)
    const tooltip = d3
      .select(containerRef.current)
      .selectAll('.d3-tooltip-trend')
      .data([0])
      .join('div')
      .attr('class', 'd3-tooltip-trend')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('background', '#0F172A')
      .style('color', '#FFFFFF')
      .style('padding', '10px 14px')
      .style('border-radius', '10px')
      .style('font-size', '12px')
      .style('box-shadow', '0 10px 25px -5px rgba(0,0,0,0.3)')
      .style('z-index', 100)
      .style('transition', 'opacity 0.15s ease');

    // Dots (only on points with > 0 uses or step points)
    chartGroup
      .selectAll('.data-dot')
      .data(chartData.filter((d) => (d.couponUses || 0) > 0))
      .enter()
      .append('circle')
      .attr('class', 'data-dot')
      .attr('cx', (d) => xScale(d.label))
      .attr('cy', (d) => yScale(d.couponUses || 0))
      .attr('r', 5)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#FF6B35')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 8).attr('fill', '#FF6B35');
        tooltip
          .style('opacity', 1)
          .html(`
            <div style="font-weight:800;color:#F8FAFC;margin-bottom:4px;">${d.dateStr || d.label}</div>
            <div style="color:#CBD5E1">Coupon Uses: <strong style="color:#FFFFFF">${d.couponUses || 0}</strong></div>
            <div style="color:#CBD5E1">Discount Saved: <strong style="color:#4ADE80">₹${d.discountGiven || 0}</strong></div>
            <div style="color:#CBD5E1">Total Revenue: <strong style="color:#60A5FA">₹${d.revenue || 0}</strong></div>
          `);
      })
      .on('mousemove', (event, d) => {
        const bounds = containerRef.current.getBoundingClientRect();
        const dotX = xScale(d.label) + margin.left;
        const isRightEdge = dotX > width - 160;
        const xPos = isRightEdge ? dotX - 160 : dotX + 15;
        const yPos = Math.max(10, yScale(d.couponUses || 0) - 40);
        tooltip.style('left', `${xPos}px`).style('top', `${yPos}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('r', 5).attr('fill', '#FFFFFF');
        tooltip.style('opacity', 0);
      });
  }, [data, dimensions, timeframe]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '280px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default CouponTrendD3Chart;
