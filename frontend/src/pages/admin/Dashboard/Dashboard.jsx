import React, { useState } from 'react';
import {
  FiBox,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiCalendar,
  FiRefreshCw,
} from 'react-icons/fi';
import { useGetDashboardAnalyticsQuery } from '../../../store/ActionApi/orderApi';
import RevenueTrendChart from './components/RevenueTrendChart';
import CategoryPieChart from './components/CategoryPieChart';
import AnalyticsTablesSection from './components/AnalyticsTablesSection';
import './Dashboard.scss';

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' | 'monthly' | 'yearly'

  const { data: analyticsRes, isLoading, isFetching, refetch } = useGetDashboardAnalyticsQuery(timeframe, {
    refetchOnMountOrArgChange: true,
  });

  const analytics = analyticsRes?.data || {};
  const summary = analytics.summary || {};
  const trendData = analytics.trendData || [];
  const categoryBreakdown = analytics.categoryBreakdown || [];
  const topBuyers = analytics.topBuyers || [];
  const topProducts = analytics.topProducts || [];
  const mostLikedProducts = analytics.mostLikedProducts || [];

  const kpiCards = [
    {
      icon: <FiDollarSign />,
      label: 'Total Revenue',
      value: `₹${(summary.totalRevenue || 0).toLocaleString()}`,
      subtext: `${timeframe === 'weekly' ? 'Last 7 Days' : timeframe === 'yearly' ? 'Last 12 Months' : 'Last 30 Days'} sales`,
      color: '#4f46e5',
      bgColor: '#eef2ff',
    },
    {
      icon: <FiShoppingBag />,
      label: 'Total Orders',
      value: (summary.totalOrders || 0).toLocaleString(),
      subtext: `Avg Value: ₹${(summary.avgOrderValue || 0).toLocaleString()}`,
      color: '#059669',
      bgColor: '#ecfdf5',
    },
    {
      icon: <FiUsers />,
      label: 'Active Buyers',
      value: (summary.totalBuyers || 0).toLocaleString(),
      subtext: 'Unique purchasing customers',
      color: '#e11d48',
      bgColor: '#fff1f2',
    },
    {
      icon: <FiBox />,
      label: 'Items Sold',
      value: (summary.totalItemsSold || 0).toLocaleString(),
      subtext: `Total Active Toys: ${summary.totalProducts || 0}`,
      color: '#d97706',
      bgColor: '#fef3c7',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Top Header & Timeframe Switcher */}
      <div className="dashboard-page__header">
        <div>
          <h1 className="dashboard-page__title">Management Dashboard 📊</h1>
          <p className="dashboard-page__subtitle">
            Real-time analytics, revenue trends, top buyer metrics & best sellers
          </p>
        </div>

        <div className="dashboard-page__actions">
          <div className="timeframe-picker">
            <FiCalendar className="calendar-icon" />
            <button
              className={`timeframe-btn ${timeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeframe('weekly')}
            >
              Weekly
            </button>
            <button
              className={`timeframe-btn ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
            <button
              className={`timeframe-btn ${timeframe === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeframe('yearly')}
            >
              Yearly
            </button>
          </div>

          <button
            className={`refetch-btn ${isFetching ? 'spinning' : ''}`}
            onClick={() => refetch()}
            title="Refresh Data"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Section 1: KPI Summary Cards */}
          <div className="dashboard-kpis">
            {kpiCards.map((kpi, idx) => (
              <div className="kpi-card" key={idx}>
                <div
                  className="kpi-card__icon"
                  style={{ background: kpi.bgColor, color: kpi.color }}
                >
                  {kpi.icon}
                </div>
                <div className="kpi-card__info">
                  <span className="kpi-card__value">{kpi.value}</span>
                  <span className="kpi-card__label">{kpi.label}</span>
                  <span className="kpi-card__subtext">{kpi.subtext}</span>
                </div>
                <FiTrendingUp className="kpi-card__trend" style={{ color: kpi.color }} />
              </div>
            ))}
          </div>

          {/* Section 1: D3 Visual Charts */}
          <div className="dashboard-charts-grid">
            <RevenueTrendChart data={trendData} timeframe={timeframe} />
            <CategoryPieChart data={categoryBreakdown} />
          </div>

          {/* Section 2: Detailed Ranking & Reporting Tables */}
          <AnalyticsTablesSection
            topBuyers={topBuyers}
            topProducts={topProducts}
            mostLikedProducts={mostLikedProducts}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
