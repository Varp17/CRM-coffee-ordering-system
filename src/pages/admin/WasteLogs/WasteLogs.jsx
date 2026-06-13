import React, { useState, useEffect, useMemo } from 'react';
import './WasteLogs.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { wasteService } from '../../../services/waste';
import { storeService } from '../../../services/stores';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Pencil } from 'lucide-react';

const ITEM_TYPES = [
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'product', label: 'Product' },
];

const REASONS = [
  { value: 'spillage', label: 'Spillage' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'quality_rejection', label: 'Quality Rejection' },
  { value: 'production_loss', label: 'Production Loss' },
  { value: 'other', label: 'Other' },
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs'];

const EMPTY_FORM = {
  store_id: '', item_type: 'raw_material', item_id: '',
  quantity: '', unit: 'kg', reason: 'spillage', notes: '',
};

const WasteLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [summary, setSummary] = useState([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await wasteService.getAll();
      setLogs(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load waste logs: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const resp = await storeService.getAll();
      setStores(unwrapList(resp));
    } catch { setStores([]); }
  };

  const loadSummary = async () => {
    try {
      const resp = await wasteService.getSummary();
      const data = unwrapList(resp);
      setSummary(Array.isArray(data) ? data : []);
    } catch { setSummary([]); }
  };

  useEffect(() => { loadLogs(); loadStores(); loadSummary(); }, []);

  const filteredLogs = useMemo(() => {
    return (Array.isArray(logs) ? logs : []).filter((item) => {
      const matchesStore = storeFilter === 'all' || item.store_id === storeFilter || item.store?.id === storeFilter;
      const matchesType = itemTypeFilter === 'all' || item.item_type === itemTypeFilter;
      const matchesReason = reasonFilter === 'all' || item.reason === reasonFilter;
      return matchesStore && matchesType && matchesReason;
    });
  }, [logs, storeFilter, itemTypeFilter, reasonFilter]);

  const summaryByReason = useMemo(() => {
    const map = {};
    (Array.isArray(logs) ? logs : []).forEach((log) => {
      const reason = log.reason || 'other';
      map[reason] = (map[reason] || 0) + (parseFloat(log.quantity) || 0);
    });
    return Object.entries(map).map(([reason, total]) => ({
      reason,
      label: REASONS.find((r) => r.value === reason)?.label || reason,
      total,
    }));
  }, [logs]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      store_id: item.store_id || item.store?.id || '',
      item_type: item.item_type || 'raw_material',
      item_id: item.item_id || '',
      quantity: item.quantity || '',
      unit: item.unit || 'kg',
      reason: item.reason || 'spillage',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, quantity: parseFloat(formData.quantity) || 0 };
      if (editingItem) {
        await wasteService.update(editingItem.id, payload);
        toast.success('Waste log updated');
      } else {
        await wasteService.create(payload);
        toast.success('Waste log created');
      }
      setShowModal(false);
      loadLogs();
      loadSummary();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete waste log #${item.id || ''}? This cannot be undone.`)) return;
    try {
      await wasteService.delete(item.id);
      toast.success('Waste log deleted');
      loadLogs();
      loadSummary();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const columns = [
    { header: 'Date', accessor: (row) => row.date ? new Date(row.date).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-') },
    { header: 'Store', accessor: (row) => row.store?.name || row.store_name || '-' },
    {
      header: 'Item Type',
      accessor: (row) => ITEM_TYPES.find((t) => t.value === row.item_type)?.label || row.item_type || '-',
    },
    { header: 'Item Name', accessor: (row) => row.item_name || row.name || '-' },
    { header: 'Quantity', accessor: (row) => row.quantity ? `${row.quantity} ${row.unit || ''}` : '-' },
    {
      header: 'Reason',
      accessor: (row) => REASONS.find((r) => r.value === row.reason)?.label || row.reason || '-',
    },
    { header: 'Notes', accessor: (row) => row.notes || '-' },
    { header: 'Created By', accessor: (row) => row.created_by || '-' },
  ];

  return (
    <div className="waste-logs-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Waste Logs</h2>
          <p className="page-subtitle">Track and manage inventory waste across stores</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={() => { loadLogs(); loadSummary(); }} variant="ghost" disabled={isLoading}><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Log Waste</Button>
        </div>
      </div>

      <div className="stats-row">
        {summaryByReason.map((s) => (
          <div key={s.reason} className="stat-card">
            <span className="stat-value">{s.total.toFixed(1)}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="filters-row">
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="filter-select">
          <option value="all">All Stores</option>
          {(Array.isArray(stores) ? stores : []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={itemTypeFilter} onChange={(e) => setItemTypeFilter(e.target.value)} className="filter-select">
          <option value="all">All Item Types</option>
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="filter-select">
          <option value="all">All Reasons</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredLogs}
          exportFileName="waste-logs-export"
          onRowView={(item) => openEditModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Waste Log' : 'Log Waste'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Store *</label>
                  <select name="store_id" value={formData.store_id} onChange={handleFormChange} required>
                    <option value="">Select store</option>
                    {(Array.isArray(stores) ? stores : []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>Item Type</label>
                  <select name="item_type" value={formData.item_type} onChange={handleFormChange}>
                    {ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>Item ID</label>
                  <input name="item_id" value={formData.item_id} onChange={handleFormChange} placeholder="UUID or name" /></div>
                <div className="form-group"><label>Quantity *</label>
                  <input name="quantity" type="number" step="0.001" value={formData.quantity} onChange={handleFormChange} required /></div>
                <div className="form-group"><label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleFormChange}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select></div>
                <div className="form-group"><label>Reason</label>
                  <select name="reason" value={formData.reason} onChange={handleFormChange}>
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  <Pencil size={14} /> {editingItem ? 'Update' : 'Log Waste'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteLogs;
