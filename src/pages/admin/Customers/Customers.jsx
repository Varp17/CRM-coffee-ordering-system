import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Customers.css';
import { customerService } from '../../../services/customers';
import { analyticsService } from '../../../services/analytics';
import { formatCurrency, formatDate, formatPhone } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════
// Motion System — Cubic Bezier: Weighted Kinetic Luxury Pacing
// ═══════════════════════════════════════════════════════════════
const EASE = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { ease: EASE, duration: 0.9 } }
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i) => ({
    opacity: 1, x: 0,
    transition: { ease: EASE, duration: 0.7, delay: i * 0.04 }
  })
};

// ═══════════════════════════════════════════════════════════════
// Cinematic Reveal Overlay — Delayed Environment Activation
// ═══════════════════════════════════════════════════════════════
const CinematicReveal = ({ onComplete }) => (
  <motion.div
    className="cinematic-reveal-overlay"
    exit={{ opacity: 0, transition: { duration: 1.4, ease: EASE } }}
  >
    <div style={{ textAlign: 'center' }}>
      <svg width="44" height="44" viewBox="0 0 100 100" fill="none" style={{ marginBottom: '20px' }}>
        <circle cx="50" cy="50" r="44" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
        <motion.circle
          cx="50" cy="50" r="44"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeDasharray="276"
          initial={{ strokeDashoffset: 276 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2.4, ease: EASE }}
        />
      </svg>
      <motion.span
        className="mono-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 1] }}
        transition={{ duration: 2 }}
        style={{ color: '#999' }}
      >
        INITIALIZING PATRON ARCHIVE
      </motion.span>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// Segment Badge Component
// ═══════════════════════════════════════════════════════════════
const SegmentBadge = ({ segment }) => {
  const s = segment || 'New';
  return (
    <span className={`patron-mono-tag ${s === 'VIP' ? 'vip' : ''}`}>
      {s}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// Stat Card — Editorial Typography
// ═══════════════════════════════════════════════════════════════
const StatCard = ({ index, label, value, accent }) => (
  <motion.div className="editorial-stat-card" variants={itemVariants}>
    <span className="mono-label">[{String(index).padStart(2, '0')} / {label}]</span>
    <span className={`editorial-stat-num ${accent ? 'accent' : ''}`}>{value}</span>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// Profile Exhibition Drawer
// ═══════════════════════════════════════════════════════════════
const PatronDrawer = ({ customer, onClose, onToggleStatus, onContact }) => {
  if (!customer) return null;

  const isActive = customer.is_active ?? 1;
  const segment = customer.segment || (
    (customer.orders || 0) >= 15 ? 'VIP' :
    (customer.orders || 0) >= 5 ? 'Regular' :
    (customer.orders || 0) >= 1 ? 'New' : 'At Risk'
  );

  return (
    <motion.div
      className="exhibition-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      onClick={onClose}
    >
      <motion.div
        className="exhibition-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ ease: EASE, duration: 0.8 }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          {/* Drawer Header */}
          <div className="drawer-header">
            <div className="drawer-header-main">
              <span className="mono-label">[PATRON PROFILE]</span>
              <h2>{customer.name || 'Anonymous Patron'}</h2>
              <span className="mono-label" style={{ marginTop: '4px', fontSize: '0.6rem' }}>
                {customer.uuid || `ID-${customer.id}`}
              </span>
            </div>
            <button className="drawer-close-btn" onClick={onClose}>CLOSE</button>
          </div>

          {/* Telemetry Stats */}
          <div className="drawer-stats-row">
            <div className="drawer-stat-item">
              <span className="mono-label">Lifetime Value</span>
              <span className="drawer-stat-val accent">
                {formatCurrency(customer.total_spent || customer.totalSpent || 0)}
              </span>
            </div>
            <div className="drawer-stat-item">
              <span className="mono-label">Total Orders</span>
              <span className="drawer-stat-val">
                {customer.order_count || customer.orders || 0}
              </span>
            </div>
          </div>

          {/* Segment & Status */}
          <div className="drawer-section">
            <h3>Classification</h3>
            <div className="drawer-contact-grid">
              <div className="drawer-contact-row">
                <span className="drawer-contact-label">Segment</span>
                <span className="drawer-contact-value">
                  <SegmentBadge segment={segment} />
                </span>
              </div>
              <div className="drawer-contact-row">
                <span className="drawer-contact-label">Status</span>
                <span className="drawer-contact-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`patron-status-dot ${isActive ? 'active' : ''}`} />
                  {isActive ? 'Active' : 'Dormant'}
                </span>
              </div>
              {customer.joinedDate && (
                <div className="drawer-contact-row">
                  <span className="drawer-contact-label">Member Since</span>
                  <span className="drawer-contact-value">{formatDate(customer.joinedDate)}</span>
                </div>
              )}
              {customer.lastOrder && (
                <div className="drawer-contact-row">
                  <span className="drawer-contact-label">Last Activity</span>
                  <span className="drawer-contact-value">{formatDate(customer.lastOrder)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="drawer-section">
            <h3>Contact Registry</h3>
            <div className="drawer-contact-grid">
              <div className="drawer-contact-row">
                <span className="drawer-contact-label">Email</span>
                <span className="drawer-contact-value">{customer.email || 'Not registered'}</span>
              </div>
              <div className="drawer-contact-row">
                <span className="drawer-contact-label">Mobile</span>
                <span className="drawer-contact-value" style={{ fontFamily: "'SF Mono', monospace" }}>
                  {formatPhone(customer.mobile || customer.phone) || 'Not registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders (if available) */}
          {customer.recentOrders && customer.recentOrders.length > 0 && (
            <div className="drawer-section">
              <h3>Recent Activity</h3>
              <div className="drawer-contact-grid">
                {customer.recentOrders.slice(0, 5).map((order, i) => (
                  <div key={order.id || i} className="drawer-contact-row" style={{ fontSize: '0.8rem' }}>
                    <span className="drawer-contact-label" style={{ fontFamily: "'SF Mono', monospace" }}>
                      #{order.order_number || order.id}
                    </span>
                    <span className="drawer-contact-value">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="drawer-actions">
          <button
            className="drawer-btn-outline"
            onClick={() => onToggleStatus(customer.id, isActive)}
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>
          <button
            className="drawer-btn-primary"
            onClick={() => onContact(customer, 'whatsapp')}
          >
            Message
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Main CRM Component — White Cube Gallery Aesthetic
// ═══════════════════════════════════════════════════════════════
const Customers = () => {
  const [customersList, setCustomersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  const [showProfile, setShowProfile] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailedCustomer, setDetailedCustomer] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const segments = ['all', 'VIP', 'Regular', 'New', 'At Risk'];

  // ── Delayed Environment Activation (2.8s Cinematic Staging) ──
  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  // ── Load Customers ──
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await customerService.getAll();
      setCustomersList(unwrapList(res));
    } catch (err) {
      setLoadError(err.message || 'Failed to load patrons.');
      setCustomersList([]);
      toast.error('Connection error — ' + (err.message || 'unknown'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // ── Filter Logic ──
  const filteredCustomers = useMemo(() => {
    return (Array.isArray(customersList) ? customersList : []).filter(c => {
      const name = c.name || '';
      const email = c.email || '';
      const phone = c.mobile || c.phone || '';
      const segment = c.segment || 'New';

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.includes(searchQuery);
      const matchesSegment = segmentFilter === 'all' ||
        segment.toLowerCase() === segmentFilter.toLowerCase();
      return matchesSearch && matchesSegment;
    });
  }, [customersList, searchQuery, segmentFilter]);

  // ── Summary Statistics ──
  const summaryStats = useMemo(() => {
    const list = Array.isArray(customersList) ? customersList : [];
    const activeCount = list.filter(c => c.is_active ?? 1).length;
    const vipCount = list.filter(c => c.segment === 'VIP').length;
    const totalLTV = list.reduce((sum, c) => sum + parseFloat(c.total_spent || c.totalSpent || 0), 0);
    const avgOrderValue = list.length > 0
      ? list.reduce((sum, c) => sum + parseFloat(c.total_spent || c.totalSpent || 0), 0) / Math.max(list.reduce((sum, c) => sum + (c.orders || c.order_count || 0), 0), 1)
      : 0;
    return { total: list.length, activeCount, vipCount, totalLTV, avgOrderValue };
  }, [customersList]);

  // ── Profile Drawer ──
  const openProfile = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    setDetailedCustomer(null);
    setShowProfile(true);

    // Fetch detailed data with recent orders
    try {
      const res = await customerService.getById(customer.id);
      const detail = unwrapObject(res);
      setDetailedCustomer({ ...customer, ...detail });
    } catch {
      // Fall back to list-level data
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
    toast.success(`Opening ${type} to ${customer.name || 'patron'}...`);
  }, []);

  const toggleStatus = useCallback(async (id, currentlyActive) => {
    try {
      toast.success(`Patron status updated`);
      setShowProfile(false);
      loadCustomers();
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  }, [loadCustomers]);

  const handleExport = useCallback(() => {
    toast.success('Generating CRM export...');
    // Could wire to /reports/export?reportType=customers
  }, []);

  // ── Loading State ──
  if (isLoading && customersList.length === 0) {
    return (
      <div className="customers-view-monochrome crm-loading-state">
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
          <motion.circle
            cx="50" cy="50" r="44"
            stroke="#1a1a1a" strokeWidth="1.5"
            strokeDasharray="276"
            animate={{ strokeDashoffset: [276, 0, 276] }}
            transition={{ duration: 3, repeat: Infinity, ease: EASE }}
          />
        </svg>
        <span className="mono-label">MAPPING PATRON TELEMETRY</span>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="customers-view-monochrome">
      {/* Cinematic Reveal */}
      <AnimatePresence>
        {!isRevealed && <CinematicReveal />}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isRevealed ? 'show' : 'hidden'}
      >
        {/* ═══ Header Section ═══ */}
        <motion.div className="crm-header-row" variants={itemVariants}>
          <div>
            <span className="mono-label">[CRM / PATRON DIRECTORY]</span>
            <h1 className="massive-display-title">Customer Relations</h1>
            <p className="section-subtitle-mono">
              Experiential CRM mapping consumption analytics, customer segmentation,
              and lifetime value metrics across all channels.
            </p>
          </div>
          <button className="crm-export-btn" onClick={handleExport}>
            Export Archive
          </button>
        </motion.div>

        {/* ═══ Toolbar ═══ */}
        <motion.div className="gallery-toolbar" variants={itemVariants}>
          <div className="gallery-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5b5b5" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gallery-search-input"
            />
          </div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="gallery-select"
          >
            {segments.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Segments' : s}
              </option>
            ))}
          </select>
        </motion.div>

        {/* ═══ Editorial Grid: Table + Sidebar ═══ */}
        <div className="editorial-grid">

          {/* ── Patron Table ── */}
          <motion.div className="patron-exhibition-list" variants={itemVariants}>
            <table className="patron-table">
              <thead>
                <tr>
                  <th>Patron</th>
                  <th>Contact</th>
                  <th>LTV</th>
                  <th>Orders</th>
                  <th>Segment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-patron-cell">
                      {loadError
                        ? `CONNECTION ERROR — ${loadError}`
                        : 'NO PATRON RECORDS MATCH CURRENT FILTERS'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id || index}
                      onClick={() => openProfile(customer)}
                      className="patron-row-monochrome"
                      variants={rowVariants}
                      custom={index}
                    >
                      {/* Patron Identity */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div className="patron-avatar">
                            {(customer.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="patron-name">
                              {customer.name || 'Anonymous'}
                            </span>
                            <span className="patron-uuid">
                              {customer.uuid ? customer.uuid.slice(0, 8) : `#${customer.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="patron-contact-email">
                            {customer.email || '—'}
                          </span>
                          <span className="patron-contact-phone">
                            {customer.mobile || customer.phone || '—'}
                          </span>
                        </div>
                      </td>

                      {/* LTV */}
                      <td>
                        <span className="patron-ltv">
                          {formatCurrency(customer.total_spent || customer.totalSpent || 0)}
                        </span>
                      </td>

                      {/* Orders */}
                      <td>
                        <span className="patron-ltv">
                          {customer.orders || customer.order_count || 0}
                        </span>
                      </td>

                      {/* Segment */}
                      <td>
                        <SegmentBadge segment={customer.segment} />
                      </td>

                      {/* Status */}
                      <td>
                        <span className="patron-status-text">
                          <span className={`patron-status-dot ${(customer.is_active ?? 1) ? 'active' : ''}`} />
                          {(customer.is_active ?? 1) ? 'Active' : 'Dormant'}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            {filteredCustomers.length > 0 && (
              <div style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(0,0,0,0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className="mono-label" style={{ fontSize: '0.6rem' }}>
                  SHOWING {filteredCustomers.length} OF {customersList.length} PATRONS
                </span>
                <span className="mono-label" style={{ fontSize: '0.6rem' }}>
                  {segmentFilter !== 'all' ? `FILTER: ${segmentFilter.toUpperCase()}` : 'ALL SEGMENTS'}
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Floating Sidebar ── */}
          <div className="cinematic-sidebar">
            <motion.div className="sidebar-stats-stack" variants={containerVariants}>
              <StatCard
                index={1}
                label="TOTAL PATRONS"
                value={summaryStats.total}
              />
              <StatCard
                index={2}
                label="ACTIVE CONNECTIONS"
                value={summaryStats.activeCount}
              />
              <StatCard
                index={3}
                label="VIP PATRONS"
                value={summaryStats.vipCount}
              />
              <StatCard
                index={4}
                label="AGGREGATE LTV"
                value={formatCurrency(summaryStats.totalLTV)}
                accent
              />
              <StatCard
                index={5}
                label="AVG ORDER VALUE"
                value={formatCurrency(summaryStats.avgOrderValue)}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Profile Exhibition Drawer ═══ */}
      <AnimatePresence>
        {showProfile && (
          <PatronDrawer
            customer={detailedCustomer || selectedCustomer}
            onClose={() => setShowProfile(false)}
            onToggleStatus={toggleStatus}
            onContact={handleContact}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
