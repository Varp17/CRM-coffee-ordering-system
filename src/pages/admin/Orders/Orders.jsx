import React, { useState, useEffect, useMemo, useRef } from 'react';
import './Orders.css';
import Button from '../../../components/Button/Button';
import AdminMetricCard from '../../../components/ui/AdminMetricCard';
import { useOrderStore } from '../../../store/useOrderStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { formatCurrency } from '../../../utils/formatters';
import { orderService } from '../../../services/orders';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import {
  X, RefreshCw, AlertCircle, Search, Play, CheckCircle, Eye, Printer,
  Download, ExternalLink, ChevronDown, ShoppingBag, Clock, Bell
} from 'lucide-react';

/* ─── Avatar Color Palette (from ICIT Leads) ─── */
const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#E0F2FE', text: '#0369A1' },
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#F3E8FF', text: '#6B21A8' },
];

const getAvatarColor = (name) => {
  const hash = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

/* ─── Status Badge Styles (matching ICIT) ─── */
const STATUS_STYLES = {
  pending:       { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  in_progress:   { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', dot: '#3B82F6' },
  ready:         { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD', dot: '#7C3AED' },
  completed:     { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  cancelled:     { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
  refunded:      { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', dot: '#9CA3AF' },
};

const STATUS_OPTIONS = ['pending', 'in_progress', 'ready', 'completed', 'cancelled'];

const Orders = () => {
  const { orders: ordersList, fetchOrders, updateOrderStatus, refundOrder, isLoading } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Smooth inline status picker state
  const [openStatusId, setOpenStatusId] = useState(null);

  useEffect(() => {
    if (openStatusId === null) return;
    const onDocClick = (e) => {
      const el = e.target;
      if (!el.closest('.icit-status-picker') && !el.closest('.icit-status-badge')) {
        setOpenStatusId(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openStatusId]);

  // WebSocket-driven real-time refresh
  const wsNotifications = useNotificationStore((s) => s.notifications);
  const prevNotifCountRef = useRef(0);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const currentCount = wsNotifications.length;
    if (prevNotifCountRef.current > 0 && currentCount > prevNotifCountRef.current) {
      fetchOrders();
    }
    prevNotifCountRef.current = currentCount;
  }, [wsNotifications.length, fetchOrders]);

  const filteredOrders = useMemo(() => {
    return (ordersList || []).filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || 'Guest').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ordersList, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchQuery]);

  const handleStatusChange = async (orderId, newStatus) => {
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      const formatted = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('_', ' ');
      toast.success(`Order status updated to "${formatted}"`, { icon: '📦' });
      if (selectedOrder?.id === orderId || selectedOrder?.order_number === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : prev));
      }
    }
  };

  const handleRefund = async (orderId) => {
    const res = await refundOrder(orderId);
    if (res.success) {
      toast.success(`Refund initiated for ${orderId}.`, { icon: '💰' });
      setShowRefundModal(false);
      setShowDetailPanel(false);
    } else {
      toast.error(`Refund failed: ${res.error}`);
    }
  };

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setShowDetailPanel(true);
    try {
      const res = await orderService.getById(order.id);
      const detailed = unwrapObject(res);
      if (detailed) setSelectedOrder(detailed);
    } catch (_) {}
  };

  const getNextStatus = (current) => {
    const flow = { pending: 'in_progress', in_progress: 'ready', ready: 'completed' };
    return flow[current?.toLowerCase()] || null;
  };

  const getActionLabel = (status) => {
    const labels = { pending: 'Start Order', in_progress: 'Mark Ready', ready: 'Complete Order' };
    return labels[status?.toLowerCase()] || null;
  };

  const getActionColor = (status) => {
    const colors = { pending: '#D97706', in_progress: '#1E40AF', ready: '#7C3AED' };
    return colors[status?.toLowerCase()] || '#007AFF';
  };

  /* ─── Order Stats (ICIT Summary Bar Style) ─── */
  const orderStats = useMemo(() => ({
    total: (ordersList || []).length,
    pending: (ordersList || []).filter(o => o.status === 'pending').length,
    inProgress: (ordersList || []).filter(o => o.status === 'in_progress').length,
    ready: (ordersList || []).filter(o => o.status === 'ready').length,
    completed: (ordersList || []).filter(o => o.status === 'completed').length,
    cancelled: (ordersList || []).filter(o => o.status === 'cancelled').length,
    totalRevenue: (ordersList || []).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  }), [ordersList]);

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    const headers = 'Order,Customer,Email,Products,Status,Date,Amount';
    const rows = filteredOrders.map(o => {
      const items = (o.items || []).map(i => `${i.name} x${i.quantity}`).join('; ');
      return `"${o.order_number || o.id}","${o.customer_name || 'Guest'}","${o.customer_email || ''}","${items}","${o.status}","${o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}","${o.total_amount || 0}"`;
    }).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported');
  };

  if (isLoading && (ordersList || []).length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <p style={{ color: '#94A3B8' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="icit-orders-page">
      {/* ─── ICIT-Style Header ─── */}
      <div className="icit-header">
        <div>
          <h1 className="icit-title">Order Management</h1>
          <div className="icit-header-stats">
            <span className="icit-stat"><span className="icit-stat-dot" style={{ background: '#007AFF' }} /> Total: {orderStats.total}</span>
            <span className="icit-stat"><span className="icit-stat-dot" style={{ background: '#10B981' }} /> Completed: {orderStats.completed}</span>
            <span className="icit-stat"><span className="icit-stat-dot" style={{ background: '#F59E0B' }} /> Revenue: {formatCurrency(orderStats.totalRevenue)}</span>
          </div>
        </div>
        <div className="icit-header-actions">
          <button className="icit-icon-btn" onClick={() => fetchOrders()} title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'icit-spin' : ''}`} />
          </button>
          <button className="icit-export-btn" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* ─── Summary Stat Cards (ICIT Style) ─── */}
      <div className="icit-stats-bar">
        {[
          { label: 'Total', count: orderStats.total, description: 'all kiosk orders', tone: 'purple', icon: ShoppingBag, filter: 'all' },
          { label: 'Pending', count: orderStats.pending, description: 'awaiting preparation', tone: 'orange', icon: Clock, filter: 'pending' },
          { label: 'In Progress', count: orderStats.inProgress, description: 'currently brewing', tone: 'blue', icon: RefreshCw, filter: 'in_progress' },
          { label: 'Ready', count: orderStats.ready, description: 'ready for pickup', tone: 'cyan', icon: Bell, filter: 'ready' },
          { label: 'Completed', count: orderStats.completed, description: 'fulfilled orders', tone: 'green', icon: CheckCircle, filter: 'completed' },
          { label: 'Cancelled', count: orderStats.cancelled, description: 'cancelled orders', tone: 'red', icon: X, filter: 'cancelled' },
        ].map(s => (
          <AdminMetricCard
            key={s.label}
            label={s.label}
            value={s.count}
            description={s.description}
            tone={s.tone}
            icon={s.icon}
            active={statusFilter === s.filter}
            onClick={() => setStatusFilter(s.filter)}
          />
        ))}
      </div>

      {/* ─── Search & Filter Bar (ICIT Style) ─── */}
      <div className="icit-toolbar">
        <div className="icit-search-box">
          <Search className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search orders by ID, customer name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="icit-filter-pills">
          {['all', 'completed', 'in_progress', 'ready', 'pending', 'cancelled'].map(tab => (
            <button
              key={tab}
              className={`icit-pill ${statusFilter === tab ? 'icit-pill--active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'all' ? 'All Orders' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ICIT-Style Data Table ─── */}
      <div className="icit-table-wrapper">
        <div className="icit-table-scroll">
          <table className="icit-table">
            <thead>
              <tr>
                <th style={{ minWidth: '100px' }}>Order</th>
                <th style={{ minWidth: '220px' }}>Customer</th>
                <th style={{ minWidth: '240px' }}>Ordered Products</th>
                <th style={{ minWidth: '110px' }}>Status</th>
                <th style={{ minWidth: '100px' }}>Date</th>
                <th style={{ minWidth: '100px' }}>Amount</th>
                <th style={{ minWidth: '90px' }}>Time</th>
                <th className="icit-th-sticky">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(order => {
                  const avatar = getAvatarColor(order.customer_name);
                  const status = STATUS_STYLES[order.status?.toLowerCase()] || STATUS_STYLES.refunded;
                  const itemsText = (order.items && order.items.map(i => `${i.name || i.title} ×${i.quantity || 1}`).join(', ')) || order.items_summary || '—';

                  return (
                    <tr key={order.id} className="icit-row">
                      {/* Order # */}
                      <td className="icit-td">
                        <span className="icit-order-id">{order.order_number || order.id}</span>
                      </td>

                      {/* Customer (Avatar + Name + Email) */}
                      <td className="icit-td" style={{ cursor: 'pointer' }} onClick={() => openDetail(order)}>
                        <div className="icit-customer-cell">
                          <div className="icit-avatar" style={{ backgroundColor: avatar.bg, color: avatar.text }}>
                            {(order.customer_name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div className="icit-customer-info">
                            <p className="icit-customer-name">{order.customer_name || 'Guest'}</p>
                            <p className="icit-customer-email">{order.customer_email || ''}</p>
                          </div>
                        </div>
                      </td>

                      {/* Ordered Products */}
                      <td className="icit-td">
                        <span className="icit-products-text">{itemsText}</span>
                      </td>

                      {/* Status Badge (smooth inline picker) */}
                      <td className="icit-td" style={{ position: 'relative' }}>
                        <button
                          className="icit-status-badge icit-status-badge--clickable"
                          style={{ backgroundColor: status.bg, color: status.text, borderColor: status.border }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStatusId(openStatusId === order.id ? null : order.id);
                          }}
                        >
                          <span className="icit-status-dot" style={{ backgroundColor: status.dot }} />
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ') : 'Unknown'}
                          <ChevronDown size={12} style={{ opacity: 0.5, marginLeft: '2px' }} />
                        </button>

                        {openStatusId === order.id && (
                          <div className="icit-status-picker" onClick={(e) => e.stopPropagation()}>
                            {STATUS_OPTIONS.map(s => {
                              const isActive = (order.status || 'pending') === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  className={`icit-status-picker-item ${isActive ? 'icit-status-picker-item--active' : ''}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (!isActive) handleStatusChange(order.id, s);
                                    setOpenStatusId(null);
                                  }}
                                >
                                  <span className="icit-status-dot" style={{ backgroundColor: STATUS_STYLES[s]?.dot || '#9CA3AF' }} />
                                  {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="icit-td">
                        <span className="icit-date">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      </td>

                      {/* Amount */}
                      <td className="icit-td">
                        <span className="icit-amount">{formatCurrency(order.total_amount || order.total)}</span>
                      </td>

                      {/* Time */}
                      <td className="icit-td">
                        <span className="icit-time">{order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </td>

                      {/* Actions (sticky right) */}
                      <td className="icit-td icit-td-sticky">
                        <div className="icit-actions">
                          {getNextStatus(order.status) && (
                            <button
                              className="icit-action-primary"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, getNextStatus(order.status)); }}
                              style={{ backgroundColor: getActionColor(order.status) }}
                            >
                              {order.status === 'pending' && <Play size={12} />}
                              {(order.status === 'in_progress' || order.status === 'ready') && <CheckCircle size={12} />}
                              {getActionLabel(order.status)}
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <button
                              className="icit-action-outline"
                              onClick={(e) => { e.stopPropagation(); toast.success('Invoice generated for #' + (order.order_number || order.id)); }}
                            >
                              <Printer size={12} /> Print
                            </button>
                          )}
                          <button
                            className="icit-action-view"
                            onClick={(e) => { e.stopPropagation(); openDetail(order); }}
                          >
                            <ExternalLink size={12} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="icit-pagination">
          <span className="icit-pagination-info">
            Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} records
          </span>
          <div className="icit-pagination-btns">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={currentPage === p ? 'icit-page-active' : ''} onClick={() => setCurrentPage(p)}>
                {p}
              </button>
            ))}
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      </div>

      {/* ─── Side Panel Detail (ICIT Style) ─── */}
      {showDetailPanel && selectedOrder && (
        <>
          <div className="icit-overlay" onClick={() => setShowDetailPanel(false)} />
          <div className="side-panel" role="dialog" aria-label="Order Details">
            <div className="side-panel-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111' }}>
                  Order #{selectedOrder.order_number || selectedOrder.id}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>
                  {selectedOrder.customer_name || 'Guest'} · {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </p>
              </div>
              <button className="panel-close-btn" onClick={() => setShowDetailPanel(false)} aria-label="Close panel">
                <X size={16} />
              </button>
            </div>

            <div className="side-panel-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-row"><span className="detail-label">Name</span><span>{selectedOrder.customer_name || 'Guest'}</span></div>
                  <div className="detail-row"><span className="detail-label">Email</span><span>{selectedOrder.customer_email || 'N/A'}</span></div>
                </div>

                <div className="detail-section">
                  <h4>Order Details</h4>
                  <div className="detail-row"><span className="detail-label">Status</span><span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span></div>
                  <div className="detail-row"><span className="detail-label">Placed</span><span>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="detail-section timeline-section" style={{ marginTop: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🧭 Order Progress</h4>
                <div className="fulfillment-timeline" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', padding: '10px 0' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '5%', right: '5%', height: '2px', backgroundColor: '#E2E8F0', zIndex: 1 }} />
                  {['Placed', 'Paid', 'Preparing', 'Ready', 'Delivered'].map((step, i) => {
                    const timestamps = selectedOrder.timestamps || {};
                    const keys = [true, timestamps.confirmed_at, timestamps.in_progress_at, timestamps.ready_at, timestamps.completed_at];
                    const done = !!keys[i];
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: done ? '#007AFF' : '#E2E8F0', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                        }}>{done ? '✓' : i + 1}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.items && (
                <div className="detail-section">
                  <h4>Items Ordered</h4>
                  <table className="table detail-items-table">
                    <thead>
                      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name || item.item_name}</td>
                          <td>{item.quantity || item.qty}</td>
                          <td>{formatCurrency(item.unit_price || item.price)}</td>
                          <td><strong>{formatCurrency((item.unit_price || item.price) * (item.quantity || item.qty))}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan="3" style={{ textAlign: 'right', paddingRight: '16px' }}>Grand Total</td><td><strong>{formatCurrency(selectedOrder.total_amount || selectedOrder.total)}</strong></td></tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="side-panel-footer">
              {getNextStatus(selectedOrder.status) && (
                <Button variant="primary" onClick={() => handleStatusChange(selectedOrder.id, getNextStatus(selectedOrder.status))}>
                  {getActionLabel(selectedOrder.status)}
                </Button>
              )}
              {selectedOrder.status === 'completed' && (
                <Button variant="outline" onClick={() => toast.success('Invoice generated for #' + (selectedOrder.order_number || selectedOrder.id))}>
                  Print Invoice
                </Button>
              )}
              {selectedOrder.status !== 'refunded' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <Button variant="danger" onClick={() => setShowRefundModal(true)}>
                  Refund
                </Button>
              )}
              <Button variant="outline" onClick={() => toast.success('Invoice generated')}>
                Invoice
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content refund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="#DC2626" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Confirm Refund</h3>
              </div>
              <button className="panel-close-btn" onClick={() => setShowRefundModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="refund-body">
              <p>Are you sure you want to refund order <strong>{selectedOrder.order_number || selectedOrder.id}</strong>?</p>
              <div className="refund-summary">
                <div className="refund-row"><span>Customer</span><span>{selectedOrder.customer_name || 'Guest'}</span></div>
                <div className="refund-row"><span>Amount</span><span className="refund-amount">{formatCurrency(selectedOrder.total_amount || selectedOrder.total)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="danger" onClick={() => handleRefund(selectedOrder.id)}>Confirm Refund</Button>
              <Button variant="ghost" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
