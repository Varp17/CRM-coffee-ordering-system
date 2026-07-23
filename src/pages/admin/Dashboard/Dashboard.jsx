import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';
import { useNavigate, Link } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, Users, Package,
  TrendingUp, ArrowUpRight, CheckCircle2,
  Clock, Coffee, BookOpen, MessageSquare, Monitor,
  Sparkles, RefreshCw, Layers
} from 'lucide-react';

// Static/Dummy Kiosk Metrics Data
const DASHBOARD_METRICS = {
  totalRevenue: 148920,
  revenueGrowth: 14.2,
  totalOrders: 1248,
  ordersGrowth: 8.5,
  avgOrderValue: 119.3,
  activeTerminals: 4,
  pendingRecipesCount: 3,
  avgPrepTime: '3.2 mins',
  customerSatisfaction: '98.4%',
};

const WEEKLY_SALES = [
  { day: 'Mon', revenue: 18400, orders: 142, classic: 7600, bold: 6400, kappi: 4400 },
  { day: 'Tue', revenue: 21200, orders: 168, classic: 8800, bold: 7400, kappi: 5000 },
  { day: 'Wed', revenue: 19800, orders: 155, classic: 8200, bold: 7000, kappi: 4600 },
  { day: 'Thu', revenue: 24500, orders: 195, classic: 10200, bold: 8600, kappi: 5700 },
  { day: 'Fri', revenue: 28900, orders: 230, classic: 12100, bold: 10100, kappi: 6700 },
  { day: 'Sat', revenue: 32100, orders: 254, classic: 13500, bold: 11200, kappi: 7400 },
  { day: 'Sun', revenue: 29800, orders: 238, classic: 12500, bold: 10400, kappi: 6900 },
];

const CONCENTRATE_BREAKDOWN = [
  { name: 'Classic Cold Brew', value: 62546, percentage: '42%', color: '#007AFF' },
  { name: 'Bold Roast Concentrate', value: 52122, percentage: '35%', color: '#1F2A44' },
  { name: 'South Indian Kappi', value: 34252, percentage: '23%', color: '#C67C4E' },
];

const KIOSK_TERMINALS = [
  { id: 'T1', name: 'T1 - Tech Park Plaza', status: 'Online', ordersToday: 384, location: 'Building A Lobby' },
  { id: 'T2', name: 'T2 - Museum Road Cafe', status: 'Online', ordersToday: 312, location: 'Main Entrance' },
  { id: 'T3', name: 'T3 - Metro Station Express', status: 'Online', ordersToday: 298, location: 'Platform Level' },
  { id: 'T4', name: 'T4 - Indiranagar Hub', status: 'Online', ordersToday: 254, location: '100ft Road' },
];

