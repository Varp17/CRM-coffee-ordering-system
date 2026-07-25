import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Orders.css';
import Button from '../../../components/Button/Button';
import AdminMetricCard from '../../../components/ui/AdminMetricCard';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import ExportModal from '../../../components/ui/ExportModal';
import { useOrderStore } from '../../../store/useOrderStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { formatCurrency } from '../../../utils/formatters';
import { orderService } from '../../../services/orders';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import {
  X, RefreshCw, Search, Play, CheckCircle, Eye, Printer,
  Download, ExternalLink, ChevronDown, ShoppingBag, Clock, Bell, Check, Sparkles, Package, Calendar
} from 'lucide-react';

/* ─── Avatar Color Palette ─── */
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

/* ─── Status Badge Styles ─── */
const STATUS_STYLES = {
  pending:       { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  in_progress:   { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD', dot: '#3B82F6' },
  ready:         { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD', dot: '#7C3AED' },
  completed:     { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  cancelled:     { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
  refunded:      { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', dot: '#9CA3AF' },
};

const STATUS_OPTIONS = ['pending', 'in_progress', 'ready', 'completed', 'cancelled'];
const formatStatusLabel = (status = 'unknown') => (
  status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
);

const isComboOrder = (order) => {
  if (!order) return false;
  if (order.is_combo || order.isCombo) return true;
  if (order.shipping_address?.is_combo) return true;
  const items = order.items || [];
  return items.some(
    (i) =>
      i.is_combo ||
      i.isCombo ||
      (i.name && (i.name.toLowerCase().includes('combo') || i.name.toLowerCase().includes('custom combo'))) ||
      (i.title && (i.title.toLowerCase().includes('combo') || i.title.toLowerCase().includes('custom combo')))
  );
};

const StatusPickerControl = ({ order, isOpen, onToggle, onClose, onSelectStatus }) => {
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const status = STATUS_STYLES[order.status?.toLowerCase()] || STATUS_STYLES.refunded;

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const dropdownWidth = 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top;
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 6;
      } else {
        top = rect.bottom + 6;
      }

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12;
      }

      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 999999,
        width: `${dropdownWidth}px`,
      });
    };

    updatePosition();

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  return (
    <div className={`icit-status-control ${isOpen ? 'icit-status-control--open' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="icit-status-badge icit-status-badge--clickable"
        style={{ backgroundColor: status.bg, color: status.text }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="icit-status-dot" style={{ backgroundColor: status.dot }} />
        <span className="icit-status-label">{formatStatusLabel(order.status)}</span>
        <ChevronDown className="icit-status-chevron" size={15} strokeWidth={2} />
      </button>

      {isOpen &&
        createPortal(
          <div
            className="icit-status-picker icit-status-picker--portal"
            style={menuStyle}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((s) => {
              const isActive = (order.status || 'pending') === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={`icit-status-picker-item ${isActive ? 'icit-status-picker-item--active' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!isActive) onSelectStatus(order.id, s);
                    onClose();
                  }}
                >
                  <span className="icit-status-dot" style={{ backgroundColor: STATUS_STYLES[s]?.dot || '#9CA3AF' }} />
                  <span>{formatStatusLabel(s)}</span>
                  {isActive && <Check className="icit-status-check" size={15} strokeWidth={2} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

/* ─── Pill Filter Options & Components (Image 2 Style) ─── */
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'regular', label: 'Regular Orders' },
  { value: 'combo', label: 'Combo Orders' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest First' },
  { value: 'oldest', label: 'Sort: Oldest First' },
  { value: 'amount_high', label: 'Amount: High to Low' },
  { value: 'amount_low', label: 'Amount: Low to High' },
];

const PillDropdown = ({ label, options, value, onChange, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open || !ref.current) return;
    const updatePos = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const dropHeight = options.length * 38 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top;
      if (spaceBelow < dropHeight && rect.top > dropHeight) {
        top = rect.top - dropHeight - 6;
      } else {
        top = rect.bottom + 6;
      }
      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        zIndex: 999999,
        minWidth: `${Math.max(rect.width, 160)}px`,
      });
    };
    updatePos();
    const handleScrollOrResize = () => setOpen(false);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.icit-pill-popover')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={ref}
        type="button"
        className={`icit-pill-btn ${open ? 'icit-pill-btn--active' : ''} ${value !== options[0]?.value ? 'icit-pill-btn--selected' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {Icon && <Icon size={14} className="icit-pill-icon" />}
        <span>{selectedOption ? selectedOption.label : label}</span>
        <ChevronDown size={14} className="icit-pill-chevron" />
      </button>

      {open &&
        createPortal(
          <div className="icit-pill-popover" style={menuStyle} onClick={(e) => e.stopPropagation()}>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`icit-pill-popover-item ${value === opt.value ? 'icit-pill-popover-item--active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check size={14} className="icit-pill-check" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

const DateRangePill = ({ dateFrom, dateTo, onChangeDate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  const hasDate = Boolean(dateFrom || dateTo);
  let displayLabel = 'From → To';
  if (dateFrom && dateTo) {
    displayLabel = `${dateFrom} → ${dateTo}`;
  } else if (dateFrom) {
    displayLabel = `From ${dateFrom}`;
  } else if (dateTo) {
    displayLabel = `Until ${dateTo}`;
  }

  useEffect(() => {
    if (!open || !ref.current) return;
    const updatePos = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const dropHeight = 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top;
      if (spaceBelow < dropHeight && rect.top > dropHeight) {
        top = rect.top - dropHeight - 6;
      } else {
        top = rect.bottom + 6;
      }
      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        zIndex: 999999,
        width: '280px',
      });
    };
    updatePos();
    const handleScrollOrResize = () => setOpen(false);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.icit-pill-popover')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={ref}
        type="button"
        className={`icit-pill-btn ${open ? 'icit-pill-btn--active' : ''} ${hasDate ? 'icit-pill-btn--selected' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <Calendar size={14} className="icit-pill-icon" />
        <span>{displayLabel}</span>
      </button>

      {open &&
        createPortal(
          <div className="icit-pill-popover icit-pill-popover--date" style={menuStyle} onClick={(e) => e.stopPropagation()}>
            <div className="icit-date-picker-fields">
              <div className="icit-date-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateFrom || ''}
                  onChange={(e) => onChangeDate(e.target.value, dateTo)}
                />
              </div>
              <div className="icit-date-field">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateTo || ''}
                  onChange={(e) => onChangeDate(dateFrom, e.target.value)}
                />
              </div>
            </div>
            {hasDate && (
              <button
                type="button"
                className="icit-date-reset-btn"
                onClick={() => {
                  onChangeDate('', '');
                  setOpen(false);
                }}
              >
                Clear Date Filter
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

const Orders = () => {
  const { orders: ordersList, fetchOrders, updateOrderStatus, isLoading } = useOrderStore();
  const [orderCategory, setOrderCategory] = useState('all'); // 'regular' | 'combo' | 'all'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    tone: 'warning',
    confirmLabel: 'Confirm',
    onConfirm: null,
    isLoading: false,
  });

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

  useEffect(() => {
    if (!showDetailModal) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowDetailModal(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [showDetailModal]);

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

  // Category counts
  const categoryCounts = useMemo(() => {
    const all = ordersList || [];
    const combo = all.filter(isComboOrder);
    const regular = all.filter((o) => !isComboOrder(o));
    return {
      all: all.length,
      combo: combo.length,
      regular: regular.length,
    };
  }, [ordersList]);

  const filteredOrders = useMemo(() => {
    let result = (ordersList || []).filter((order) => {
      const isCombo = isComboOrder(order);
      if (orderCategory === 'regular' && isCombo) return false;
      if (orderCategory === 'combo' && !isCombo) return false;

      const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        (order.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || 'Guest').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());

      let matchesDate = true;
      if (dateFrom) {
        const orderDate = new Date(order.created_at || order.createdAt || 0);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) matchesDate = false;
      }
      if (dateTo && matchesDate) {
        const orderDate = new Date(order.created_at || order.createdAt || 0);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) matchesDate = false;
      }

      return matchesStatus && matchesSearch && matchesDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0);
      }
      if (sortBy === 'amount_high') {
        return (parseFloat(b.total_amount) || 0) - (parseFloat(a.total_amount) || 0);
      }
      if (sortBy === 'amount_low') {
        return (parseFloat(a.total_amount) || 0) - (parseFloat(b.total_amount) || 0);
      }
      return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
    });

    return result;
  }, [ordersList, orderCategory, statusFilter, searchQuery, dateFrom, dateTo, sortBy]);

  const isFiltered = Boolean(
    searchQuery || statusFilter !== 'all' || orderCategory !== 'all' || dateFrom || dateTo || sortBy !== 'newest'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOrderCategory('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [orderCategory, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId, newStatus) => {
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      const formatted = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('_', ' ');
      toast.success(`Task Completed: Order #${(orderId || '').substring(0, 8)} updated to "${formatted}"`, { icon: '✅' });
      if (selectedOrder?.id === orderId || selectedOrder?.order_number === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    }
  };

  const requestStatusChange = (orderId, newStatus) => {
    const formatted = formatStatusLabel(newStatus);
    const shortId = (orderId || '').substring(0, 8);
    setConfirmModal({
      isOpen: true,
      title: `Update Order Status?`,
      message: `Are you sure you want to update order #${shortId} status to "${formatted}"?`,
      tone: newStatus === 'cancelled' ? 'danger' : 'primary',
      confirmLabel: `Confirm & Update to ${formatted}`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await handleStatusChange(orderId, newStatus);
        } finally {
          setConfirmModal({ isOpen: false });
        }
      },
    });
  };

  const openDetail = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
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

  /* ─── Order Stats (Scoped by Order Category) ─── */
  const categoryFilteredList = useMemo(() => {
    return (ordersList || []).filter((order) => {
      const isCombo = isComboOrder(order);
      if (orderCategory === 'regular' && isCombo) return false;
      if (orderCategory === 'combo' && !isCombo) return false;
      return true;
    });
  }, [ordersList, orderCategory]);

  const orderStats = useMemo(
    () => ({
      total: categoryFilteredList.length,
    pending: categoryFilteredList.filter((o) => o.status === 'pending').length,
      inProgress: categoryFilteredList.filter((o) => o.status === 'in_progress').length,
      ready: categoryFilteredList.filter((o) => o.status === 'ready').length,
      completed: categoryFilteredList.filter((o) => o.status === 'completed').length,
      cancelled: categoryFilteredList.filter((o) => o.status === 'cancelled').length,
      totalRevenue: categoryFilteredList.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
    }),
    [categoryFilteredList]
  );

  /* ─── Export Modal Columns ─── */
  const orderExportColumns = useMemo(() => [
    { key: 'order_number', label: 'Order Number', required: true },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'customer_email', label: 'Customer Email' },
    { key: 'status', label: 'Status' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'total_amount', label: 'Total Amount (₹)' },
    { key: 'created_at', label: 'Order Date' },
  ], []);

  /* ─── CSV Export ─── */
  const handleExportCSV = (selectedCols) => {
    const headers = selectedCols.map((c) => c.label).join(',');
    const rows = filteredOrders
      .map((o) => {
        return selectedCols
          .map((c) => {
            const val = o[c.key] || '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',');
      })
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `orders-${orderCategory}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported');
    setShowExportModal(false);
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
            <span className="icit-stat">
              <span className="icit-stat-dot" style={{ background: '#007AFF' }} /> Total: {orderStats.total}
            </span>
            <span className="icit-stat">
              <span className="icit-stat-dot" style={{ background: '#10B981' }} /> Completed: {orderStats.completed}
            </span>
            <span className="icit-stat">
              <span className="icit-stat-dot" style={{ background: '#F59E0B' }} /> Revenue: {formatCurrency(orderStats.totalRevenue)}
            </span>
          </div>
        </div>
        <div className="icit-header-actions">
          <button className="icit-icon-btn" onClick={() => fetchOrders()} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'icit-spin' : ''}`} />
          </button>
          <button className="icit-export-btn" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ─── Order Category Segmented Switcher (Regular vs Combo Orders) ─── */}
      <div className="icit-category-switcher">
        <button
          type="button"
          className={`icit-category-tab ${orderCategory === 'regular' ? 'icit-category-tab--active' : ''}`}
          onClick={() => setOrderCategory('regular')}
        >
          <ShoppingBag size={16} />
          <span>Regular Orders</span>
          <span className="icit-tab-count">{categoryCounts.regular}</span>
        </button>

        <button
          type="button"
          className={`icit-category-tab icit-category-tab--combo ${orderCategory === 'combo' ? 'icit-category-tab--active' : ''}`}
          onClick={() => setOrderCategory('combo')}
        >
          <Sparkles size={16} />
          <span>Combo Orders</span>
          <span className="icit-tab-count">{categoryCounts.combo}</span>
        </button>

        <button
          type="button"
          className={`icit-category-tab ${orderCategory === 'all' ? 'icit-category-tab--active' : ''}`}
          onClick={() => setOrderCategory('all')}
        >
          <Package size={16} />
          <span>All Orders</span>
          <span className="icit-tab-count">{categoryCounts.all}</span>
        </button>
      </div>

      {/* ─── Summary Stat Cards (ICIT Style) ─── */}
      <div className="icit-stats-bar">
        {[
          { label: 'Total', count: orderStats.total, description: `${orderCategory} store orders`, tone: 'purple', icon: ShoppingBag, filter: 'all' },
          { label: 'Pending', count: orderStats.pending, description: 'awaiting preparation', tone: 'orange', icon: Clock, filter: 'pending' },
          { label: 'In Progress', count: orderStats.inProgress, description: 'currently brewing', tone: 'blue', icon: RefreshCw, filter: 'in_progress' },
          { label: 'Ready', count: orderStats.ready, description: 'ready for pickup', tone: 'cyan', icon: Bell, filter: 'ready' },
          { label: 'Completed', count: orderStats.completed, description: 'fulfilled orders', tone: 'green', icon: CheckCircle, filter: 'completed' },
          { label: 'Cancelled', count: orderStats.cancelled, description: 'cancelled orders', tone: 'red', icon: X, filter: 'cancelled' },
        ].map((s) => (
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

      {/* ─── Search & Filter Bar (Image 2 Pill Style) ─── */}
      <div className="icit-toolbar-pill-row">
        {/* Search Pill */}
        <div className="icit-pill-search">
          <Search size={15} className="icit-search-icon" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="icit-search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Date Range Pill */}
        <DateRangePill
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeDate={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />

        {/* Status Filter Pill */}
        <PillDropdown
          label="All Statuses"
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Type Filter Pill */}
        <PillDropdown
          label="All Types"
          options={CATEGORY_FILTER_OPTIONS}
          value={orderCategory}
          onChange={setOrderCategory}
        />

        {/* Sort Filter Pill */}
        <PillDropdown
          label="Sort By"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
        />

        {/* Reset Pill */}
        {isFiltered && (
          <button
            type="button"
            className="icit-pill-btn icit-pill-btn--reset"
            onClick={handleResetFilters}
          >
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* ─── ICIT-Style Data Table ─── */}
      <div className="icit-table-wrapper">
        <div className="icit-table-scroll">
          <table className="icit-table">
            <thead>
              <tr>
                <th style={{ minWidth: '130px' }}>Order</th>
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 16px', color: '#94A3B8', fontSize: '15px', fontWeight: 600 }}>
                    No {orderCategory !== 'all' ? orderCategory : ''} orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isCombo = isComboOrder(order);
                  const avatar = getAvatarColor(order.customer_name);
                  const status = STATUS_STYLES[order.status?.toLowerCase()] || STATUS_STYLES.refunded;
                  const itemsText =
                    (order.items && order.items.map((i) => `${i.name || i.title} ×${i.quantity || 1}`).join(', ')) ||
                    order.items_summary ||
                    '—';

                  return (
                    <tr key={order.id} className="icit-row">
                      {/* Order # + Combo Tag */}
                      <td className="icit-td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className="icit-order-id">{order.order_number || order.id}</span>
                          {isCombo && (
                            <span className="combo-tag-badge">
                              <Sparkles size={11} /> Combo
                            </span>
                          )}
                        </div>
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

                      {/* Status Badge (smooth portal dropdown picker with confirmation step) */}
                      <td className="icit-td">
                        <StatusPickerControl
                          order={order}
                          isOpen={openStatusId === order.id}
                          onToggle={() => setOpenStatusId(openStatusId === order.id ? null : order.id)}
                          onClose={() => setOpenStatusId(null)}
                          onSelectStatus={requestStatusChange}
                        />
                      </td>

                      {/* Date */}
                      <td className="icit-td">
                        <span className="icit-date">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="icit-td">
                        <span className="icit-amount">{formatCurrency(order.total_amount || order.total)}</span>
                      </td>

                      {/* Time */}
                      <td className="icit-td">
                        <span className="icit-time">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      {/* Actions (sticky right) */}
                      <td className="icit-td icit-td-sticky">
                        <div className="icit-actions">
                          {getNextStatus(order.status) && (
                            <button
                              className="icit-action-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(order.id, getNextStatus(order.status));
                              }}
                              style={{ backgroundColor: getActionColor(order.status) }}
                            >
                              {order.status === 'pending' && <Play size={15} />}
                              {(order.status === 'in_progress' || order.status === 'ready') && <CheckCircle size={15} />}
                              {getActionLabel(order.status)}
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <button
                              className="icit-action-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success('Invoice generated for #' + (order.order_number || order.id));
                              }}
                            >
                              <Printer size={15} /> Print
                            </button>
                          )}
                          <button
                            className="icit-action-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(order);
                            }}
                          >
                            <ExternalLink size={15} /> View
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
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={currentPage === p ? 'icit-page-active' : ''} onClick={() => setCurrentPage(p)}>
                {p}
              </button>
            ))}
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ─── Order Detail Modal ─── */}
      {showDetailModal && selectedOrder && (
        <div className="order-detail-modal-overlay" onMouseDown={() => setShowDetailModal(false)}>
          <section
            className="order-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="order-detail-modal__header">
              <div>
                <h3 id="order-detail-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Order #{selectedOrder.order_number || selectedOrder.id}
                  {isComboOrder(selectedOrder) && (
                    <span className="combo-tag-badge" style={{ fontSize: '12px', padding: '3px 10px' }}>
                      <Sparkles size={13} /> Custom Combo Box
                    </span>
                  )}
                </h3>
                <p>
                  {selectedOrder.customer_name || 'Guest'} ·{' '}
                  {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                </p>
              </div>
              <button className="panel-close-btn" onClick={() => setShowDetailModal(false)} aria-label="Close order details">
                <X size={16} />
              </button>
            </div>

            <div className="order-detail-modal__body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <span>{selectedOrder.customer_name || 'Guest'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span>{selectedOrder.customer_email || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Order Details</h4>
                  <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span>{isComboOrder(selectedOrder) ? '✨ Custom Combo Box' : 'Standard Order'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Placed</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</span>
                  </div>
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
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: done ? '#007AFF' : '#E2E8F0',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                          }}
                        >
                          {done ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '6px' }}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedOrder.items && (
                <div className="detail-section" style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px', letterSpacing: '0.04em' }}>
                    Items Ordered ({selectedOrder.items.length})
                  </h4>
                  <div className="detail-items-scroll">
                    <table className="table detail-items-table">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '13px', fontWeight: 700, color: '#475569', padding: '10px 12px' }}>Item</th>
                          <th style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'center', padding: '10px 12px' }}>Qty</th>
                          <th style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'right', padding: '10px 12px' }}>Price</th>
                          <th style={{ fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'right', padding: '10px 12px' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, i) => {
                          const displayName = item.name || item.item_name || item.product?.name || item.Product?.name || item.title || (item.product_id ? `Product (${item.product_id})` : `Coffee Item #${i + 1}`);
                          const qty = item.quantity || item.qty || 1;
                          const price = item.unit_price || item.price || 0;
                          const subtotal = (item.line_total || price * qty);
                          const isComboItem = item.is_combo || item.isCombo || (displayName && displayName.toLowerCase().includes('combo'));

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '12px', fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                                <span>{displayName}</span>
                                {isComboItem && (
                                  <span className="combo-tag-badge" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                    <Sparkles size={11} /> Combo
                                  </span>
                                )}
                                {item.size && (
                                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B', display: 'block', marginTop: '2px' }}>
                                    Size: {item.size}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                                {qty}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontSize: '15px', fontWeight: 500, color: '#475569' }}>
                                {formatCurrency(price)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                                {formatCurrency(subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', paddingRight: '16px', fontSize: '16px', fontWeight: 700, color: '#0F172A', paddingTop: '14px' }}>
                            Grand Total
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '18px', fontWeight: 800, color: '#0F172A', paddingTop: '14px' }}>
                            {formatCurrency(selectedOrder.total_amount || selectedOrder.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="order-detail-modal__footer">
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
              <Button variant="outline" onClick={() => toast.success('Invoice generated')}>
                Invoice
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Step Confirmation Modal ("Are you sure?") */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        tone={confirmModal.tone}
        confirmLabel={confirmModal.confirmLabel}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      {/* ICIT 3-Step Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Orders Data"
        columns={orderExportColumns}
        data={categoryFilteredList}
        filenameBase={`Orders_${orderCategory}`}
      />
    </div>
  );
};

export default Orders;
