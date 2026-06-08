import React, { useState, useEffect, useMemo } from 'react';
import './RawMaterials.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { rawMaterialService } from '../../../services/rawMaterials';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Package, TrendingUp, Archive, AlertTriangle, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'beans', label: 'Coffee Beans' },
  { value: 'milk', label: 'Milk & Dairy' },
  { value: 'syrup', label: 'Syrups & Sweeteners' },
  { value: 'flavor', label: 'Flavorings' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' },
];

const UNITS = ['kg', 'g', 'l', 'ml', 'pcs'];

const getStockLevel = (stock, low, critical) => {
  if (stock <= 0) return 'out';
  if (critical && stock <= critical) return 'critical';
  if (low && stock <= low) return 'low';
  return 'ok';
};

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [showPurchases, setShowPurchases] = useState(false);
  const [reorderRules, setReorderRules] = useState([]);
  const [showReorderModal, setShowReorderModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', category: 'other', unit: 'kg',
    supplier_name: '', supplier_contact: '',
    cost_per_unit: 0, opening_balance: 0,
    low_stock_threshold: 10, critical_stock_threshold: 5,
    is_active: true,
  });

  const [purchaseForm, setPurchaseForm] = useState({
    quantity: '', unit_price: '', purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: '', notes: '',
  });

  const [stockForm, setStockForm] = useState({
    new_stock: '', notes: '',
  });

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await rawMaterialService.getAll();
      setMaterials(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load raw materials: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadMaterials(); }, []);

  const filteredMaterials = useMemo(() => {
    return (Array.isArray(materials) ? materials : []).filter((item) => {
      const matchesSearch =
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const level = getStockLevel(item.current_stock, item.low_stock_threshold, item.critical_stock_threshold);
      const matchesStock = stockFilter === 'all' || level === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [materials, searchQuery, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const arr = Array.isArray(materials) ? materials : [];
    return {
      total: arr.length,
      low: arr.filter(m => getStockLevel(m.current_stock, m.low_stock_threshold, m.critical_stock_threshold) === 'low').length,
      critical: arr.filter(m => getStockLevel(m.current_stock, m.low_stock_threshold, m.critical_stock_threshold) === 'critical').length,
      out: arr.filter(m => getStockLevel(m.current_stock, m.low_stock_threshold, m.critical_stock_threshold) === 'out').length,
    };
  }, [materials]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'other', unit: 'kg', supplier_name: '', supplier_contact: '', cost_per_unit: 0, opening_balance: 0, low_stock_threshold: 10, critical_stock_threshold: 5, is_active: true });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category, unit: item.unit,
      supplier_name: item.supplier_name || '', supplier_contact: item.supplier_contact || '',
      cost_per_unit: item.cost_per_unit, opening_balance: item.opening_balance || 0,
      low_stock_threshold: item.low_stock_threshold ?? 10,
      critical_stock_threshold: item.critical_stock_threshold ?? 5,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        low_stock_threshold: parseFloat(formData.low_stock_threshold) || 0,
        critical_stock_threshold: parseFloat(formData.critical_stock_threshold) || 0,
      };
      if (editingItem) {
        await rawMaterialService.update(editingItem.id, payload);
        toast.success('Raw material updated');
      } else {
        await rawMaterialService.create(payload);
        toast.success('Raw material created');
      }
      setShowModal(false);
      loadMaterials();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await rawMaterialService.delete(item.id);
      toast.success('Raw material deleted');
      loadMaterials();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const openPurchaseModal = (item) => {
    setSelectedItem(item);
    setPurchaseForm({ quantity: '', unit_price: item.cost_per_unit || '', purchase_date: new Date().toISOString().split('T')[0], invoice_number: '', notes: '' });
    setShowPurchaseModal(true);
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await rawMaterialService.addPurchase(selectedItem.id, {
        quantity: parseFloat(purchaseForm.quantity), unit_price: parseFloat(purchaseForm.unit_price),
        purchase_date: purchaseForm.purchase_date, invoice_number: purchaseForm.invoice_number || null, notes: purchaseForm.notes || null,
      });
      toast.success('Purchase recorded');
      setShowPurchaseModal(false);
      loadMaterials();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const openStockModal = (item) => {
    setSelectedItem(item);
    setStockForm({ new_stock: item.current_stock || 0, notes: '' });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await rawMaterialService.adjustStock(selectedItem.id, {
        new_stock: parseFloat(stockForm.new_stock), notes: stockForm.notes || null,
      });
      toast.success('Stock adjusted');
      setShowStockModal(false);
      loadMaterials();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const viewPurchases = async (item) => {
    setSelectedItem(item);
    try {
      const resp = await rawMaterialService.getPurchases(item.id);
      setPurchases(unwrapList(resp));
    } catch { setPurchases([]); }
    setShowPurchases(true);
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: (row) => CATEGORIES.find((c) => c.value === row.category)?.label || row.category },
    { header: 'Unit', accessor: 'unit' },
    { header: 'Supplier', accessor: (row) => row.supplier_name || '-' },
    { header: 'Cost/Unit', accessor: (row) => formatCurrency(row.cost_per_unit) },
    {
      header: 'Stock',
      accessor: (row) => {
        const stock = row.current_stock || 0;
        const pct = row.low_stock_threshold > 0 ? Math.min(100, (stock / row.low_stock_threshold) * 100) : 100;
        const level = getStockLevel(stock, row.low_stock_threshold, row.critical_stock_threshold);
        return (
          <div className="stock-cell">
            <div className="stock-bar-container">
              <div className={`stock-bar ${level}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <span className={`stock-badge ${level}`}>{stock} {row.unit}</span>
          </div>
        );
      },
    },
    {
      header: 'Thresholds',
      accessor: (row) => `${row.low_stock_threshold ?? '-'} / ${row.critical_stock_threshold ?? '-'}`,
    },
    {
      header: 'Status',
      accessor: (row) => {
        const level = getStockLevel(row.current_stock, row.low_stock_threshold, row.critical_stock_threshold);
        return (
          <span className={`status-indicator ${level}`}>
            {level === 'out' ? 'Out' : level === 'critical' ? 'Critical' : level === 'low' ? 'Low' : 'Healthy'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="raw-materials-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Raw Materials</h2>
          <p className="page-subtitle">Manage your coffee ingredients, supplies, and stock levels</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadMaterials} variant="ghost"><RefreshCw size={16} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Add Raw Material</Button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Materials</span></div>
        <div className="stat-card warning"><span className="stat-value">{stats.low}</span><span className="stat-label">Low Stock</span></div>
        <div className="stat-card danger"><span className="stat-value">{stats.critical}</span><span className="stat-label">Critical</span></div>
        <div className="stat-card danger"><span className="stat-value">{stats.out}</span><span className="stat-label">Out of Stock</span></div>
      </div>

      <div className="filters-row">
        <div className="search-wrapper">
          <input type="text" placeholder="Search by name or supplier..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          {CATEGORIES.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="filter-select">
          <option value="all">All Stock Levels</option>
          <option value="ok">Healthy</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredMaterials} searchKey="name"
          searchPlaceholder="Search raw materials..." exportFileName="raw-materials-export"
          onRowView={(item) => openEditModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button className="action-card" onClick={() => { setCategoryFilter('all'); setStockFilter('all'); }}>
            <Package size={20} /><span>All Materials</span><small>{materials.length} items</small>
          </button>
          <button className="action-card" onClick={() => setStockFilter('low')}>
            <AlertTriangle size={20} /><span>Low Stock</span><small>{stats.low + stats.critical} items</small>
          </button>
          <button className="action-card" onClick={() => setStockFilter('critical')}>
            <Archive size={20} /><span>Critical</span><small>{stats.critical} items</small>
          </button>
          <button className="action-card" onClick={() => { openAddModal(); }}>
            <TrendingUp size={20} /><span>Add New</span><small>Record purchase</small>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Raw Material' : 'Add Raw Material'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Name *</label>
                  <input name="name" value={formData.name} onChange={handleFormChange} required /></div>
                <div className="form-group"><label>Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange}>
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleFormChange}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select></div>
                <div className="form-group"><label>Cost per Unit (₹)</label>
                  <input name="cost_per_unit" type="number" step="0.01" value={formData.cost_per_unit} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Supplier Name</label>
                  <input name="supplier_name" value={formData.supplier_name} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Supplier Contact</label>
                  <input name="supplier_contact" value={formData.supplier_contact} onChange={handleFormChange} /></div>
                {!editingItem && (
                  <div className="form-group"><label>Opening Balance</label>
                    <input name="opening_balance" type="number" step="0.001" value={formData.opening_balance} onChange={handleFormChange} /></div>
                )}
                <div className="form-group"><label>Low Stock Threshold</label>
                  <input name="low_stock_threshold" type="number" step="0.001" value={formData.low_stock_threshold} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Critical Threshold</label>
                  <input name="critical_stock_threshold" type="number" step="0.001" value={formData.critical_stock_threshold} onChange={handleFormChange} /></div>
                <div className="form-group checkbox-group">
                  <label><input name="is_active" type="checkbox" checked={formData.is_active} onChange={handleFormChange} /> Active</label>
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Record Purchase — {selectedItem.name}</h3>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Quantity ({selectedItem.unit}) *</label>
                  <input name="quantity" type="number" step="0.001" value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} required /></div>
                <div className="form-group"><label>Unit Price (₹) *</label>
                  <input name="unit_price" type="number" step="0.01" value={purchaseForm.unit_price}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unit_price: e.target.value })} required /></div>
                <div className="form-group"><label>Purchase Date</label>
                  <input name="purchase_date" type="date" value={purchaseForm.purchase_date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} /></div>
                <div className="form-group"><label>Invoice Number</label>
                  <input name="invoice_number" value={purchaseForm.invoice_number}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })} /></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea name="notes" value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} rows={2} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowPurchaseModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Record Purchase</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adjust Stock — {selectedItem.name}</h3>
            <p className="modal-hint">Current stock: {selectedItem.current_stock} {selectedItem.unit}</p>
            <form onSubmit={handleStockSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>New Stock Level ({selectedItem.unit}) *</label>
                  <input name="new_stock" type="number" step="0.001" value={stockForm.new_stock}
                    onChange={(e) => setStockForm({ ...stockForm, new_stock: e.target.value })} required /></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea name="notes" value={stockForm.notes}
                    onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} rows={2} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowStockModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Adjust Stock</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchases && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowPurchases(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Purchase History — {selectedItem.name}</h3>
              <Button variant="ghost" onClick={() => setShowPurchases(false)}>Close</Button>
            </div>
            {purchases.length === 0 ? (
              <p className="empty-state">No purchases recorded yet.</p>
            ) : (
              <table className="purchases-table">
                <thead><tr><th>Date</th><th>Quantity</th><th>Unit Price</th><th>Total</th><th>Invoice</th><th>Notes</th><th>By</th></tr></thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id || i}>
                      <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td>{p.quantity}</td>
                      <td>{formatCurrency(p.unit_price)}</td>
                      <td>{formatCurrency(p.total_amount)}</td>
                      <td>{p.invoice_number || '-'}</td>
                      <td>{p.notes || '-'}</td>
                      <td>{p.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;