const DUMMY_LIVE_ORDERS = [
  {
    id: 'ORD-8091',
    customer: 'Ananya Sharma',
    terminal: 'T1 - Tech Park Plaza',
    products: 'Bold Concentrate (325ml) ×2',
    total: 780,
    status: 'in_progress',
    time: '2 mins ago',
  },
  {
    id: 'ORD-8090',
    customer: 'Rohan Mehta',
    terminal: 'T2 - Museum Road Cafe',
    products: 'Discovery Kit (All 3 Concentrates) ×1',
    total: 590,
    status: 'ready',
    time: '5 mins ago',
  },
  {
    id: 'ORD-8089',
    customer: 'Sneha Patel',
    terminal: 'T3 - Metro Station',
    products: 'Kaapi Concentrate (325ml) ×1, Bold Cold Coffee ×1',
    total: 600,
    status: 'completed',
    time: '12 mins ago',
  },
  {
    id: 'ORD-8088',
    customer: 'Vikram Roy',
    terminal: 'Chilld Website Store',
    products: 'Classic CB Concentrate (1L) ×1, Classic CB (325ml) ×1',
    total: 1370,
    status: 'completed',
    time: '18 mins ago',
  },
  {
    id: 'ORD-8087',
    customer: 'Karan Verma',
    terminal: 'T4 - Indiranagar Hub',
    products: 'Kaapi Filter Shake ×1, Bold Cold Coffee ×1',
    total: 430,
    status: 'completed',
    time: '25 mins ago',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(DUMMY_LIVE_ORDERS);
  const [syncStatus, setSyncStatus] = useState('Connected to Kiosk (Local Sync)');

  // Local sync listener connecting Kiosk website and CRM
  useEffect(() => {
    const handleSync = (event) => {
      if (event.key === 'chilld_kiosk_orders') {
        try {
          const syncedOrders = JSON.parse(event.newValue);
          if (Array.isArray(syncedOrders)) {
            setOrders([...syncedOrders, ...DUMMY_LIVE_ORDERS]);
            setSyncStatus('New order synced from Kiosk!');
          }
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="status-pill status-progress">👨‍🍳 In Prep</span>;
      case 'ready':
        return <span className="status-pill status-ready">🔔 Pickup Ready</span>;
      case 'completed':
        return <span className="status-pill status-completed">✓ Completed</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="crm-dashboard-page animate-fade-in">
      {/* Top Banner Header */}
      <div className="dashboard-header-row">
        <div>
          <h2 className="dash-title">Chilld Coffee Kiosk Operations</h2>
          <p className="dash-subtitle">
            Real-time sales, live terminal monitoring, and customer recipe approval hub.
          </p>
        </div>
        <div className="sync-badge">
          <span className="sync-dot"></span>
          <span>{syncStatus}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card blue-card">
          <div className="kpi-icon-wrap">
            <DollarSign size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Kiosk Revenue</span>
            <h3 className="kpi-value">{formatCurrency(DASHBOARD_METRICS.totalRevenue)}</h3>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> +{DASHBOARD_METRICS.revenueGrowth}% vs last week
            </span>
          </div>
        </div>

        <div className="kpi-card navy-card">
          <div className="kpi-icon-wrap">
            <ShoppingBag size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Orders Handled</span>
            <h3 className="kpi-value">{DASHBOARD_METRICS.totalOrders.toLocaleString()}</h3>
            <span className="kpi-trend positive">
              <ArrowUpRight size={14} /> +{DASHBOARD_METRICS.ordersGrowth}% growth
            </span>
          </div>
        </div>

        <div className="kpi-card coffee-card">
          <div className="kpi-icon-wrap">
            <Monitor size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Active Terminals</span>
            <h3 className="kpi-value">{DASHBOARD_METRICS.activeTerminals} Online</h3>
            <span className="kpi-subtext">Avg Prep: {DASHBOARD_METRICS.avgPrepTime}</span>
          </div>
        </div>

        <div className="kpi-card warning-card">
          <div className="kpi-icon-wrap">
            <BookOpen size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Pending Custom Recipes</span>
            <h3 className="kpi-value">{DASHBOARD_METRICS.pendingRecipesCount} Pending</h3>
            <Link to="/admin/recipes" className="kpi-link">
              Review & Approve →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="dashboard-charts-row">
        {/* Revenue & Sales Area Chart */}
        <div className="chart-card flex-2">
          <div className="chart-card-header">
            <div>
              <h3>Weekly Sales & Revenue Trend</h3>
              <p className="chart-subtitle">Daily breakdown across Classic, Bold, and Kappi beverages</p>
            </div>
          </div>
          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_SALES} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#718096" fontSize={12} tickLine={false} />
                <YAxis stroke="#718096" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(31, 42, 68, 0.10)',
                    padding: '8px 12px',
                    fontFamily: "'Author', sans-serif",
                    fontSize: '13px',
                  }}
                  labelStyle={{ color: '#1F2A44', fontWeight: 700, marginBottom: '2px' }}
                  itemStyle={{ color: '#007AFF', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Concentrate Usage Breakdown Pie */}
        <div className="chart-card flex-1">
          <div className="chart-card-header">
            <h3>Concentrate Mix</h3>
            <p className="chart-subtitle">Sales share by concentrate base</p>
          </div>
          <div className="chart-body flex-center" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CONCENTRATE_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CONCENTRATE_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Sales']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(31, 42, 68, 0.10)',
                    padding: '8px 12px',
                    fontFamily: "'Author', sans-serif",
                    fontSize: '13px',
                  }}
                  labelStyle={{ color: '#1F2A44', fontWeight: 700, marginBottom: '2px' }}
                  itemStyle={{ color: '#007AFF', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend-list">
              {CONCENTRATE_BREAKDOWN.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-name">{item.name}</span>
                  <strong className="legend-pct">{item.percentage}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Kiosk Orders & Terminal Status */}
      <div className="dashboard-bottom-grid">
        {/* Live Kiosk Orders Feed */}
        <div className="content-card flex-2">
          <div className="card-header-row">
            <div>
              <h3>Recent Kiosk Orders</h3>
              <p className="card-subtitle">Real-time incoming orders displaying items ordered</p>
            </div>
            <Link to="/admin/orders" className="btn-link">View All Orders →</Link>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Terminal</th>
                  <th>Ordered Products</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customer}</td>
                    <td><span className="terminal-badge">{order.terminal}</span></td>
                    <td className="products-cell">
                      <Coffee size={14} className="cell-icon" />
                      <span>{order.products}</span>
                    </td>
                    <td><strong>{formatCurrency(order.total)}</strong></td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kiosk Terminals Status Card */}
        <div className="content-card flex-1">
          <div className="card-header-row">
            <div>
              <h3>Kiosk Terminals</h3>
              <p className="card-subtitle">Live hardware status</p>
            </div>
          </div>

          <div className="terminals-list">
            {KIOSK_TERMINALS.map((term) => (
              <div key={term.id} className="terminal-item">
                <div className="term-info">
                  <span className="term-name">{term.name}</span>
                  <span className="term-loc">{term.location}</span>
                </div>
                <div className="term-meta">
                  <span className="term-orders">{term.ordersToday} orders</span>
                  <span className="status-dot-online">● Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
