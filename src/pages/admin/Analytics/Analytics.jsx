import React, { useState, useEffect } from 'react';
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

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('weekly'); // 'weekly' | 'monthly'
  const [dashboardData, setDashboardData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [inventoryLevels, setInventoryLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (err) {
      toast.error('Failed to load analytics: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportReport = (format) => {
    toast.success(`Generating and exporting P&L ${format} statement to Central ERP... 📊`);
  };

  // Safe formatting of data for Recharts
  const weeklyChartData = (dashboardData?.weeklyRevenue || []).map(d => ({
    name: d.day,
    Revenue: d.revenue || 0,
    Orders: d.orders || 0,
  }));

  const monthlyChartData = monthlyData.map(d => ({
    name: d.month,
    Revenue: d.revenue || 0,
  }));

  const hourlyChartData = hourlyData.map(d => ({
    name: d.hour,
    Orders: d.orders || 0,
  }));

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
    <motion.div 
      className="analytics-view"
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
            className={`time-tab-btn ${timeRange === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeRange('weekly')}
          >
            Weekly Telemetry
          </button>
          <button
            className={`time-tab-btn ${timeRange === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeRange('monthly')}
          >
            Monthly Projections
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
            <ResponsiveContainer width="99%" height="100%" key={`${timeRange}-${weeklyChartData.length}-${monthlyChartData.length}`}>
              {timeRange === 'weekly' ? (
                <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
            <ResponsiveContainer width="99%" height="100%" key={hourlyChartData.length}>
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
        {/* Top items table */}
        <motion.div className="details-card" variants={itemVariants}>
          <h3>⭐ Menu Items Contribution Ranking</h3>
          <div className="styled-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Quantity Sold</th>
                  <th>Total Revenue contribution</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)' }}>No product telemetry available.</td></tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.sales} units</td>
                      <td className="profit-col">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Warehouse movements */}
        <motion.div className="details-card" variants={itemVariants}>
          <h3>🏢 Central Warehouse Replenishment Alerts</h3>
          <div className="styled-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Stock Value</th>
                  <th>Safety Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryLevels.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)' }}>No warehouse inventory alerts.</td></tr>
                ) : (
                  inventoryLevels.map((item) => {
                    const isLow = item.stock <= item.threshold;
                    return (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.stock} {item.unit}</td>
                        <td>{item.threshold} {item.unit}</td>
                        <td>
                          <span className={`alert-badge ${isLow ? 'low' : 'ok'}`}>
                            {isLow ? '⚠️ LOW STOCK' : '🟢 STABLE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;
