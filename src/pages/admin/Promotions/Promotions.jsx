import React, { useState, useEffect, useMemo } from 'react';
import './Promotions.css';
import { promotionsService } from '../../../services/promotions';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Plus, Tag, ChevronRight, ChevronDown, Percent } from 'lucide-react';

const TYPE_OPTIONS = ['all', 'percentage', 'fixed', 'bogo', 'bundle'];

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    name: '', type: 'percentage', value: '', min_order_amount: '', valid_from: '', valid_until: '', status: 'active',
  });
  const [expandedId, setExpandedId] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeForm, setCodeForm] = useState({ code: '', usage_limit: '', max_discount: '' });
  const [loadingCodes, setLoadingCodes] = useState(false);

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (dateFrom) params.valid_from = dateFrom;
      if (dateTo) params.valid_until = dateTo;
      const res = await promotionsService.getAll(params);
      setPromotions(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load promotions: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPromotions(); }, [typeFilter, dateFrom, dateTo]);

  const filteredPromotions = useMemo(() => {
    if (!searchQuery) return promotions;
    const q = searchQuery.toLowerCase();
    return promotions.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [promotions, searchQuery]);

  const openAddModal = () => {
    setEditingPromo(null);
    setPromoForm({ name: '', type: 'percentage', value: '', min_order_amount: '', valid_from: '', valid_until: '', status: 'active' });
    setShowPromoModal(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      name: promo.name || '',
      type: promo.type || 'percentage',
      value: promo.value || '',
      min_order_amount: promo.min_order_amount || '',
      valid_from: promo.valid_from ? promo.valid_from.slice(0, 10) : '',
      valid_until: promo.valid_until ? promo.valid_until.slice(0, 10) : '',
      status: promo.status || 'active',
    });
    setShowPromoModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...promoForm,
        value: parseFloat(promoForm.value) || 0,
        min_order_amount: parseFloat(promoForm.min_order_amount) || 0,
      };
      if (editingPromo) {
        await promotionsService.update(editingPromo.id, payload);
        toast.success('Promotion updated');
      } else {
        await promotionsService.create(payload);
        toast.success('Promotion created');
      }
      setShowPromoModal(false);
      loadPromotions();
    } catch (err) {
      toast.error('Failed to save promotion: ' + err.message);
    }
  };

  const toggleCodes = async (promo) => {
    if (expandedId === promo.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(promo.id);
    setLoadingCodes(true);
    try {
      const res = await promotionsService.getCodes(promo.id);
      setPromoCodes(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load promo codes: ' + err.message);
      setPromoCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleAddCode = async () => {
    if (!expandedId) return;
    try {
      const payload = { ...codeForm, usage_limit: parseInt(codeForm.usage_limit) || 0, max_discount: parseFloat(codeForm.max_discount) || 0 };
      await promotionsService.createCode(expandedId, payload);
      toast.success('Promo code added');
      setShowCodeModal(false);
      setCodeForm({ code: '', usage_limit: '', max_discount: '' });
      const res = await promotionsService.getCodes(expandedId);
      setPromoCodes(unwrapList(res));
    } catch (err) {
      toast.error('Failed to add code: ' + err.message);
    }
  };

  const getTypeColor = (type) => {
    const colors = { percentage: 'type-percentage', fixed: 'type-fixed', bogo: 'type-bogo', bundle: 'type-bundle' };
    return colors[type] || '';
  };

  const columns = useMemo(() => [
    {
      header: 'Name', accessor: 'name', sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="promo-expand-btn" onClick={() => toggleCodes(row)}>
            {expandedId === row.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <strong>{row.name}</strong>
        </div>
      ),
    },
    { header: 'Type', accessor: 'type', sortable: true, render: (row) => <span className={`promo-type-badge ${getTypeColor(row.type)}`}>{row.type}</span> },
    { header: 'Value', accessor: 'value', sortable: true, render: (row) => row.type === 'percentage' ? `${row.value}%` : formatCurrency(row.value) },
    { header: 'Min Order', accessor: 'min_order_amount', sortable: true, render: (row) => row.min_order_amount ? formatCurrency(row.min_order_amount) : '-' },
    { header: 'Valid From', accessor: 'valid_from', sortable: true, render: (row) => row.valid_from ? formatDate(row.valid_from) : '-' },
    { header: 'Valid Until', accessor: 'valid_until', sortable: true, render: (row) => row.valid_until ? formatDate(row.valid_until) : '-' },
    { header: 'Status', accessor: 'status', sortable: true, render: (row) => <span className={`promo-status-badge ${row.status}`}>{row.status}</span> },
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
    <div className="promo-view animate-fade-in">
      <div className="promo-header">
        <div>
          <h2 className="section-title">Promotions</h2>
          <p className="section-subtitle">Create and manage discounts, BOGO offers, and promo codes</p>
        </div>
        <div className="promo-header-actions">
          <button className="promo-action-btn ghost" onClick={loadPromotions}><RefreshCw size={13} /></button>
          <button className="promo-action-btn primary" onClick={openAddModal}><Plus size={14} /> Add Promotion</button>
        </div>
      </div>

      <div className="promo-toolbar">
        <div className="promo-search-box">
          <input type="text" placeholder="Search promotions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="promo-search-input" />
        </div>
        <div className="promo-filter-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="promo-select">
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="promo-date-input" placeholder="From" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="promo-date-input" placeholder="To" />
        </div>
      </div>

      {isLoading && promotions.length === 0 ? (
        <div className="promo-loading">Loading promotions...</div>
      ) : (
        <div className="promo-table-card">
          <table className="promo-table">
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Value</th><th>Min Order</th><th>Valid From</th><th>Valid Until</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.length === 0 ? (
                <tr><td colSpan={8} className="promo-empty-row">No promotions found</td></tr>
              ) : (
                filteredPromotions.map((promo, i) => (
                  <React.Fragment key={promo.id || i}>
                    <tr className="promo-row" tabIndex={0}>
                      <td>
                        <div className="promo-name-cell">
                          <button className="promo-expand-btn" onClick={() => toggleCodes(promo)}>
                            {expandedId === promo.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <strong>{promo.name}</strong>
                        </div>
                      </td>
                      <td><span className={`promo-type-badge ${getTypeColor(promo.type)}`}>{promo.type}</span></td>
                      <td className="promo-value-cell">{promo.type === 'percentage' ? `${promo.value}%` : formatCurrency(promo.value)}</td>
                      <td>{promo.min_order_amount ? formatCurrency(promo.min_order_amount) : '-'}</td>
                      <td>{promo.valid_from ? formatDate(promo.valid_from) : '-'}</td>
                      <td>{promo.valid_until ? formatDate(promo.valid_until) : '-'}</td>
                      <td><span className={`promo-status-badge ${promo.status}`}>{promo.status}</span></td>
                      <td>
                        <button className="action-btn-sm outline" onClick={() => openEditModal(promo)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
                      </td>
                    </tr>
                    {expandedId === promo.id && (
                      <tr className="promo-expanded-row">
                        <td colSpan={8}>
                          <div className="promo-expanded-content">
                            <div className="promo-codes-header">
                              <h4><Tag size={13} /> Promo Codes</h4>
                              <button className="promo-action-btn primary small" onClick={() => setShowCodeModal(true)}><Plus size={12} /> Add Code</button>
                            </div>
                            {loadingCodes ? (
                              <p className="promo-loading-text">Loading codes...</p>
                            ) : promoCodes.length === 0 ? (
                              <p className="promo-empty-text">No promo codes yet</p>
                            ) : (
                              <table className="promo-inner-table">
                                <thead>
                                  <tr><th>Code</th><th>Usage Limit</th><th>Times Used</th><th>Max Discount</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                  {promoCodes.map((c, idx) => (
                                    <tr key={idx}>
                                      <td><code className="promo-code-text">{c.code}</code></td>
                                      <td>{c.usage_limit || 'Unlimited'}</td>
                                      <td>{c.times_used || 0}</td>
                                      <td className="promo-currency">{c.max_discount ? formatCurrency(c.max_discount) : '-'}</td>
                                      <td><span className={`promo-status-badge ${c.status || 'active'}`}>{c.status || 'active'}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
          <div className="promo-table-footer">
            Showing {filteredPromotions.length} of {promotions.length} promotions
          </div>
        </div>
      )}

      {showPromoModal && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="modal-content promo-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPromo ? 'Edit Promotion' : 'Add Promotion'}</h3>
              <button className="panel-close-btn" onClick={() => setShowPromoModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="promo-form-grid">
                  <div className="form-group">
                    <label>Promotion Name</label>
                    <input className="promo-input" value={promoForm.name} onChange={(e) => setPromoForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="promo-input" value={promoForm.type} onChange={(e) => setPromoForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="bogo">BOGO</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{promoForm.type === 'percentage' ? 'Percentage (%)' : 'Value (₹)'}</label>
                    <input type="number" step="0.01" className="promo-input" value={promoForm.value} onChange={(e) => setPromoForm(p => ({ ...p, value: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Min Order Amount (₹)</label>
                    <input type="number" step="0.01" className="promo-input" value={promoForm.min_order_amount} onChange={(e) => setPromoForm(p => ({ ...p, min_order_amount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Valid From</label>
                    <input type="date" className="promo-input" value={promoForm.valid_from} onChange={(e) => setPromoForm(p => ({ ...p, valid_from: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Valid Until</label>
                    <input type="date" className="promo-input" value={promoForm.valid_until} onChange={(e) => setPromoForm(p => ({ ...p, valid_until: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="promo-input" value={promoForm.status} onChange={(e) => setPromoForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="promo-action-btn primary">{editingPromo ? 'Update' : 'Create'} Promotion</button>
                <button type="button" className="promo-action-btn ghost" onClick={() => setShowPromoModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="modal-overlay" onClick={() => setShowCodeModal(false)}>
          <div className="modal-content promo-code-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Promo Code</h3>
              <button className="panel-close-btn" onClick={() => setShowCodeModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="promo-code-form">
                <div className="form-group">
                  <label>Code</label>
                  <input className="promo-input" value={codeForm.code} onChange={(e) => setCodeForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME10" required />
                </div>
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input type="number" className="promo-input" value={codeForm.usage_limit} onChange={(e) => setCodeForm(p => ({ ...p, usage_limit: e.target.value }))} placeholder="Leave empty for unlimited" />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input type="number" step="0.01" className="promo-input" value={codeForm.max_discount} onChange={(e) => setCodeForm(p => ({ ...p, max_discount: e.target.value }))} placeholder="Maximum discount amount" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="promo-action-btn primary" onClick={handleAddCode}>Add Code</button>
              <button className="promo-action-btn ghost" onClick={() => setShowCodeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
