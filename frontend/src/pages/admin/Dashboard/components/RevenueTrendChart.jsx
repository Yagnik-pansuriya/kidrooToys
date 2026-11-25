import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RevenueTrendChart = ({ data = [], timeframe = 'monthly', periodLabel }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const container = containerRef.current;
    const accent = getComputedStyle(container).getPropertyValue('--a-accent').trim() || '#ff6b35';
    const width = container.clientWidth || 600;
    const height = 320;
    const margin = { top: 25, right: 25, bottom: 45, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const maxRevenue = d3.max(data, (d) => d.revenue) || 1000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxRevenue * 1.18])
      .range([innerHeight, 0])
      .nice();

    // Gradient definition for light background
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'revenue-area-gradient-light')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', accent)
      .attr('stop-opacity', 0.16);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', accent)
      .attr('stop-opacity', 0.01);

    // Subtle horizontal grid lines
    const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat('');
    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#eef0f3')
      .attr('stroke-dasharray', '4 4');

    g.select('.grid-lines').select('.domain').remove();

    // X Axis
    // Show at most one date label per ~60px so narrow screens don't overlap them
    const labels = xScale.domain();
    const labelStep = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(innerWidth / 60))));
    const xAxis = d3.axisBottom(xScale).tickValues(labels.filter((_, i) => i % labelStep === 0));
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .attr('font-weight', '400')
      .attr('dy', '14px');

    if (data.length > 15) {
      xAxisG
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-35)');
    }

    xAxisG.select('.domain').attr('stroke', '#e5e7eb');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `₹${d >= 1000 ? `${(d / 1000).toFixed(1)}k` : d}`);

    const yAxisG = g.append('g').call(yAxis);
    yAxisG
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .attr('font-weight', '400');

    yAxisG.select('.domain').attr('stroke', '#e5e7eb');

    // D3 Generators
    const lineGenerator = d3
      .line()
      .x((d) => xScale(d.label))
      .y((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3
      .area()
      .x((d) => xScale(d.label))
      .y0(innerHeight)
      .y1((d) => yScale(d.revenue))
      .curve(d3.curveMonotoneX);

    // Render Gradient Fill
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#revenue-area-gradient-light)')
      .attr('d', areaGenerator);

    // Render Line
    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', accent)
      .attr('stroke-width', 2.25)
      .attr('d', lineGenerator);

    // Animate line path
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Circles / Hover Dots
    const circlesGroup = g.append('g');

    circlesGroup
      .selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.label))
      .attr('cy', (d) => yScale(d.revenue))
      .attr('r', 3.5)
      .attr('fill', '#ffffff')
      .attr('stroke', accent)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 6)
          .attr('fill', accent)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        const [xPos, yPos] = d3.pointer(event, container);
        setTooltip({
          x: xPos,
          y: yPos - 12,
          label: d.label,
          revenue: d.revenue,
          orders: d.orders,
        });
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 3.5)
          .attr('fill', '#ffffff')
          .attr('stroke', accent)
          .attr('stroke-width', 2);

        setTooltip(null);
      });
  }, [data, timeframe]);

  return (
    <div className="chart-card" ref={containerRef} style={{ position: 'relative' }}>
      <div className="chart-card__header">
        <div>
          <h3 className="chart-card__title">Revenue & Sales Performance</h3>
          <span className="chart-card__subtitle">
            {periodLabel || (timeframe === 'weekly' ? 'Last 7 Days' : timeframe === 'yearly' ? 'Last 12 Months' : 'Last 30 Days')} overview
          </span>
        </div>
        <div className="chart-card__badge">
          <span className="dot" /> Live Data
        </div>
      </div>

      <svg ref={svgRef} className="d3-revenue-chart" />

      {tooltip && (
        <div
          className="d3-tooltip"
          style={{
            position: 'absolute',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
          }}
        >
          <div className="d3-tooltip__title">{tooltip.label}</div>
          <div className="d3-tooltip__item">
            <span>Revenue:</span>
            <strong>₹{tooltip.revenue.toLocaleString()}</strong>
          </div>
          <div className="d3-tooltip__item">
            <span>Orders:</span>
            <strong>{tooltip.orders} orders</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueTrendChart;
