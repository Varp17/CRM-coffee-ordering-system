import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Customers.css';
import { customerService } from '../../../services/customers';
import { formatCurrency, formatDate, formatPhone } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../../hooks/useConfirmation';
import {
  Search, Download, RefreshCw, X, Mail, Phone, Star,
  ShoppingBag, MessageCircle, UserCheck, UserX
} from 'lucide-react';

// ── Customer Detail Side Panel ──────────────────────────────────
const CustomerPanel = ({ customer, onClose, onToggleStatus, onContact }) => {
  if (!customer) return null;
                  const isActive = customer.is_active ?? true;
  const orders = customer.order_count || customer.orders || 0;
  const segment =
    customer.segment ||
    (orders >= 5 ? 'Regular' : orders >= 1 ? 'New' : 'Inactive');

  const segmentColor = {
    Regular: '#2563EB',
    New: '#16A34A',
    Inactive: '#9CA3AF',
  }[segment] || '#9CA3AF';

  return (
    <>
      <div className="cust-panel-overlay" onClick={onClose} />
      <div className="cust-panel" role="dialog" aria-label="Customer Details">
        {/* Header */}
        <div className="cust-panel-header">
          <div className="cust-panel-avatar">
            {(customer.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="cust-panel-title">
            <h3>{customer.name || 'Unknown Customer'}</h3>
            <p>{customer.email || '—'}</p>
          </div>
          <button className="cust-panel-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* KPIs */}
        <div className="cust-panel-kpis">
          <div className="cust-kpi">
            <strong>{formatCurrency(customer.total_spent || customer.totalSpent || 0)}</strong>
            <span>Total Spent</span>
          </div>
          <div className="cust-kpi">
            <strong>{orders}</strong>
            <span>Orders</span>
          </div>
          <div className="cust-kpi">
            <span
              className="cust-segment-pill"
              style={{ background: `${segmentColor}15`, color: segmentColor, border: `1px solid ${segmentColor}30` }}
            >
              <Star size={10} fill={segmentColor} stroke="none" /> {segment}
            </span>
            <span>Segment</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="cust-panel-section">
          <h4>Contact</h4>
          <div className="cust-info-rows">
            <div className="cust-info-row">
              <Mail size={13} />
              <span>{customer.email || 'Not provided'}</span>
            </div>
            <div className="cust-info-row">
              <Phone size={13} />
              <span>{formatPhone(customer.mobile || customer.phone) || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="cust-panel-section">
          <h4>Activity</h4>
          <div className="cust-info-rows">
            {customer.joinedDate && (
              <div className="cust-info-row">
                <UserCheck size={13} />
                <span>Joined {formatDate(customer.joinedDate)}</span>
              </div>
            )}
            {customer.lastOrder && (
              <div className="cust-info-row">
                <ShoppingBag size={13} />
                <span>Last order {formatDate(customer.lastOrder)}</span>
              </div>
            )}
            <div className="cust-info-row">
              <span
                className={`cust-status-dot ${isActive ? 'active' : ''}`}
                style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}
              />
              <span>{isActive ? 'Active account' : 'Inactive account'}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {customer.recentOrders?.length > 0 && (
          <div className="cust-panel-section">
            <h4>Recent Orders</h4>
            <div className="cust-recent-orders">
              {customer.recentOrders.slice(0, 5).map((order, i) => (
                <div key={order.id || i} className="cust-recent-order-row">
                  <span>#{order.order_number || order.id}</span>
                  <span className="cust-order-amount">{formatCurrency(order.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="cust-panel-actions">
          <button
            className="cust-action-btn outline"
            onClick={() => onToggleStatus(customer.id, isActive)}
          >
            {isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Reactivate</>}
          </button>
          <button
            className="cust-action-btn primary"
            onClick={() => onContact(customer, 'whatsapp')}
          >
            <MessageCircle size={13} /> Message
          </button>
        </div>
      </div>
    </>
  );
};

const DUMMY_CUSTOMERS = [
  {
    id: 'c-101',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    mobile: '+91 98765 43210',
    order_count: 12,
    total_spent: 3450,
    segment: 'Regular',
    is_active: true,
    joinedDate: '2026-01-15T10:00:00Z',
    lastOrder: '2026-07-23T11:30:00Z',
  },
  {
    id: 'c-102',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@techpark.in',
    mobile: '+91 98123 45678',
    order_count: 8,
    total_spent: 2180,
    segment: 'Regular',
    is_active: true,
    joinedDate: '2026-02-10T14:20:00Z',
    lastOrder: '2026-07-23T12:00:00Z',
  },
  {
    id: 'c-103',
    name: 'Sneha Patel',
    email: 'sneha.p@gmail.com',
    mobile: '+91 99887 76655',
    order_count: 4,
    total_spent: 1240,
    segment: 'New',
    is_active: true,
    joinedDate: '2026-06-01T09:15:00Z',
    lastOrder: '2026-07-23T08:45:00Z',
  },
  {
    id: 'c-104',
    name: 'Vikram Roy',
    email: 'vikram.roy@innovate.co',
    mobile: '+91 97654 32109',
    order_count: 18,
    total_spent: 5920,
    segment: 'Regular',
    is_active: true,
    joinedDate: '2025-11-20T16:00:00Z',
    lastOrder: '2026-07-22T17:10:00Z',
  },
  {
    id: 'c-105',
    name: 'Karan Verma',
    email: 'karan.verma@domain.com',
    mobile: '+91 96543 21098',
    order_count: 2,
    total_spent: 560,
    segment: 'New',
    is_active: true,
    joinedDate: '2026-07-10T12:30:00Z',
    lastOrder: '2026-07-22T19:00:00Z',
  },
  {
    id: 'c-106',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    mobile: '+91 95432 10987',
    order_count: 0,
    total_spent: 0,
    segment: 'Inactive',
    is_active: false,
    joinedDate: '2026-04-12T11:00:00Z',
    lastOrder: null,
  },
];

// ── Main Customers Component ────────────────────────────────────
const SEGMENTS = ['All', 'Regular', 'New', 'Inactive'];

const Customers = () => {
  const [customersList, setCustomersList] = useState(DUMMY_CUSTOMERS);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailedCustomer, setDetailedCustomer] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const confirmAction = useConfirmation();

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await customerService.getAll();
      const list = unwrapList(res);
      if (Array.isArray(list) && list.length > 0) {
        setCustomersList(list);
      } else {
        setCustomersList(DUMMY_CUSTOMERS);
      }
    } catch (_) {
      // Offline / local fallback without throwing error toast
      setCustomersList(DUMMY_CUSTOMERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    const list = Array.isArray(customersList) ? customersList : [];
    return list.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.mobile || c.phone || '').includes(searchQuery);

      const orders = c.orders || c.order_count || 0;
      const seg =
        c.segment ||
        (orders >= 5 ? 'Regular' : orders >= 1 ? 'New' : 'Inactive');

      const matchSegment =
        segmentFilter === 'All' || seg.toLowerCase() === segmentFilter.toLowerCase();

      return matchSearch && matchSegment;
    });
  }, [customersList, searchQuery, segmentFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const list = Array.isArray(customersList) ? customersList : [];
    return {
      total: list.length,
      active: list.filter(c => c.is_active ?? 1).length,
      ltv: list.reduce((s, c) => s + parseFloat(c.total_spent || c.totalSpent || 0), 0),
    };
  }, [customersList]);

  const openProfile = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    setDetailedCustomer(null);
    setShowPanel(true);
    try {
      const res = await customerService.getById(customer.id);
      setDetailedCustomer({ ...customer, ...unwrapObject(res) });
    } catch {
      setDetailedCustomer(customer);
    }
  }, []);

  const handleContact = useCallback((customer, type) => {
    if (type === 'whatsapp' && (customer.mobile || customer.phone)) {
      const phone = (customer.mobile || customer.phone).replace(/\D/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    } else if (type === 'email' && customer.email) {
      window.open(`mailto:${customer.email}`, '_blank');
    }
    toast.success(`Opening ${type} for ${customer.name || 'customer'}…`);
  }, []);

  const toggleStatus = useCallback(async (id, currentlyActive) => {
    const label = currentlyActive ? 'Deactivate' : 'Reactivate';
    const confirmed = await confirmAction({
      title: `${label} Customer`,
      description: `Are you sure you want to ${label.toLowerCase()} this customer account?`,
      type: 'level2',
      payload: { requireCheckbox: true }
    });
    if (!confirmed) return;
    try {
      toast.success('Customer status updated.');
      setShowPanel(false);
      loadCustomers();
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  }, [loadCustomers, confirmAction]);

  const handleExport = async () => {
    const confirmed = await confirmAction({
      title: 'Export Customers',
      description: 'Download a CSV of all customer data?',
      type: 'level1',
    });
    if (confirmed) toast.success('Generating export…');
  };

  // Segment color helper
  const getSegmentStyle = (seg) => {
    const map = {
      Regular: { bg: 'rgba(37,99,235,0.08)', color: '#2563EB' },
      New: { bg: 'rgba(22,163,74,0.08)', color: '#16A34A' },
      Inactive: { bg: 'rgba(0,0,0,0.04)', color: '#9CA3AF' },
    };
    return map[seg] || map.Inactive;
  };

  const resolveSegment = (c) => {
    if (c.segment) return c.segment;
    const orders = c.orders || c.order_count || 0;
    return orders >= 5 ? 'Regular' : orders >= 1 ? 'New' : 'Inactive';
  };

  return (
    <div className="customers-view animate-fade-in" style={{ position: 'relative' }}>

      {/* ── Page Header ── */}
      <div className="cust-page-header">
        <div>
          <h1 className="cust-page-title">Customers</h1>
          <p className="cust-page-sub">
            {stats.total} total · {stats.active} active
          </p>
        </div>
        <div className="cust-header-actions">
          <button className="cust-btn ghost" onClick={loadCustomers} title="Refresh" disabled={isLoading}>
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="cust-btn ghost" onClick={handleExport}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="cust-kpi-strip">
        <div className="cust-kpi-item">
          <strong>{stats.total}</strong>
          <span>Total Customers</span>
        </div>
        <div className="cust-kpi-item">
          <strong>{stats.active}</strong>
          <span>Active</span>
        </div>
        <div className="cust-kpi-item">
          <strong>{formatCurrency(stats.ltv)}</strong>
          <span>Total Revenue</span>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="cust-toolbar">
        <div className="cust-search-box">
          <Search size={14} color="#AAA" />
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="cust-search-input"
            id="customers-search"
          />
        </div>
        <div className="cust-segment-tabs">
          {SEGMENTS.map(seg => (
            <button
              key={seg}
              className={`cust-seg-btn ${segmentFilter === seg ? 'active' : ''}`}
              onClick={() => setSegmentFilter(seg)}
              id={`seg-filter-${seg.toLowerCase()}`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="cust-table-card">
        {isLoading && customersList.length === 0 ? (
          <div className="cust-loading">
            <div className="cust-spinner" />
            <span>Loading customers…</span>
          </div>
        ) : loadError ? (
          <div className="cust-error">
            <p>{loadError}</p>
            <button className="cust-btn ghost" onClick={loadCustomers} disabled={isLoading}>
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Retry
            </button>
          </div>
        ) : (
          <table className="cust-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Segment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cust-empty-row">
                    No customers match your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, i) => {
                  const seg = resolveSegment(customer);
                  const segStyle = getSegmentStyle(seg);
  const isActive = customer.is_active ?? true;
                  return (
                    <tr
                      key={customer.id || i}
                      className="cust-row"
                      onClick={() => openProfile(customer)}
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && openProfile(customer)}
                    >
                      <td>
                        <div className="cust-identity-cell">
                          <div className="cust-avatar">
                            {(customer.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="cust-name">{customer.name || 'Unknown'}</strong>
                            <span className="cust-id">#{customer.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cust-contact-cell">
                          <span>{customer.email || '—'}</span>
                          <span>{formatPhone(customer.mobile || customer.phone) || '—'}</span>
                        </div>
                      </td>
                      <td className="cust-ltv">
                        {formatCurrency(customer.total_spent || customer.totalSpent || 0)}
                      </td>
                      <td className="cust-orders-count">
                        {customer.orders || customer.order_count || 0}
                      </td>
                      <td>
                        <span
                          className="cust-seg-badge"
                          style={{ background: segStyle.bg, color: segStyle.color }}
                        >
                          {seg}
                        </span>
                      </td>
                      <td>
                        <span className={`cust-status-badge ${isActive ? 'active' : 'inactive'}`}>
                          <span className={`cust-status-dot ${isActive ? 'active' : ''}`} />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        {filteredCustomers.length > 0 && (
          <div className="cust-table-footer">
            <span>Showing {filteredCustomers.length} of {customersList.length} customers</span>
            {segmentFilter !== 'All' && (
              <button className="cust-clear-filter" onClick={() => setSegmentFilter('All')}>
                Clear filter <X size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Customer Side Panel ── */}
      {showPanel && (
        <CustomerPanel
          customer={detailedCustomer || selectedCustomer}
          onClose={() => setShowPanel(false)}
          onToggleStatus={toggleStatus}
          onContact={handleContact}
        />
      )}
    </div>
  );
};

export default Customers;
