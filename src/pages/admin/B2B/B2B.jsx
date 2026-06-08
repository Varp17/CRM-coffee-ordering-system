import React, { useState, useEffect, useMemo } from 'react';
import './B2B.css';
import { b2bService } from '../../../services/b2b';
import { formatCurrency, formatDate, formatPhone } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, ChevronDown, ChevronRight, Users, DollarSign, ShoppingBag, Plus } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'active', 'inactive', 'suspended'];

const B2B = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({ users: [], pricing: [], orders: [] });
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '', gstin: '', credit_limit: '', status: 'active',
  });

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await b2bService.getAccounts();
      setAccounts(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load B2B accounts: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (a.company_name || '').toLowerCase().includes(q) || (a.contact_person || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || (a.status || '').toLowerCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [accounts, searchQuery, statusFilter]);

  const toggleExpand = async (account) => {
    if (expandedId === account.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(account.id);
    setLoadingExpanded(true);
    try {
      const [usersRes, pricingRes, ordersRes] = await Promise.all([
        b2bService.getUsers(account.id),
        b2bService.getPricing(account.id),
        b2bService.getOrders(account.id, {}),
      ]);
      setExpandedData({
        users: unwrapList(usersRes),
        pricing: unwrapList(pricingRes),
        orders: unwrapList(ordersRes),
      });
    } catch (err) {
      toast.error('Failed to load account details: ' + err.message);
      setExpandedData({ users: [], pricing: [], orders: [] });
    } finally {
      setLoadingExpanded(false);
    }
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({ company_name: '', contact_person: '', email: '', phone: '', gstin: '', credit_limit: '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      company_name: account.company_name || '',
      contact_person: account.contact_person || '',
      email: account.email || '',
      phone: account.phone || '',
      gstin: account.gstin || '',
      credit_limit: account.credit_limit || '',
      status: account.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, credit_limit: parseFloat(formData.credit_limit) || 0 };
      if (editingAccount) {
        await b2bService.updateAccount(editingAccount.id, payload);
        toast.success('Account updated');
      } else {
        await b2bService.createAccount(payload);
        toast.success('Account created');
      }
      setShowModal(false);
      loadAccounts();
    } catch (err) {
      toast.error('Failed to save account: ' + err.message);
    }
  };

  const columns = useMemo(() => [
    {
      header: 'Company', accessor: 'company_name', sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="b2b-expand-btn" onClick={() => toggleExpand(row)}>
            {expandedId === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <strong>{row.company_name}</strong>
        </div>
      ),
    },
    { header: 'Contact Person', accessor: 'contact_person', sortable: true },
    { header: 'Email', accessor: 'email', sortable: true },
    { header: 'Phone', accessor: 'phone', sortable: true, render: (row) => formatPhone(row.phone) },
    { header: 'GSTIN', accessor: 'gstin', sortable: true, render: (row) => <code>{row.gstin || '-'}</code> },
    { header: 'Credit Limit', accessor: 'credit_limit', sortable: true, render: (row) => formatCurrency(row.credit_limit) },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => <span className={`b2b-status-badge ${row.status}`}>{row.status}</span>,
    },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn-sm outline" onClick={() => openEditModal(row)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
        </div>
      ),
    },
  ], [expandedId]);

  return (
    <div className="b2b-view animate-fade-in">
      <div className="b2b-header">
        <div>
          <h2 className="section-title">B2B Accounts</h2>
          <p className="section-subtitle">Manage corporate accounts, contract pricing, and bulk orders</p>
        </div>
        <div className="b2b-header-actions">
          <button className="b2b-action-btn ghost" onClick={loadAccounts}><RefreshCw size={13} /></button>
          <button className="b2b-action-btn primary" onClick={openAddModal}><Plus size={14} /> Add Account</button>
        </div>
      </div>

      <div className="b2b-toolbar">
        <div className="b2b-search-box">
          <input type="text" placeholder="Search by company, contact or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="b2b-search-input" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="b2b-select">
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {isLoading && accounts.length === 0 ? (
        <div className="b2b-loading">Loading accounts...</div>
      ) : (
        <div className="b2b-table-card">
          <table className="b2b-table">
            <thead>
              <tr>
                <th>Company</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>GSTIN</th><th>Credit Limit</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={8} className="b2b-empty-row">No accounts found</td></tr>
              ) : (
                filteredAccounts.map((acc, i) => (
                  <React.Fragment key={acc.id || i}>
                    <tr className="b2b-row" onClick={() => toggleExpand(acc)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleExpand(acc)}>
                      <td>
                        <div className="b2b-company-cell">
                          <button className="b2b-expand-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(acc); }}>
                            {expandedId === acc.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <strong>{acc.company_name}</strong>
                        </div>
                      </td>
                      <td>{acc.contact_person || '-'}</td>
                      <td>{acc.email || '-'}</td>
                      <td>{formatPhone(acc.phone) || '-'}</td>
                      <td><code>{acc.gstin || '-'}</code></td>
                      <td className="b2b-currency">{formatCurrency(acc.credit_limit)}</td>
                      <td><span className={`b2b-status-badge ${acc.status}`}>{acc.status}</span></td>
                      <td>
                        <button className="action-btn-sm outline" onClick={(e) => { e.stopPropagation(); openEditModal(acc); }} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
                      </td>
                    </tr>
                    {expandedId === acc.id && (
                      <tr className="b2b-expanded-row">
                        <td colSpan={8}>
                          <div className="b2b-expanded-content">
                            {loadingExpanded ? (
                              <p className="b2b-loading-text">Loading details...</p>
                            ) : (
                              <div className="b2b-expanded-grid">
                                <div className="b2b-expanded-section">
                                  <h4><Users size={13} /> Users</h4>
                                  {expandedData.users.length === 0 ? <p className="b2b-empty-text">No users</p> : (
                                    <table className="b2b-inner-table">
                                      <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                                      <tbody>{expandedData.users.map((u, idx) => <tr key={idx}><td>{u.name}</td><td>{u.email}</td><td>{u.role || '-'}</td></tr>)}</tbody>
                                    </table>
                                  )}
                                </div>
                                <div className="b2b-expanded-section">
                                  <h4><DollarSign size={13} /> Contract Pricing</h4>
                                  {expandedData.pricing.length === 0 ? <p className="b2b-empty-text">No custom pricing</p> : (
                                    <table className="b2b-inner-table">
                                      <thead><tr><th>Product</th><th>Unit Price</th><th>Min Qty</th></tr></thead>
                                      <tbody>{expandedData.pricing.map((p, idx) => <tr key={idx}><td>{p.product_name}</td><td className="b2b-currency">{formatCurrency(p.unit_price)}</td><td>{p.min_quantity}</td></tr>)}</tbody>
                                    </table>
                                  )}
                                </div>
                                <div className="b2b-expanded-section">
                                  <h4><ShoppingBag size={13} /> Bulk Orders</h4>
                                  {expandedData.orders.length === 0 ? <p className="b2b-empty-text">No orders yet</p> : (
                                    <table className="b2b-inner-table">
                                      <thead><tr><th>Order #</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                                      <tbody>{expandedData.orders.map((o, idx) => <tr key={idx}><td>#{o.order_number || o.id}</td><td className="b2b-currency">{formatCurrency(o.total_amount)}</td><td><span className={`b2b-status-badge ${o.status}`}>{o.status}</span></td><td>{formatDate(o.created_at)}</td></tr>)}</tbody>
                                    </table>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
          <div className="b2b-table-footer">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content b2b-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
              <button className="panel-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="b2b-form-grid">
                  <div className="form-group">
                    <label>Company Name</label>
                    <input className="b2b-input" value={formData.company_name} onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input className="b2b-input" value={formData.contact_person} onChange={(e) => setFormData(p => ({ ...p, contact_person: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="b2b-input" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="b2b-input" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input className="b2b-input" value={formData.gstin} onChange={(e) => setFormData(p => ({ ...p, gstin: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Credit Limit (₹)</label>
                    <input type="number" className="b2b-input" value={formData.credit_limit} onChange={(e) => setFormData(p => ({ ...p, credit_limit: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="b2b-input" value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="b2b-action-btn primary">{editingAccount ? 'Update' : 'Create'} Account</button>
                <button type="button" className="b2b-action-btn ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2B;
