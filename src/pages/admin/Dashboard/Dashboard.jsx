import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../../components/KPICard/KPICard';
import Button from '../../../components/Button/Button';
import { analyticsService } from '../../../services/analytics';
import { orderService } from '../../../services/orders';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import { t } from '../../../utils/i18n';

const COLORS = ['#6F4E37', '#EDD6C8', '#4dabf7', '#38d9a9'];
const EMPTY_DASHBOARD = {
  revenue: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
  orders: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, pending: 0, inProgress: 0 },
  customers: { total: 0, active: 0, new: 0, retention: 0 },
  weeklyRevenue: [],
  topProducts: [],
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const dbRes = await analyticsService.getDashboard();
      setData({ ...EMPTY_DASHBOARD, ...unwrapObject(dbRes, {}) });
      
      const ordersRes = await orderService.getAll({ limit: 5 });
      setLiveOrders(unwrapList(ordersRes));
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="dashboard-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>{t('dashboard.loading', 'Loading analytics dashboard...')}</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="dashboard-view flex-center flex-col" style={{ height: '70vh', gap: '16px' }}>
        <p style={{ color: 'var(--color-danger)', fontSize: '1.2rem', fontWeight: 600 }}>{t('dashboard.errorStats', 'Failed to load dashboard statistics.')}</p>
        <Button variant="outline" onClick={loadData}>{t('dashboard.retryBtn', 'Retry 🔄')}</Button>
      </div>
    );
  }

  const safeData = { ...EMPTY_DASHBOARD, ...(data || {}) };

  const weeklyChartData = (safeData.weeklyRevenue || []).map(d => ({
    name: d.day,
    Revenue: Number(d.revenue || 0),
  }));

  const pieData = (safeData.topProducts || []).slice(0, 4).map(p => ({
    name: p.name || 'Product',
    value: Number(p.sales || 0)
  }));

  const getLegendColor = (index) => {
    const mod = (Number(index) || 0) % COLORS.length;
    if (mod === 0) return '#6F4E37';
    if (mod === 1) return '#EDD6C8';
    if (mod === 2) return '#4dabf7';
    return '#38d9a9';
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">{t('dashboard.title', 'Admin Dashboard')}</h2>
          <p className="section-subtitle">{t('dashboard.subtitle', "Real-time overview of your store's performance")}</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => alert('Exporting financial data to Zoho Books...')}>{t('dashboard.exportZoho', 'Export to Zoho')}</Button>
          <Button variant="outline" onClick={() => alert('Exporting financial data to Tally...')}>{t('dashboard.exportTally', 'Export to Tally')}</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <KPICard
          title="Total Revenue (Month)"
          value=""
          rawNumber={safeData.revenue?.thisMonth || 0}
          prefix="₹"
          trend={{ label: `${safeData.revenue?.growth >= 0 ? '+' : ''}${safeData.revenue?.growth || 0}% vs yesterday`, isPositive: (safeData.revenue?.growth || 0) >= 0 }}
          sparklineData={[12000, 15000, 18000, 24000, 21000, 28000, safeData.revenue?.today || 0]}
          icon="📈"
          color="success"
        />
        <KPICard
          title="Total Orders (Month)"
          value=""
          rawNumber={safeData.orders?.thisMonth || 0}
          trend={{ label: `${safeData.orders?.pending || 0} pending orders`, isPositive: true }}
          sparklineData={[68, 82, 74, 102, 94, 135, safeData.orders?.today || 0]}
          icon="🛍️"
          color="primary"
        />
        <KPICard
          title="Active Customers"
          value=""
          rawNumber={safeData.customers?.total || 0}
          trend={{ label: `${safeData.customers?.retention || 0}% retention rate`, isPositive: true }}
          sparklineData={[400, 410, 420, 435, 442, 448, safeData.customers?.active || 0]}
          icon="👥"
          color="warning"
        />
      </div>

      <div className="dashboard-grid">
        {/* Main Chart */}
        <div className="chart-card span-2">
          <div className="card-header">
            <h3>{t('dashboard.weeklyTrendTitle', 'Weekly Revenue Trend')}</h3>
            <select className="simple-select" onChange={loadData}><option>{t('dashboard.thisWeek', 'This Week')}</option></select>
          </div>
          <div className="chart-viewport">
            <ResponsiveContainer width="99%" height="100%" key={weeklyChartData.length}>
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Order Feed */}
        <div className="feed-card">
          <div className="card-header">
            <h3>{t('dashboard.liveFeedTitle', 'Live Order Feed')}</h3>
            <span className="live-pulse">● Live DB Feed</span>
          </div>
          <div className="feed-list">
            {liveOrders.length === 0 ? (
              <p className="empty-feed">{t('dashboard.noOrders', 'No active orders')}</p>
            ) : (
              liveOrders.map((order, i) => (
                <div key={i} className="feed-item">
                  <div className="feed-item-header">
                    <span className="feed-id">#{order.order_number || order.id}</span>
                    <span className="feed-time">
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                  <div className="feed-item-body">
                    <span className="feed-customer">{order.customer?.name || order.customer_name || 'Guest'}</span>
                    <span className={`status-indicator ${order.status === 'pending' ? 'low' : 'healthy'}`}>{order.status}</span>
                  </div>
                  <div className="feed-item-total">{formatCurrency(order.total_amount || order.total || 0)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products Pie Chart */}
        <div className="chart-card">
          <div className="card-header">
            <h3>{t('dashboard.topProductsTitle', 'Top Products Split')}</h3>
          </div>
          <div className="chart-viewport flex-center">
            {pieData.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>{t('dashboard.noSalesData', 'No sales data available yet')}</p>
            ) : (
              <>
                <ResponsiveContainer width="99%" height="100%" key={pieData.length}>
                  <PieChart>
                    <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getLegendColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieData.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: getLegendColor(index) }}></span>
                      <span className="legend-label">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="table-card span-2">
          <div className="card-header">
            <h3>{t('dashboard.topSellingTitle', 'Top Selling Products')}</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('dashboard.colProduct', 'Product')}</th>
                  <th>{t('dashboard.colSales', 'Sales')}</th>
                  <th>{t('dashboard.colRevenue', 'Revenue (₹)')}</th>
                </tr>
              </thead>
              <tbody>
                {(safeData.topProducts || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>{t('dashboard.noTopProducts', 'No top products data yet')}</td>
                  </tr>
                ) : (
                  (safeData.topProducts || []).map((p, idx) => (
                    <tr key={idx}>
                      <td><strong>{p.name || 'Product'}</strong></td>
                      <td>{p.sales || 0} units</td>
                      <td className="profit-col">{formatCurrency(p.revenue || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
