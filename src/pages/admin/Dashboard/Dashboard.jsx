import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import KPICard from '../../../components/KPICard/KPICard';
import Button from '../../../components/Button/Button';
import { analyticsService } from '../../../services/analytics';
import { orderService } from '../../../services/orders';
import { formatCurrency } from '../../../utils/formatters';

const COLORS = ['#6F4E37', '#EDD6C8', '#4dabf7', '#38d9a9'];

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
      setData(dbRes.data || dbRes);
      
      const ordersRes = await orderService.getAll({ limit: 5 });
      setLiveOrders(ordersRes.data || ordersRes || []);
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
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="dashboard-view flex-center flex-col" style={{ height: '70vh', gap: '16px' }}>
        <p style={{ color: 'var(--color-danger)', fontSize: '1.2rem', fontWeight: 600 }}>Failed to load dashboard statistics.</p>
        <Button variant="outline" onClick={loadData}>Retry 🔄</Button>
      </div>
    );
  }

  const weeklyChartData = (data.weeklyRevenue || []).map(d => ({
    name: d.day,
    Revenue: d.revenue,
  }));

  const pieData = (data.topProducts || []).slice(0, 4).map(p => ({
    name: p.name,
    value: p.sales
  }));

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">Admin Dashboard</h2>
          <p className="section-subtitle">Real-time overview of your store's performance</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => alert('Exporting financial data to Zoho Books...')}>Export to Zoho</Button>
          <Button variant="outline" onClick={() => alert('Exporting financial data to Tally...')}>Export to Tally</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <KPICard
          title="Total Revenue (Month)"
          value=""
          rawNumber={data.revenue?.thisMonth || 0}
          prefix="₹"
          trend={{ label: `${data.revenue?.growth >= 0 ? '+' : ''}${data.revenue?.growth || 0}% vs yesterday`, isPositive: (data.revenue?.growth || 0) >= 0 }}
          sparklineData={[12000, 15000, 18000, 24000, 21000, 28000, data.revenue?.today || 0]}
          icon="📈"
          color="success"
        />
        <KPICard
          title="Total Orders (Month)"
          value=""
          rawNumber={data.orders?.thisMonth || 0}
          trend={{ label: `${data.orders?.pending || 0} pending orders`, isPositive: true }}
          sparklineData={[68, 82, 74, 102, 94, 135, data.orders?.today || 0]}
          icon="🛍️"
          color="primary"
        />
        <KPICard
          title="Active Customers"
          value=""
          rawNumber={data.customers?.total || 0}
          trend={{ label: `${data.customers?.retention || 0}% retention rate`, isPositive: true }}
          sparklineData={[400, 410, 420, 435, 442, 448, data.customers?.active || 0]}
          icon="👥"
          color="warning"
        />
      </div>

      <div className="dashboard-grid">
        {/* Main Chart */}
        <div className="chart-card span-2">
          <div className="card-header">
            <h3>Weekly Revenue Trend</h3>
            <select className="simple-select" onChange={loadData}><option>This Week</option></select>
          </div>
          <div className="chart-viewport">
            <ResponsiveContainer width="100%" height={300}>
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
            <h3>Live Order Feed</h3>
            <span className="live-pulse">● Live DB Feed</span>
          </div>
          <div className="feed-list">
            {liveOrders.length === 0 ? (
              <p className="empty-feed">No active orders</p>
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
                    <span className="feed-customer">{order.customer_name || 'Guest'}</span>
                    <span className={`status-indicator ${order.status === 'pending' ? 'low' : 'healthy'}`}>{order.status}</span>
                  </div>
                  <div className="feed-item-total">{formatCurrency(order.total_amount || order.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products Pie Chart */}
        <div className="chart-card">
          <div className="card-header">
            <h3>Top Products Split</h3>
          </div>
          <div className="chart-viewport flex-center">
            {pieData.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>No sales data available yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={250}>
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieData.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
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
            <h3>Top Selling Products</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sales</th>
                  <th>Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts?.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No top products data yet</td>
                  </tr>
                ) : (
                  data.topProducts?.map((p, idx) => (
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
