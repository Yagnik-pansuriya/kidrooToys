import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export const OFFER_METRICS = [
  { key: 'clicks', label: 'Clicks' },
  { key: 'impressions', label: 'Views' },
  { key: 'orders', label: 'Orders' },
  { key: 'revenue', label: 'Revenue' },
];

const COLOR = '#E8590C';
const BAR_H = 22;
const ROW_GAP = 14;
const MAX_ROWS = 8;

const fmt = (key, v) => (key === 'revenue' ? `₹${d3.format(',')(v || 0)}` : d3.format(',')(v || 0));

// Ranked horizontal bars: one offer per row, real numbers for the chosen metric
const OfferUsageD3Chart = ({ data = [], metric = 'clicks' }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => { if (e?.contentRect.width > 0) setWidth(e.contentRect.width); });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => [...data]
    .filter((d) => (d[metric] || 0) > 0)
    .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
    .slice(0, MAX_ROWS), [data, metric]);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (rows.length === 0) return;

    const labelW = Math.min(170, width * 0.38);
    const valueW = 56;
    const innerW = Math.max(60, width - labelW - valueW);
    const height = rows.length * (BAR_H + ROW_GAP);
    svg.attr('width', '100%').attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3.scaleLinear().domain([0, d3.max(rows, (d) => d[metric]) || 1]).range([0, innerW]);
    const tooltip = d3.select(containerRef.current).selectAll('.offer-usage-tip').data([0]).join('div')
      .attr('class', 'offer-usage-tip chart-tooltip').style('opacity', 0);

    const row = svg.selectAll('g.row').data(rows).join('g')
      .attr('class', 'row')
      .attr('transform', (_, i) => `translate(0,${i * (BAR_H + ROW_GAP)})`);

    row.append('text')
      .attr('x', labelW - 10).attr('y', BAR_H / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', '#334155').attr('font-size', 12).attr('font-weight', 700)
      .text((d) => (d.title.length > 24 ? `${d.title.slice(0, 22)}…` : d.title));

    // Track, then bar with rounded data end anchored at the baseline
    row.append('rect').attr('x', labelW).attr('width', innerW).attr('height', BAR_H).attr('rx', 4).attr('fill', '#F4F6F9');
    row.append('rect')
      .attr('x', labelW).attr('height', BAR_H).attr('rx', 4).attr('fill', COLOR)
      .attr('width', (d) => Math.max(4, x(d[metric])));

    row.append('text')
      .attr('x', labelW + innerW + 8).attr('y', BAR_H / 2).attr('dy', '0.35em')
      .attr('fill', '#1E293B').attr('font-size', 12).attr('font-weight', 800)
      .text((d) => fmt(metric, d[metric]));

    // Full-row hit target
    row.append('rect').attr('width', width).attr('height', BAR_H + ROW_GAP / 2).attr('y', -ROW_GAP / 4).attr('fill', 'transparent')
      .style('cursor', 'default')
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        tooltip.style('opacity', 1).html(`
          <div class="chart-tooltip__title">${d.title.replace(/</g, '&lt;')}</div>
          <div class="chart-tooltip__muted">${d.page} · ${d.section} · ${d.status}</div>
          <div>Views <strong>${fmt('impressions', d.impressions)}</strong></div>
          <div>Clicks <strong>${fmt('clicks', d.clicks)}</strong> <span class="chart-tooltip__muted">(${d.ctr}% CTR)</span></div>
          <div>Orders <strong>${fmt('orders', d.orders)}</strong> <span class="chart-tooltip__muted">(${d.conversionRate}% of clicks)</span></div>
          <div>Revenue <strong>${fmt('revenue', d.revenue)}</strong></div>`)
          .style('left', `${Math.min(mx + 14, width - 220)}px`).style('top', `${my + 12}px`);
      })
      .on('mouseleave', () => tooltip.style('opacity', 0));
  }, [rows, width, metric]);

  const label = OFFER_METRICS.find((m) => m.key === metric)?.label.toLowerCase() || metric;

  return (
    <div ref={containerRef} className="d3-chart-wrap">
      {rows.length === 0 && (
        <div className="chart-empty">
          <div className="chart-empty__icon">🌟</div>
          <strong>No offer {label} in this period</strong>
          <span>
            {metric === 'orders' || metric === 'revenue'
              ? 'Orders are credited to an offer when a shopper clicks it and checks out within 7 days.'
              : 'Numbers fill in as shoppers see and tap your live offers.'}
          </span>
        </div>
      )}
      <svg ref={svgRef} role="img" aria-label={`Offers ranked by ${label}`} />
    </div>
  );
};

export default OfferUsageD3Chart;
