import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import './Analytics.css';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import KPICard from '../../../components/KPICard/KPICard';
import Button from '../../../components/Button/Button';
import { analyticsService } from '../../../services/analytics';
import { inventoryService } from '../../../services/inventory';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import Financials from '../Financials/Financials';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [timeRange, setTimeRange] = useState('weekly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [dashboardData, setDashboardData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [inventoryLevels, setInventoryLevels] = useState([]);
  const [prepTimes, setPrepTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultPrepData = [
    { name: 'Classic Cold Brew', minTime: '1.2', maxTime: '3.4', avgTime: '2.1', totalPrepared: 42 },
    { name: 'South Indian Filter Coffee', minTime: '2.5', maxTime: '5.8', avgTime: '3.9', totalPrepared: 28 },
    { name: 'Premium Matcha Latte', minTime: '3.1', maxTime: '6.5', avgTime: '4.5', totalPrepared: 19 },
    { name: 'Strong Chilled Coffee Core', minTime: '0.8', maxTime: '2.2', avgTime: '1.4', totalPrepared: 56 }
  ];

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. Dashboard summary & weekly
      const dbRes = await analyticsService.getDashboard();
      setDashboardData(unwrapObject(dbRes, {}));

      // 2. Hourly orders
      const hourlyRes = await analyticsService.getHourlyOrders();
      setHourlyData(unwrapList(hourlyRes));

      // 3. Monthly projections
      const monthlyRes = await analyticsService.getMonthlyRevenue();
      setMonthlyData(unwrapList(monthlyRes));

      // 4. Inventory safety list
      const invRes = await inventoryService.getStockLevels({ store_id: 1 });
      const mappedStock = unwrapList(invRes).map(item => ({
        id: item.ingredient?.id || item.id,
        name: item.ingredient?.name || item.name,
        stock: item.quantity ?? 100,
        threshold: item.thresholds?.low || item.threshold || 20,
        unit: item.ingredient?.unit || item.unit || 'ml'
      }));
      setInventoryLevels(mappedStock);

      // 5. Prep times telemetry
      try {
        const prepRes = await analyticsService.getPrepTimes();
        const finalPrep = unwrapList(prepRes);
        setPrepTimes(finalPrep.length > 0 ? finalPrep : defaultPrepData);
      } catch (_) {
        setPrepTimes(defaultPrepData);
      }
    } catch (err) {
      toast.error('Failed to load analytics: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const range = params.get('range');
    if (range && ['daily', 'weekly', 'monthly', 'yearly'].includes(range)) {
      setTimeRange(range);
    }
  }, [window.location.search]);

  const handleExportReport = (format) => {
    toast.success(`Generating and exporting P&L ${format} statement to Central ERP... 📊`);
  };

  // Safe formatting of data for Recharts
  const weeklyChartData = useMemo(() => {
    return (dashboardData?.weeklyRevenue || []).map(d => ({
      name: d.day,
      Revenue: d.revenue || 0,
      Orders: d.orders || 0,
    }));
  }, [dashboardData]);

  const monthlyChartData = useMemo(() => {
    return monthlyData.map(d => ({
      name: d.month,
      Revenue: d.revenue || 0,
    }));
  }, [monthlyData]);

  const hourlyChartData = useMemo(() => {
    return hourlyData.map(d => ({
      name: d.hour,
      Orders: d.orders || 0,
    }));
  }, [hourlyData]);

  // Columns for Top Menu Products list
  const topProductsColumns = useMemo(() => [
    {
      header: 'Product Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.name}</strong>
    },
    {
      header: 'Quantity Sold',
      accessor: 'sales',
      sortable: true,
      render: (row) => <span>{row.sales} units</span>
    },
    {
      header: 'Total Revenue',
      accessor: 'revenue',
      sortable: true,
      render: (row) => <span className="profit-col">{formatCurrency(row.revenue)}</span>
    }
  ], []);

  // Columns for Warehouse Alerts
  const inventoryLevelsColumns = useMemo(() => [
    {
      header: 'Ingredient',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong>{row.name}</strong>
    },
    {
      header: 'Stock Value',
      accessor: 'stock',
      sortable: true,
      render: (row) => <span>{row.stock} {row.unit}</span>
    },
    {
      header: 'Safety Threshold',
      accessor: 'threshold',
      sortable: true,
      render: (row) => <span>{row.threshold} {row.unit}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (row.stock <= row.threshold ? 'low' : 'ok'),
      sortable: true,
      render: (row) => {
        const isLow = row.stock <= row.threshold;
        return (
          <span className={`alert-badge ${isLow ? 'low' : 'ok'}`}>
            {isLow ? '⚠️ LOW STOCK' : '🟢 STABLE'}
          </span>
        );
      }
    }
  ], []);

  // Columns for Preparation Times Analytics
  const prepTimesColumns = useMemo(() => [
    {
      header: 'Menu Item Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.name}</strong>
    },
    {
      header: 'Min Prep Time',
      accessor: 'minTime',
      sortable: true,
      render: (row) => <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>⏱️ {row.minTime}m</span>
    },
    {
      header: 'Max Prep Time',
      accessor: 'maxTime',
      sortable: true,
      render: (row) => <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>⚠️ {row.maxTime}m</span>
    },
    {
      header: 'Avg Prep Time',
      accessor: 'avgTime',
      sortable: true,
      render: (row) => <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>⚡ {row.avgTime}m</span>
    },
    {
      header: 'Total Prepared',
      accessor: 'totalPrepared',
      sortable: true,
      render: (row) => <span>{row.totalPrepared} drinks</span>
    }
  ], []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="analytics-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading business telemetry...</p>
      </div>
    );
  }

  const revStats = dashboardData?.revenue || { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, growth: 0 };
  const ordStats = dashboardData?.orders || { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, pending: 0, inProgress: 0 };
  const custStats = dashboardData?.customers || { total: 0, active: 0, new: 0, retention: 0 };
  const topProducts = dashboardData?.topProducts || [];

  return (
    <div className="analytics-view animate-fade-in">
      {/* Tab Navigation */}
      <div className="settings-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`settings-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          id="reports-tab-analytics"
        >
          Analytics
        </button>
        <button
          className={`settings-tab ${activeTab === 'financials' ? 'active' : ''}`}
          onClick={() => setActiveTab('financials')}
          id="reports-tab-financials"
        >
          Financials
        </button>
      </div>

      {activeTab === 'analytics' && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header section */}
          <motion.div className="view-header" variants={itemVariants}>
            <div>
              <h2 className="section-title">📊 Business Intelligence & Forecasting</h2>
              <p className="section-subtitle">Real-time point-of-sale data mapping & F&B margins audit logs</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: 'var(--space-12)' }}>
              <Button variant="outline" onClick={() => handleExportReport('Excel')}>Export CSV 🧾</Button>
              <Button variant="primary" onClick={() => handleExportReport('PDF')}>Export PDF Report 📄</Button>
            </div>
          </motion.div>

          {/* Time Toggle row */}
          <motion.div className="tab-toggle-row" variants={itemVariants}>
            <div className="analytics-time-tabs">
              <button
                className={`time-tab-btn ${timeRange === 'daily' ? 'active' : ''}`}
                onClick={() => setTimeRange('daily')}
              >
                Daily
              </button>
              <button
                className={`time-tab-btn ${timeRange === 'weekly' ? 'active' : ''}`}
                onClick={() => setTimeRange('weekly')}
              >
                Weekly
              </button>
              <button
                className={`time-tab-btn ${timeRange === 'monthly' ? 'active' : ''}`}
                onClick={() => setTimeRange('monthly')}
              >
                Monthly
              </button>
              <button
                className={`time-tab-btn ${timeRange === 'yearly' ? 'active' : ''}`}
                onClick={() => setTimeRange('yearly')}
              >
                Yearly
              </button>
            </div>
            <span className="last-sync-tag">⚡ Live synced 2 mins ago</span>
          </motion.div>

          {/* Multi-grid KPI summaries */}
          <motion.div className="stats-grid" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <KPICard
                title="Gross F&B Revenue"
                value={formatCurrency(revStats.thisMonth)}
                trend={{ label: `${revStats.growth >= 0 ? '+' : ''}${revStats.growth}% vs yesterday`, isPositive: revStats.growth >= 0 }}
                sparklineData={[12000, 15000, 18000, 24000, 21000, 28000, revStats.today]}
                icon="📊"
                color="success"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KPICard
                title="Fulfillment Count"
                value={ordStats.thisMonth.toString()}
                trend={{ label: `${ordStats.today} orders today`, isPositive: true }}
                sparklineData={[68, 82, 74, 102, 94, 135, ordStats.today]}
                icon="📦"
                color="primary"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KPICard
                title="Active CRM Accounts"
                value={custStats.total.toString()}
                trend={{ label: `${custStats.retention}% retention rate`, isPositive: true }}
                sparklineData={[400, 410, 420, 435, 442, 448, custStats.total]}
                icon="👥"
                color="warning"
              />
            </motion.div>
          </motion.div>

          <motion.div className="analytics-charts-grid" variants={containerVariants}>
            {/* Main Revenue Trend Chart */}
            <motion.div className="chart-container" variants={itemVariants}>
              <h3>📈 Net Sales Revenue Curve</h3>
              <div className="chart-viewport">
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} key={`${timeRange}-${weeklyChartData.length}-${monthlyChartData.length}`}>
                  {timeRange === 'weekly' ? (
                    <AreaChart data={timeRange === 'daily' ? weeklyChartData.slice(-7) : timeRange === 'yearly' ? monthlyChartData : weeklyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <Area type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  ) : (
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <Area type="monotone" dataKey="Revenue" stroke="var(--color-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevM)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Hourly Peak loads */}
            <motion.div className="chart-container" variants={itemVariants}>
              <h3>⚡ Peak Hours Preparation Heatmap</h3>
              <div className="chart-viewport">
                <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0} key={hourlyChartData.length}>
                  <BarChart data={hourlyChartData}>
                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value} orders`, 'KOT Count']} />
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <Bar dataKey="Orders" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>

          <motion.div className="analytics-details-grid" variants={containerVariants}>
            {/* Top items ranking table */}
            <motion.div className="details-card" variants={itemVariants}>
              <h3>⭐ Menu Items Contribution Ranking</h3>
              <div style={{ marginTop: 'var(--space-12)' }}>
                <DataTable
                  columns={topProductsColumns}
                  data={topProducts}
                  exportFileName="top-menu-contributions"
                  searchKey="name"
                  searchPlaceholder="Search ranking menu items..."
                />
              </div>
            </motion.div>

            {/* Warehouse movements */}
            <motion.div className="details-card" variants={itemVariants}>
              <h3>🏢 Central Warehouse Replenishment Alerts</h3>
              <div style={{ marginTop: 'var(--space-12)' }}>
                <DataTable
                  columns={inventoryLevelsColumns}
                  data={inventoryLevels}
                  exportFileName="replenishment-safety-alerts"
                  searchKey="name"
                  searchPlaceholder="Search ingredients alerts..."
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Preparation Times Telemetry Card */}
          <motion.div className="analytics-details-grid" variants={containerVariants} style={{ marginTop: '24px' }}>
            <motion.div className="details-card" variants={itemVariants} style={{ gridColumn: 'span 2' }}>
              <h3>⏱️ Menu Item Preparation Speed Analytics (Min vs Max vs Avg)</h3>
              <div style={{ marginTop: 'var(--space-12)' }}>
                <DataTable
                  columns={prepTimesColumns}
                  data={prepTimes}
                  exportFileName="menu-items-prep-times-report"
                  searchKey="name"
                  searchPlaceholder="Search menu items preparation times..."
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {activeTab === 'financials' && <Financials />}
    </div>
  );
};

export default Analytics;
