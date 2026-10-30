import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Views, clicks and orders differ by orders of magnitude, so each gets its own
// small chart (own y-scale) on a shared x-axis instead of one dual-axis plot.
const SERIES = [
  { key: 'impressions', label: 'Views' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'orders', label: 'Orders' },
];

const COLOR = '#E8590C';
const ROW_H = 78;
const GAP = 14;
const MARGIN = { top: 8, right: 16, bottom: 34, left: 64 };

const sumOf = (data, k) => data.reduce((s, d) => s + (d[k] || 0), 0);

const OfferTrendD3Chart = ({ data = [] }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => { if (e?.contentRect.width > 0) setWidth(e.contentRect.width); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const hasData = SERIES.some((s) => sumOf(data, s.key) > 0);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (!hasData) return;

    const innerW = Math.max(100, width - MARGIN.left - MARGIN.right);
    const height = MARGIN.top + SERIES.length * ROW_H + (SERIES.length - 1) * GAP + MARGIN.bottom;
    svg.attr('width', '100%').attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3.scalePoint().domain(data.map((d) => d.dateStr)).range([0, innerW]).padding(0.2);
    const labelOf = new Map(data.map((d) => [d.dateStr, d.label]));
    const root = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    SERIES.forEach((s, row) => {
      const g = root.append('g').attr('transform', `translate(0,${row * (ROW_H + GAP)})`);
      const max = d3.max(data, (d) => d[s.key] || 0) || 0;
      const y = d3.scaleLinear().domain([0, Math.max(max, 1)]).nice(2).range([ROW_H, 0]);

      // Recessive grid
      g.append('g')
        .call(d3.axisLeft(y).ticks(2).tickFormat(d3.format('~s')).tickSize(-innerW))
        .call((a) => a.select('.domain').remove())
        .call((a) => a.selectAll('.tick line').attr('stroke', '#EEF1F5'))
        .call((a) => a.selectAll('.tick text').attr('fill', '#94A3B8').attr('font-size', 10));

      // Row title (text ink, not series colour)
      g.append('text')
        .attr('x', -MARGIN.left).attr('y', 12)
        .attr('fill', '#334155').attr('font-size', 11).attr('font-weight', 800)
        .text(s.label);
      g.append('text')
        .attr('x', -MARGIN.left).attr('y', 27)
        .attr('fill', '#94A3B8').attr('font-size', 10)
        .text(d3.format(',')(sumOf(data, s.key)));

      g.append('path').datum(data)
        .attr('fill', COLOR).attr('fill-opacity', 0.1)
        .attr('d', d3.area().x((d) => x(d.dateStr)).y0(ROW_H).y1((d) => y(d[s.key] || 0)).curve(d3.curveMonotoneX));
      g.append('path').datum(data)
        .attr('fill', 'none').attr('stroke', COLOR).attr('stroke-width', 2)
        .attr('d', d3.line().x((d) => x(d.dateStr)).y((d) => y(d[s.key] || 0)).curve(d3.curveMonotoneX));

      g.append('circle').attr('class', `focus-dot focus-${s.key}`).attr('r', 4)
        .attr('fill', COLOR).attr('stroke', '#fff').attr('stroke-width', 2).style('display', 'none');
      g.node().__y = y;
    });

    // Shared x-axis under the last row, thinned so labels never collide
    const step = Math.ceil(data.length / Math.max(2, Math.floor(innerW / 70)));
    root.append('g')
      .attr('transform', `translate(0,${SERIES.length * ROW_H + (SERIES.length - 1) * GAP})`)
      .call(d3.axisBottom(x).tickValues(data.filter((_, i) => i % step === 0).map((d) => d.dateStr))
        .tickFormat((k) => labelOf.get(k)).tickSize(0).tickPadding(10))
      .call((a) => a.select('.domain').attr('stroke', '#E2E8F0'))
      .call((a) => a.selectAll('text').attr('fill', '#64748B').attr('font-size', 10));

    // Crosshair + tooltip across all rows
    const plotH = SERIES.length * ROW_H + (SERIES.length - 1) * GAP;
    const rule = root.append('line').attr('y1', 0).attr('y2', plotH)
      .attr('stroke', '#94A3B8').attr('stroke-dasharray', '3,3').style('display', 'none');
    const tooltip = d3.select(containerRef.current).selectAll('.offer-trend-tip').data([0]).join('div')
      .attr('class', 'offer-trend-tip chart-tooltip').style('opacity', 0);
    const rows = root.selectAll(':scope > g').filter(function () { return this.__y; });

    root.append('rect').attr('width', innerW).attr('height', plotH).attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const idx = d3.leastIndex(data, (d) => Math.abs(x(d.dateStr) - mx));
        const d = data[idx];
        const cx = x(d.dateStr);
        rule.attr('x1', cx).attr('x2', cx).style('display', null);
        rows.each(function (_, i) {
          const s = SERIES[i];
          d3.select(this).select(`.focus-${s.key}`).style('display', null)
            .attr('cx', cx).attr('cy', this.__y(d[s.key] || 0));
        });
        const ctr = d.impressions ? ((d.clicks / d.impressions) * 100).toFixed(1) : '0.0';
        tooltip.style('opacity', 1).html(`
          <div class="chart-tooltip__title">${d.label}</div>
          <div>Views <strong>${d.impressions}</strong></div>
          <div>Clicks <strong>${d.clicks}</strong> <span class="chart-tooltip__muted">(${ctr}% CTR)</span></div>
          <div>Orders <strong>${d.orders}</strong></div>
          <div>Revenue <strong>₹${d3.format(',')(d.revenue || 0)}</strong></div>`);
        const left = cx + MARGIN.left;
        tooltip.style('left', `${left > width - 190 ? left - 180 : left + 14}px`).style('top', `${MARGIN.top + 6}px`);
      })
      .on('mouseleave', () => {
        rule.style('display', 'none');
        root.selectAll('.focus-dot').style('display', 'none');
        tooltip.style('opacity', 0);
      });
  }, [data, width, hasData]);

  return (
    <div ref={containerRef} className="d3-chart-wrap">
      {!hasData && (
        <div className="chart-empty">
          <div className="chart-empty__icon">👀</div>
          <strong>No offer activity yet</strong>
          <span>Views and clicks appear here as shoppers see your live offers.</span>
        </div>
      )}
      <svg ref={svgRef} role="img" aria-label="Offer views, clicks and orders over time" />
    </div>
  );
};

export default OfferTrendD3Chart;
