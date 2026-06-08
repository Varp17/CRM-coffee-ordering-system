import React, { useState, useEffect, useMemo } from 'react';
import './StoreTransfers.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { inventoryOpsService } from '../../../services/inventoryOps';
import { storeService } from '../../../services/stores';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Send, CheckCircle, XCircle } from 'lucide-react';

const TRANSFER_STATUSES = ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'];

const StoreTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    from_store: '', to_store: '', items: [],
  });

  const loadTransfers = async () => {
    setIsLoading(true);
    try {
      const response = await inventoryOpsService.getStoreTransfers();
      setTransfers(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load store transfers: ' + err.message);
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

  useEffect(() => { loadTransfers(); loadStores(); }, []);

  const filteredTransfers = useMemo(() => {
    return (Array.isArray(transfers) ? transfers : []).filter((item) => {
      return statusFilter === 'all' || item.status === statusFilter;
    });
  }, [transfers, statusFilter]);

  const openAddModal = () => {
    setFormData({ from_store: '', to_store: '', items: [] });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { item_type: 'raw_material', item_id: '', quantity: '' }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        from_store: formData.from_store,
        to_store: formData.to_store,
        items: formData.items.map((it) => ({
          item_type: it.item_type,
          item_id: it.item_id,
          quantity: parseFloat(it.quantity) || 0,
        })),
      };
      await inventoryOpsService.createStoreTransfer(payload);
      toast.success('Store transfer created');
      setShowModal(false);
      loadTransfers();
    } catch (err) {
      toast.error('Failed to create: ' + err.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await inventoryOpsService.updateTransferStatus(id, { status });
      toast.success(`Transfer ${status}`);
      loadTransfers();
    } catch (err) {
      toast.error(`Failed to update: ${err.message}`);
    }
  };

  const getStatusActions = (item) => {
    const s = item.status;
    if (s === 'draft' || s === 'pending') {
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'approved'); }}>
            <CheckCircle size={14} /> Approve
          </Button>
          <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'cancelled'); }}>
            <XCircle size={14} /> Cancel
          </Button>
        </div>
      );
    }
    if (s === 'approved' || s === 'in_transit') {
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, s === 'approved' ? 'in_transit' : 'completed'); }}>
            <Send size={14} /> {s === 'approved' ? 'Send' : 'Complete'}
          </Button>
          <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'cancelled'); }}>
            <XCircle size={14} /> Cancel
          </Button>
        </div>
      );
    }
    return '-';
  };

  const columns = [
    { header: 'Transfer ID', accessor: (row) => row.transfer_id || row.id || '-' },
    { header: 'From Store', accessor: (row) => row.from_store_name || row.from_store?.name || '-' },
    { header: 'To Store', accessor: (row) => row.to_store_name || row.to_store?.name || '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`status-badge ${row.status || 'draft'}`}>
          {(row.status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ),
    },
    { header: 'Items', accessor: (row) => (row.items || []).length },
    { header: 'Date', accessor: (row) => row.date ? new Date(row.date).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-') },
    { header: 'Actions', accessor: (row) => getStatusActions(row) },
  ];

  return (
    <div className="store-transfers-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Store Transfers</h2>
          <p className="page-subtitle">Transfer inventory between stores</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadTransfers} variant="ghost"><RefreshCw size={16} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> New Transfer</Button>
        </div>
      </div>

      <div className="filters-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          {TRANSFER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredTransfers}
          exportFileName="store-transfers-export"
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>New Store Transfer</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>From Store *</label>
                  <select name="from_store" value={formData.from_store} onChange={handleFormChange} required>
                    <option value="">Select store</option>
                    {(Array.isArray(stores) ? stores : []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>To Store *</label>
                  <select name="to_store" value={formData.to_store} onChange={handleFormChange} required>
                    <option value="">Select store</option>
                    {(Array.isArray(stores) ? stores : []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select></div>
              </div>

              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--color-secondary)' }}>Items</h4>
              {formData.items.map((item, idx) => (
                <div key={idx} className="add-item-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Type</label>
                    <select value={item.item_type} onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}>
                      <option value="raw_material">Raw Material</option>
                      <option value="ingredient">Ingredient</option>
                      <option value="product">Product</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Item ID</label>
                    <input value={item.item_id} onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)} placeholder="UUID" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Qty</label>
                    <input type="number" step="0.001" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeItemRow(idx)} style={{ marginTop: 24 }}>X</Button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={addItemRow}><Plus size={14} /> Add Item</Button>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreTransfers;
