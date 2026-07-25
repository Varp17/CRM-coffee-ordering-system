import { useEffect, useMemo } from 'react';
import './Dashboard.css';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Coffee, DollarSign, RefreshCw, ShoppingBag, Users } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { useOrderStore } from '../../../store/useOrderStore';

const PRODUCT_COLORS = ['#1F2A44', '#007AFF', '#C67C4E', '#7C3AED', '#0F766E', '#DC2626'];

const STORE_LOCATIONS = [
  { id: 'loc1', name: 'Indiranagar', location: '100 Feet Road' },
  { id: 'loc2', name: 'Koramangala', location: '5th Block' },
  { id: 'loc3', name: 'HSR Layout', location: '27th Main' },
  { id: 'loc4', name: 'Whitefield', location: 'ITPL Main Road' },
  { id: 'loc5', name: 'MG Road', location: 'Trinity Circle' },
];

const toLocalDateKey = (d) => {
  const dateObj = new Date(d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTimestamp = (order) => {
  if (!order) return new Date();
  const raw = order.created_at || order.createdAt || order.date || order.timestamp;
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const getAmount = (order) => {
  if (!order) return 0;
  const directAmount = Number(order.total_amount ?? order.total ?? order.amount ?? 0);
  if (directAmount > 0) return directAmount;
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => {
      const price = Number(item.line_total ?? item.unit_price ?? item.price ?? 0);
      const qty = item.line_total ? 1 : Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);
  }
  return 0;
};

const getItemName = (item) => item.name || item.product?.name || 'Product';

const Dashboard = () => {
  const { orders, fetchOrders, isLoading, error } = useOrderStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const metrics = useMemo(() => {
    const paidStatuses = new Set(['paid', 'completed', 'ready', 'in_progress']);
    const totalRevenue = orders
      .filter((order) => paidStatuses.has(order.status) || order.status === 'pending')
      .reduce((sum, order) => sum + getAmount(order), 0);
    const pendingPayments = orders.filter((order) => order.status === 'pending').length;
    const paidOrders = orders.filter((order) => paidStatuses.has(order.status)).length;
    const customerIds = new Set(orders.map((order) => order.customer_id).filter(Boolean));

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingPayments,
      paidOrders,
      customers: customerIds.size,
    };
  }, [orders]);

  const weeklySales = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        key: toLocalDateKey(date),
        day: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: 0,
        orders: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.key, day]));

    orders.forEach((order) => {
      const date = getTimestamp(order);
      const key = toLocalDateKey(date);
      let bucket = key ? byDate.get(key) : null;
      // Fallback: If order was created recently, attribute to today
      if (!bucket && Math.abs(Date.now() - date.getTime()) <= 7 * 24 * 60 * 60 * 1000) {
        bucket = days[days.length - 1];
      }
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += getAmount(order);
      }
    });

    return days;
  }, [orders]);

  const productBreakdown = useMemo(() => {
    const totals = new Map();
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = getItemName(item);
        const value = Number(item.line_total ?? item.price ?? 0) * (item.line_total ? 1 : Number(item.quantity || 1));
        totals.set(name, (totals.get(name) || 0) + value);
      });
    });

    const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        percentage: grandTotal ? `${Math.round((value / grandTotal) * 100)}%` : '0%',
        color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
      }));
  }, [orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => getTimestamp(b) - getTimestamp(a)).slice(0, 8),
    [orders]
  );

  const terminals = useMemo(
    () =>
      STORE_LOCATIONS.map((location) => {
        const locationOrders = orders.filter((order) => {
          const shipping = order.shipping_address || {};
          return shipping.location_id === location.id || shipping.location_name === location.name;
        });
        return { ...location, ordersToday: locationOrders.length };
      }),
    [orders]
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return <span className="status-pill status-progress">In Prep</span>;
      case 'ready':
        return <span className="status-pill status-ready">Pickup Ready</span>;
      case 'paid':
      case 'completed':
        return <span className="status-pill status-completed">Completed</span>;
      default:
        return <span className="status-pill">{status || 'pending'}</span>;
    }
  };

  return (
    <div className="crm-dashboard-page animate-fade-in">
      <div className="dashboard-header-row">
        <div>
          <h2 className="dash-title">Chilld Coffee Operations</h2>
          <p className="dash-subtitle">Live website orders and payment-backed operational data.</p>
        </div>
        <button type="button" className="sync-badge" onClick={() => fetchOrders()} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>{error ? 'Backend unavailable' : isLoading ? 'Syncing…' : 'Connected to backend'}</span>
        </button>
      </div>

      <div className="vasify-kpi-grid">
        <div className="vasify-card purple">
          <div className="vasify-card-top">
            <span className="vasify-card-label">Total Revenue</span>
            <div className="vasify-card-badge"><DollarSign size={16} /></div>
          </div>
          <h3 className="vasify-card-val">{formatCurrency(metrics.totalRevenue)}</h3>
          <span className="vasify-card-sub">from paid and fulfilled orders</span>
        </div>

        <div className="vasify-card blue">
          <div className="vasify-card-top">
            <span className="vasify-card-label">Total Orders</span>
            <div className="vasify-card-badge"><ShoppingBag size={16} /></div>
          </div>
          <h3 className="vasify-card-val">{metrics.totalOrders.toLocaleString()}</h3>
          <span className="vasify-card-sub">records stored by the backend</span>
        </div>

        <div className="vasify-card cyan">
          <div className="vasify-card-top">
            <span className="vasify-card-label">Pending Payments</span>
            <div className="vasify-card-badge"><Clock size={16} /></div>
          </div>
          <h3 className="vasify-card-val">{metrics.pendingPayments}</h3>
          <span className="vasify-card-sub">orders awaiting verification</span>
        </div>

        <div className="vasify-card orange">
          <div className="vasify-card-top">
            <span className="vasify-card-label">Paid Orders</span>
            <div className="vasify-card-badge"><CheckCircle2 size={16} /></div>
          </div>
          <h3 className="vasify-card-val">{metrics.paidOrders}</h3>
          <span className="vasify-card-sub">verified or fulfilled orders</span>
        </div>

        <div className="vasify-card green">
          <div className="vasify-card-top">
            <span className="vasify-card-label">Ordering Customers</span>
            <div className="vasify-card-badge"><Users size={16} /></div>
          </div>
          <h3 className="vasify-card-val">{metrics.customers}</h3>
          <span className="vasify-card-sub">unique backend customer records</span>
        </div>
      </div>

      <div className="dashboard-charts-row">
        <div className="chart-card flex-2">
          <div className="chart-card-header">
            <div>
              <h3>Weekly Sales & Revenue Trend</h3>
              <p className="chart-subtitle">Calculated from orders received during the last seven days</p>
            </div>
          </div>
          <div className="chart-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
              <AreaChart data={weeklySales} margin={{ top: 10, right: 25, left: 15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" stroke="#718096" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#718096" 
                  fontSize={12} 
                  tickLine={false} 
                  tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`} 
                />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card flex-1 concentrate-mix-card">
          <div className="chart-card-header">
            <h3>Product Mix</h3>
            <p className="chart-subtitle">Calculated from stored order items</p>
          </div>
          <div className="chart-body concentrate-mix-body">
            <div className="concentrate-pie" style={{ width: '100%', height: 160 }}>
              {productBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={160} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={productBreakdown} cx="50%" cy="50%" innerRadius="48%" outerRadius="72%" paddingAngle={4} dataKey="value">
                      {productBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="card-subtitle">No order-item data yet.</p>
              )}
            </div>
            <div className="pie-legend-list">
              {productBreakdown.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: item.color }} />
                  <span className="legend-name">{item.name}</span>
                  <strong className="legend-pct">{item.percentage}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="content-card flex-2">
          <div className="card-header-row">
            <div>
              <h3>Recent Orders</h3>
              <p className="card-subtitle">Most recent records returned by the backend</p>
            </div>
            <Link to="/admin/orders" className="btn-link">View All Orders →</Link>
          </div>

          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Collection</th>
                  <th>Ordered Products</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number || order.id?.slice(0, 8)}</strong></td>
                    <td>{order.customer_name || 'Guest'}</td>
                    <td><span className="terminal-badge">{order.shipping_address?.location_name || 'Not specified'}</span></td>
                    <td className="products-cell">
                      <Coffee size={14} className="cell-icon" />
                      <span>
                        {(() => {
                          const items = order.items || [];
                          if (items.length > 0) {
                            const first = items[0];
                            const firstStr = `${getItemName(first)} ×${first.quantity || 1}`;
                            return items.length > 1 ? `${firstStr}...` : firstStr;
                          }
                          if (order.items_summary) {
                            const parts = order.items_summary.split(', ');
                            return parts.length > 1 ? `${parts[0]}...` : order.items_summary;
                          }
                          return 'No item details';
                        })()}
                      </span>
                    </td>
                    <td><strong>{formatCurrency(getAmount(order))}</strong></td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="6">No website orders have been received yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-card flex-1">
          <div className="card-header-row">
            <div>
              <h3>Store Order Activity</h3>
              <p className="card-subtitle">Orders grouped by configured collection location</p>
            </div>
          </div>

          <div className="terminals-list">
            {terminals.map((terminal) => (
              <div key={terminal.id} className="terminal-item">
                <div className="term-info">
                  <span className="term-name">{terminal.name}</span>
                  <span className="term-loc">{terminal.location}</span>
                </div>
                <div className="term-meta">
                  <span className="term-orders">{terminal.ordersToday} orders</span>
                  <span className="status-dot-online">{terminal.ordersToday > 0 ? '● Activity' : 'No activity'}</span>
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
