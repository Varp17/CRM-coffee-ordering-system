import React, { useState, useEffect, useMemo } from 'react';
import './Orders.css';
import Button from '../../../components/Button/Button';
import { useOrderStore } from '../../../store/useOrderStore';
import { formatCurrency } from '../../../utils/formatters';
import { orderService } from '../../../services/orders';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, ChevronRight, RefreshCw, AlertCircle, Search, Plus, MoreHorizontal } from 'lucide-react';

const Orders = () => {
  const { orders: ordersList, fetchOrders, updateOrderStatus, refundOrder, isLoading } = useOrderStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusOptions = ['all', 'pending', 'in_progress', 'ready', 'completed', 'cancelled', 'refunded'];
  const sourceOptions = ['all', 'd2c_website', 'kiosk'];

  const filteredOrders = useMemo(() => {
    return (ordersList || []).filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSource = sourceFilter === 'all' || order.channel?.toLowerCase() === sourceFilter.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || 'Guest').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSource && matchesSearch;
    });
  }, [ordersList, statusFilter, sourceFilter, searchQuery]);

  const handleStatusChange = async (orderId, newStatus) => {
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success(`Order status updated to "${newStatus}"`, { icon: '📦' });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } else {
      toast.error(`Failed to update status: ${res.error}`);
    }
  };

  const handleRefund = async (orderId) => {
    const res = await refundOrder(orderId);
    if (res.success) {
      toast.success(`Refund initiated for ${orderId}.`, { icon: '💰' });
      setShowRefundModal(false);
      setShowDetailModal(false);
    } else {
      toast.error(`Refund failed: ${res.error}`);
    }
  };

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    
    try {
      const res = await orderService.getById(order.id);
      const detailed = unwrapObject(res);
      if (detailed) {
        setSelectedOrder(detailed);
      }
    } catch (err) {
      toast.error('Failed to load full order details: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'status-pending',
      'in_progress': 'status-progress',
      'ready': 'status-ready',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'refunded': 'status-refunded',
    };
    return colors[status?.toLowerCase()] || '';
  };

  const getNextStatus = (current) => {
    const flow = { 'pending': 'in_progress', 'in_progress': 'ready', 'ready': 'completed' };
    return flow[current?.toLowerCase()] || null;
  };

  const orderStats = useMemo(() => ({
    total: (ordersList || []).length,
    pending: (ordersList || []).filter(o => o.status === 'pending').length,
    inProgress: (ordersList || []).filter(o => o.status === 'in_progress').length,
    completed: (ordersList || []).filter(o => o.status === 'completed').length,
    totalRevenue: (ordersList || []).reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  }), [ordersList]);

  // Define columns structure for the new virtualized DataTable component
  const columns = useMemo(() => [
    {
      header: 'Order',
      accessor: 'order_number',
      sortable: true,
      render: (row) => <strong style={{ color: '#111827', fontSize: '0.85rem' }}>{row.order_number || row.id}</strong>
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      sortable: true,
      render: (row) => (
        <div className="customer-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="customer-avatar" style={{
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '0.85rem'
          }}>
            {(row.customer_name || 'G').charAt(0)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="customer-name" style={{ fontWeight: '600', fontSize: '0.85rem' }}>{row.customer_name || 'Guest'}</span>
            <span className="customer-email" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.customer_email || ''}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Product',
      accessor: 'items_summary',
      sortable: true,
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: '#374151' }}>
          {(row.items_summary || '').split(', ')[0] || 'Unknown Product'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        let badgeStyle = { padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '500', color: 'white' };
        if (row.status === 'completed') badgeStyle.backgroundColor = '#10B981'; // Green
        else if (row.status === 'in_progress') badgeStyle.backgroundColor = '#111827'; // Black
        else if (row.status === 'pending') badgeStyle.backgroundColor = '#F59E0B'; // Yellow
        else if (row.status === 'cancelled') badgeStyle.backgroundColor = '#EF4444'; // Red
        else badgeStyle.backgroundColor = '#6B7280'; // Gray
        
        return (
          <span style={badgeStyle}>
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' ') : 'Unknown'}
          </span>
        );
      }
    },
    {
      header: 'Date',
      accessor: 'created_at',
      sortable: true,
      render: (row) => <span style={{ fontSize: '0.85rem', color: '#374151' }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
    },
    {
      header: 'Trend',
      accessor: 'trend',
      sortable: false,
      render: (row) => {
        // Mock SVG sparklines for the Zenith look
        const color = row.status === 'cancelled' ? '#EF4444' : '#10B981';
        return (
          <svg width="40" height="15" viewBox="0 0 40 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={row.status === 'cancelled' ? "M0 2L10 4L20 6L30 8L40 10" : "M0 12L10 10L20 12L30 8L40 6"} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      }
    },
    {
      header: 'Amount',
      accessor: (row) => parseFloat(row.total_amount || row.total || 0),
      sortable: true,
      render: (row) => <strong style={{ fontSize: '0.85rem', color: '#111827' }}>{formatCurrency(row.total_amount || row.total)}</strong>
    },
    {
      header: 'Source',
      accessor: 'channel',
      sortable: true,
      render: (row) => (
        <span className={`source-badge source-${(row.channel || 'kiosk').toLowerCase()}`}>
          {row.channel || 'kiosk'}
        </span>
      )
    },
    {
      header: 'Time',
      accessor: 'created_at',
      sortable: true,
      render: (row) => row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          {getNextStatus(row.status) && (
            <button
              className="action-btn-sm primary"
              onClick={() => handleStatusChange(row.id, getNextStatus(row.status))}
              style={{
                height: '28px !important', padding: '0 8px !important', fontSize: '0.8rem !important',
                backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '4px', border: 'none'
              }}
            >
              → {getNextStatus(row.status).replace('_', ' ')}
            </button>
          )}
          <button 
            className="action-btn-sm outline" 
            onClick={() => openDetail(row)}
            style={{
              height: '28px !important', padding: '0 8px !important', fontSize: '0.8rem !important',
              backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px'
            }}
          >
            View
          </button>
        </div>
      )
    }
  ], []);

  if (isLoading && (ordersList || []).length === 0) {
    return (
      <div className="orders-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-view animate-fade-in" style={{ position: 'relative' }}>
      {/* Zenith Page Header */}
      <div className="zenith-page-header">
        <div className="zenith-header-left">
          <div className="zenith-breadcrumb">Dashboard &gt; Orders</div>
          <h1 className="zenith-title">Orders</h1>
          <p className="zenith-subtitle">Manage and track all customer orders.</p>
        </div>
        <div className="zenith-header-right">
          <button className="zenith-btn-dark">
            <Plus className="w-4 h-4" style={{ marginRight: '6px' }} /> New Order
          </button>
        </div>
      </div>

      {/* Zenith Filter Pills */}
      <div className="zenith-filters-row">
        {['all', 'completed', 'in_progress', 'pending', 'cancelled'].map(tab => (
          <button 
            key={tab} 
            className={`zenith-filter-pill ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search Bar - styled to match Zenith, DataTable toolbar is hidden if we pass searchKey="" */}
      <div className="zenith-search-toolbar">
        <div className="zenith-search-box">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders DataTable */}
      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        <DataTable
          columns={columns}
          data={filteredOrders}
          exportFileName="orders-report"
        />
      </div>

      {/* Order Detail — Side Panel */}
      {showDetailModal && selectedOrder && (
        <>
          <div className="side-panel-overlay" onClick={() => setShowDetailModal(false)} />
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
              <button
                className="panel-close-btn"
                onClick={() => setShowDetailModal(false)}
                aria-label="Close panel"
              >
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
                  <div className="detail-row"><span className="detail-label">Source</span><span className={`source-badge source-${(selectedOrder.channel || 'kiosk').toLowerCase()}`}>{selectedOrder.channel || 'kiosk'}</span></div>
                  <div className="detail-row"><span className="detail-label">Status</span><span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></div>
                  <div className="detail-row"><span className="detail-label">Placed</span><span>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</span></div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="detail-section timeline-section" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--color-surface-hover)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🧭 Order Progress & Service Speed</h4>
                
                <div className="fulfillment-timeline" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  position: 'relative',
                  padding: '10px 0'
                }}>
                  {/* Progress Line */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '5%',
                    right: '5%',
                    height: '2px',
                    backgroundColor: 'var(--color-border)',
                    zIndex: 1
                  }}></div>

                  {/* 1. Placed */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: 'var(--color-success)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>✓</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>Placed</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>

                  {/* 2. Confirmed / Paid */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: (selectedOrder.timestamps?.confirmed_at || selectedOrder.confirmed_at) ? 'var(--color-success)' : 'var(--color-border)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>{(selectedOrder.timestamps?.confirmed_at || selectedOrder.confirmed_at) ? '✓' : '2'}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>Paid</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {selectedOrder.timestamps?.confirmed_at ? new Date(selectedOrder.timestamps.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>

                  {/* 3. Preparing */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: (selectedOrder.timestamps?.in_progress_at || selectedOrder.in_progress_at) ? 'var(--color-primary)' : 'var(--color-border)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>{(selectedOrder.timestamps?.in_progress_at || selectedOrder.in_progress_at) ? '✓' : '3'}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>Preparing</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {selectedOrder.timestamps?.in_progress_at ? new Date(selectedOrder.timestamps.in_progress_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Queued'}
                    </span>
                  </div>

                  {/* 4. Ready */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: (selectedOrder.timestamps?.ready_at || selectedOrder.ready_at) ? 'var(--color-primary-light)' : 'var(--color-border)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>{(selectedOrder.timestamps?.ready_at || selectedOrder.ready_at) ? '✓' : '4'}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>Ready</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {selectedOrder.timestamps?.ready_at ? new Date(selectedOrder.timestamps.ready_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>

                  {/* 5. Delivered */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', zIndex: 2, textAlign: 'center' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: (selectedOrder.timestamps?.completed_at || selectedOrder.completed_at) ? 'var(--color-primary)' : 'var(--color-border)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>{(selectedOrder.timestamps?.completed_at || selectedOrder.completed_at) ? '✓' : '5'}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>Delivered</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {selectedOrder.timestamps?.completed_at ? new Date(selectedOrder.timestamps.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Service Speeds Analytics Section */}
                {selectedOrder.timestamps && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '16px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(90, 60, 40, 0.05)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    borderLeft: '3px solid var(--color-primary)'
                  }}>
                    {selectedOrder.timestamps.confirmed_at && (
                      <div>
                        <strong>⏱️ Payment Speed: </strong>
                        <span>
                          {Math.max(0, Math.round((new Date(selectedOrder.timestamps.confirmed_at) - new Date(selectedOrder.created_at)) / 1000))} sec
                        </span>
                      </div>
                    )}
                    {selectedOrder.timestamps.in_progress_at && selectedOrder.timestamps.confirmed_at && (
                      <div>
                        <strong>⏱️ Claim Time: </strong>
                        <span>
                          {Math.max(0, Math.round((new Date(selectedOrder.timestamps.in_progress_at) - new Date(selectedOrder.timestamps.confirmed_at)) / 1000 / 60))} min
                        </span>
                      </div>
                    )}
                    {selectedOrder.timestamps.ready_at && selectedOrder.timestamps.in_progress_at && (
                      <div>
                        <strong>⏱️ Prep Duration: </strong>
                        <span>
                          {Math.max(0, Math.round((new Date(selectedOrder.timestamps.ready_at) - new Date(selectedOrder.timestamps.in_progress_at)) / 1000 / 60))} min
                        </span>
                      </div>
                    )}
                    {selectedOrder.timestamps.completed_at && selectedOrder.timestamps.ready_at && (
                      <div>
                        <strong>⏱️ Pickup Delay: </strong>
                        <span>
                          {Math.max(0, Math.round((new Date(selectedOrder.timestamps.completed_at) - new Date(selectedOrder.timestamps.ready_at)) / 1000 / 60))} min
                        </span>
                      </div>
                    )}
                  </div>
                )}
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
                          <td>{item.item_name || item.name}</td>
                          <td>{item.quantity || item.qty}</td>
                          <td>{formatCurrency(item.unit_price || item.price)}</td>
                          <td><strong>{formatCurrency((item.unit_price || item.price) * (item.quantity || item.qty))}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan="3" className="total-label" style={{textAlign: 'right', paddingRight: 'var(--space-16)'}}>Grand Total</td><td><strong>{formatCurrency(selectedOrder.total_amount || selectedOrder.total)}</strong></td></tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="side-panel-footer">
              {getNextStatus(selectedOrder.status) && (
                <Button variant="primary" onClick={() => handleStatusChange(selectedOrder.id, getNextStatus(selectedOrder.status))}>
                  → {getNextStatus(selectedOrder.status).replace('_', ' ')}
                </Button>
              )}
              {selectedOrder.status !== 'refunded' && selectedOrder.status !== 'cancelled' && (
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
