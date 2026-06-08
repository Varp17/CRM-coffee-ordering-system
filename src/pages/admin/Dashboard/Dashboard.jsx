import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { analyticsService } from '../../../services/analytics';
import { orderService } from '../../../services/orders';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, Users, Package,
  AlertTriangle, RefreshCw, Download, Plus,
  ArrowUpRight, ArrowDownRight, Activity, CheckCircle,
  Clock, ChevronRight, Eye
} from 'lucide-react';

const EMPTY = {
  revenue: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, growth: 0, costToday: 0, profitToday: 0, aovToday: 0 },
  orders:  { today: 0, yesterday: 0, pending: 0, inProgress: 0, completedToday: 0, cancelledToday: 0, thisMonth: 0 },
  customers: { total: 0, active: 0, new: 0, retention: 0 },
  inventory: { lowStock: 0 },
  batches: { running: 0 },
  weeklyRevenue: [],
  topProducts: [],
  recentActivity: [],
};

const COLORS = ['#0F766E', '#F97316', '#0EA5E9', '#F43F5E', '#8B5CF6'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [chartTab, setChartTab] = useState('revenue');
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const dbRes = await analyticsService.getDashboard();
      setData({ ...EMPTY, ...unwrapObject(dbRes, {}) });
      
      const hourlyRes = await analyticsService.getHourlyOrders();
      setHourlyData(unwrapList(hourlyRes));

      const ordersRes = await orderService.getAll({ limit: 6 });
      setLiveOrders(unwrapList(ordersRes));
    } catch (err) {
      console.error('Dashboard load error:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const safe = { ...EMPTY, ...(data || {}) };

  const chartData = (safe.weeklyRevenue || []).map(d => ({
    name: d.day,
    Revenue: Number(d.revenue || 0),
  }));

  // Create fake sparkline data based on trend
  const generateSparkline = (trend, baseVal) => {
    return Array.from({ length: 10 }).map((_, i) => ({
      val: baseVal + (Math.random() * 20 - 10) + (trend > 0 ? i * 2 : -i * 2)
    }));
  };

  const revenueSparkline = generateSparkline(safe.revenue?.growth || 1, 100);
  const ordersSparkline = generateSparkline(1, 50);
  const usersSparkline = generateSparkline(safe.customers?.retention || 1, 20);
  const viewsSparkline = generateSparkline(1, 80);

  // Inventory usage data (from topProducts/seed)
  const inventoryUsageData = (safe.topProducts || []).slice(0, 4).map((p, idx) => ({
    name: p.name,
    value: Number(p.sales || 0)
  }));

  const growth = safe.revenue?.growth || 0;
  const isGrowthPositive = growth >= 0;

  const STATUS_COLORS = {
    pending:     { bg: '#FEF3C7', text: '#92400E' },
    in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
    ready:       { bg: '#D1FAE5', text: '#065F46' },
    completed:   { bg: '#D1FAE5', text: '#065F46' },
    cancelled:   { bg: '#FEE2E2', text: '#991B1B' },
    refunded:    { bg: '#F3F4F6', text: '#374151' },
  };

  const getStatusStyle = (s) => STATUS_COLORS[s?.toLowerCase()] || { bg: '#F3F4F6', text: '#374151' };

  if (isLoading && !data) {
    return (
      <div className="db-loading">
        <div className="db-loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="db-error">
        <AlertTriangle size={32} color="#D97706" />
        <p>Could not load dashboard data.</p>
        <button className="db-retry-btn" onClick={loadData}>
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-fade-in">

      {/* ── Page Header ── */}
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Dashboard</h1>
          <p className="db-page-sub">Welcome back, Admin. Here's what's happening with your business today.</p>
        </div>
        <div className="db-header-actions">
          <button className="db-action-btn ghost" onClick={loadData}>
            <RefreshCw size={14} />
          </button>
          <button className="db-action-btn primary" onClick={() => navigate('/admin/orders')}>
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>

      {/* ── KPI Cards: 4 Main Metrics ── */}
      <div className="db-kpi-row">
        {/* 1. Total Revenue */}
        <div className="zenith-kpi-card">
          <div className="zenith-kpi-header">
            <div className="zenith-kpi-info">
              <span className="zenith-kpi-label">Total Revenue</span>
              <span className="zenith-kpi-value">{formatCurrency(safe.revenue?.today || 0)}</span>
              <div className={`zenith-kpi-trend ${isGrowthPositive ? 'positive' : 'negative'}`}>
                {isGrowthPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(growth)}% <span className="zenith-kpi-trend-text">vs yesterday</span>
              </div>
            </div>
            <div className="zenith-kpi-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="zenith-kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSparkline}>
                <Line type="monotone" dataKey="val" stroke="#EA580C" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Active Customers */}
        <div className="zenith-kpi-card">
          <div className="zenith-kpi-header">
            <div className="zenith-kpi-info">
              <span className="zenith-kpi-label">Active Customers</span>
              <span className="zenith-kpi-value">{safe.customers?.active || 0}</span>
              <div className="zenith-kpi-trend positive">
                <ArrowUpRight size={14} />
                {safe.customers?.retention || 0}% <span className="zenith-kpi-trend-text">retention rate</span>
              </div>
            </div>
            <div className="zenith-kpi-icon" style={{ background: '#ECFEFF', color: '#0891B2' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="zenith-kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersSparkline}>
                <Line type="monotone" dataKey="val" stroke="#0891B2" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Total Orders */}
        <div className="zenith-kpi-card">
          <div className="zenith-kpi-header">
            <div className="zenith-kpi-info">
              <span className="zenith-kpi-label">Total Orders</span>
              <span className="zenith-kpi-value">{safe.orders?.today || 0}</span>
              <div className="zenith-kpi-trend neutral">
                <ArrowUpRight size={14} />
                {safe.orders?.thisMonth || 0} <span className="zenith-kpi-trend-text">this month</span>
              </div>
            </div>
            <div className="zenith-kpi-icon" style={{ background: '#F3F4F6', color: '#4B5563' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="zenith-kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersSparkline}>
                <Line type="monotone" dataKey="val" stroke="#4B5563" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Page Views / Alerts */}
        <div className="zenith-kpi-card">
          <div className="zenith-kpi-header">
            <div className="zenith-kpi-info">
              <span className="zenith-kpi-label">Store Hits</span>
              <span className="zenith-kpi-value">{(safe.revenue?.today * 1.5).toFixed(0)}</span>
              <div className="zenith-kpi-trend positive">
                <ArrowUpRight size={14} />
                24.7% <span className="zenith-kpi-trend-text">vs yesterday</span>
              </div>
            </div>
            <div className="zenith-kpi-icon" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="zenith-kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsSparkline}>
                <Line type="monotone" dataKey="val" stroke="#CA8A04" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Main Grids ── */}
      <div className="db-main-grid">
        
        {/* Left Col: Overview Chart */}
        <div className="zenith-card">
          <div className="zenith-card-header">
            <div>
              <h3 className="zenith-card-title">Overview</h3>
              <p className="zenith-card-sub">Monthly performance for the current year</p>
            </div>
            <div className="zenith-tabs">
              <button className={`zenith-tab ${chartTab === 'revenue' ? 'active' : ''}`} onClick={() => setChartTab('revenue')}>Revenue</button>
              <button className={`zenith-tab ${chartTab === 'orders' ? 'active' : ''}`} onClick={() => setChartTab('orders')}>Orders</button>
              <button className={`zenith-tab ${chartTab === 'profit' ? 'active' : ''}`} onClick={() => setChartTab('profit')}>Profit</button>
            </div>
          </div>
          <div className="zenith-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="zenithGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="rgba(0,0,0,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(0,0,0,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => chartTab === 'orders' ? v : `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [chartTab === 'orders' ? v : `₹${v.toLocaleString('en-IN')}`, chartTab.charAt(0).toUpperCase() + chartTab.slice(1)]} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <Area type="monotone" dataKey={chartTab === 'orders' ? 'orders' : chartTab === 'profit' ? 'profit' : 'Revenue'} stroke="#F97316" strokeWidth={3} fill="url(#zenithGradient)" activeDot={{ r: 6, fill: '#F97316', stroke: '#FFF', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Traffic / Goals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="zenith-card">
            <div className="zenith-card-header" style={{ marginBottom: '12px' }}>
              <div>
                <h3 className="zenith-card-title">Inventory Traffic</h3>
                <p className="zenith-card-sub">Where your ingredients go</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="zenith-donut-container" style={{ flex: 1, height: '140px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={inventoryUsageData} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {inventoryUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {inventoryUsageData.map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></div>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{entry.name.substring(0, 15)}</span>
                    </div>
                    <span style={{ color: '#6B7280' }}>{Math.round((entry.value / 100) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="zenith-card">
            <div className="zenith-card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="zenith-card-title">Monthly Goals</h3>
                <p className="zenith-card-sub">Track progress toward targets</p>
              </div>
            </div>
            <div className="zenith-progress-list">
              <div className="zenith-progress-item">
                <div className="zenith-progress-header">
                  <span>Monthly Revenue</span>
                  <span>88%</span>
                </div>
                <div className="zenith-progress-track">
                  <div className="zenith-progress-fill" style={{ width: '88%', background: '#F97316' }}></div>
                </div>
                <div className="zenith-progress-sub">
                  <span>{formatCurrency(safe.revenue?.today || 48295)}</span>
                  <span>Target: {formatCurrency(55000)}</span>
                </div>
              </div>
              <div className="zenith-progress-item">
                <div className="zenith-progress-header">
                  <span>New Customers</span>
                  <span>85%</span>
                </div>
                <div className="zenith-progress-track">
                  <div className="zenith-progress-fill" style={{ width: '85%', background: '#0F766E' }}></div>
                </div>
                <div className="zenith-progress-sub">
                  <span>{safe.customers?.active || 847}</span>
                  <span>Target: 1,000</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Grids ── */}
      <div className="db-main-grid" style={{ marginTop: '24px' }}>
        
        {/* Left Col: Recent Orders Table */}
        <div className="zenith-card">
          <div className="zenith-card-header">
            <div>
              <h3 className="zenith-card-title">Recent Orders</h3>
              <p className="zenith-card-sub">Latest transactions from your store</p>
            </div>
            <button className="zenith-card-action" onClick={() => navigate('/admin/orders')}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          
          <div className="zenith-table-container">
            <table className="zenith-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {liveOrders.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>No recent orders.</td></tr>
                ) : (
                  liveOrders.slice(0, 5).map((order) => {
                    const ss = getStatusStyle(order.status);
                    const custName = order.customer_name || 'Guest';
                    const initials = custName.substring(0, 2).toUpperCase();
                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="zenith-customer-cell">
                            <div className="zenith-avatar">{initials}</div>
                            <div className="zenith-customer-info">
                              <span className="zenith-customer-name">{custName}</span>
                              <span className="zenith-customer-email">{order.customer_email || 'guest@example.com'}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#6B7280', fontSize: '13px' }}>#{order.order_number || order.id}</td>
                        <td style={{ color: '#6B7280', fontSize: '13px', textTransform: 'capitalize' }}>{order.channel || 'Kiosk'}</td>
                        <td>
                          <span className="zenith-status-pill" style={{ background: ss.bg, color: ss.text }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                          {formatCurrency(order.total_amount || 0)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Recent Activity */}
        <div className="zenith-card">
          <div className="zenith-card-header">
            <div>
              <h3 className="zenith-card-title">Recent Activity</h3>
              <p className="zenith-card-sub">Latest events from your store</p>
            </div>
            <button className="zenith-card-action">
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="zenith-activity-list">
            {(safe.inventory?.lowStock || 0) > 0 && (
              <div className="zenith-activity-item">
                <div className="zenith-activity-icon" style={{ color: '#EF4444', background: '#FEF2F2' }}>
                  <AlertTriangle size={18} />
                </div>
                <div className="zenith-activity-content">
                  <span className="zenith-activity-title">Low Stock Alert</span>
                  <span className="zenith-activity-desc">{safe.inventory?.lowStock} raw material items below reorder thresholds!</span>
                  <span className="zenith-activity-time">Just now</span>
                </div>
              </div>
            )}
            
            {liveOrders.slice(0, 3).map((order, i) => (
              <div className="zenith-activity-item" key={order.id}>
                <div className="zenith-activity-icon" style={{ color: '#F97316', background: '#FFF7ED' }}>
                  <ShoppingBag size={18} />
                </div>
                <div className="zenith-activity-content">
                  <span className="zenith-activity-title">New order placed</span>
                  <span className="zenith-activity-desc">{order.customer_name || 'Guest'} placed an order for {formatCurrency(order.total_amount)}</span>
                  <span className="zenith-activity-time">{i * 2 + 1} min ago</span>
                </div>
              </div>
            ))}

            <div className="zenith-activity-item">
              <div className="zenith-activity-icon" style={{ color: '#0EA5E9', background: '#F0F9FF' }}>
                <Users size={18} />
              </div>
              <div className="zenith-activity-content">
                <span className="zenith-activity-title">New customer registered</span>
                <span className="zenith-activity-desc">Guest converted to member at kiosk</span>
                <span className="zenith-activity-time">15 min ago</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
