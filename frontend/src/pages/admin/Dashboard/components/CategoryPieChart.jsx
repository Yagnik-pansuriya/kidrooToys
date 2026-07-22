import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CategoryPieChart = ({ data = [] }) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const colors = [
    '#4f46e5', '#ec4899', '#10b981', '#f59e0b',
    '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e',
  ];

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const width = 260;
    const height = 260;
    const radius = Math.min(width, height) / 2 - 12;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3
      .pie()
      .value((d) => d.revenue || d.quantity || 1)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.58)
      .outerRadius(radius);

    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.55)
      .outerRadius(radius + 6);

    const colorScale = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.categoryName))
      .range(colors);

    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    const totalVal = d3.sum(data, (d) => d.revenue || d.quantity || 1);

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorScale(d.data.categoryName))
      .attr('stroke', '#ffffff')
      .style('stroke-width', '3px')
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);

        const percentage = totalVal > 0 ? ((d.data.revenue / totalVal) * 100).toFixed(1) : 0;
        const [xPos, yPos] = d3.pointer(event, containerRef.current);

        setTooltip({
          x: xPos,
          y: yPos - 12,
          category: d.data.categoryName,
          revenue: d.data.revenue,
          quantity: d.data.quantity,
          percentage,
        });
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);

        setTooltip(null);
      });

    // Center text inside donut hole (Light theme)
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text('Categories');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('fill', '#0f172a')
      .attr('font-size', '18px')
      .attr('font-weight', '800')
      .text(data.length);

  }, [data]);

  return (
    <div className="chart-card category-chart-card" ref={containerRef} style={{ position: 'relative' }}>
      <div className="chart-card__header">
        <div>
          <h3 className="chart-card__title">Sales by Category</h3>
          <span className="chart-card__subtitle">Revenue distribution</span>
        </div>
      </div>

      {(!data || data.length === 0) ? (
        <div className="chart-card__empty">No category data available</div>
      ) : (
        <div className="category-chart-body">
          <div className="category-chart-svg-wrapper">
            <svg ref={svgRef} />
          </div>

          <div className="category-legend">
            {data.slice(0, 5).map((item, idx) => (
              <div key={idx} className="category-legend__item">
                <span
                  className="category-legend__color"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="category-legend__name">{item.categoryName}</span>
                <span className="category-legend__val">
                  ₹{(item.revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="d3-tooltip__title">{tooltip.category}</div>
          <div className="d3-tooltip__item">
            <span>Revenue:</span>
            <strong>₹{(tooltip.revenue || 0).toLocaleString()} ({tooltip.percentage}%)</strong>
          </div>
          <div className="d3-tooltip__item">
            <span>Items Sold:</span>
            <strong>{tooltip.quantity || 0} units</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPieChart;
