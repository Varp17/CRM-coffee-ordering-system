import React, { useState, useEffect, useMemo } from 'react';
import './Packaging.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { inventoryOpsService } from '../../../services/inventoryOps';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Package } from 'lucide-react';

const PACKAGING_CATEGORIES = ['bottle', 'cap', 'label', 'crate', 'box', 'other'];

const Packaging = () => {
  const [activeTab, setActiveTab] = useState('types');
  const [packagingTypes, setPackagingTypes] = useState([]);
  const [packagingInventory, setPackagingInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [formData, setFormData] = useState({
    name: '', category: 'other', capacity: '', unit: 'pcs',
    cost: 0, is_returnable: false,
  });

  const [stockForm, setStockForm] = useState({
    packaging_type_id: '', quantity: '', notes: '',
  });

  const loadTypes = async () => {
    try {
      const resp = await inventoryOpsService.getPackagingTypes();
      setPackagingTypes(unwrapList(resp));
    } catch { setPackagingTypes([]); }
  };

  const loadInventory = async () => {
    try {
      const resp = await inventoryOpsService.getPackagingInventory();
      setPackagingInventory(unwrapList(resp));
    } catch { setPackagingInventory([]); }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadTypes(), loadInventory()]);
    setIsLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'other', capacity: '', unit: 'pcs', cost: 0, is_returnable: false });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category || 'other',
      capacity: item.capacity || '', unit: item.unit || 'pcs',
      cost: item.cost ?? 0, is_returnable: item.is_returnable ?? false,
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
        capacity: parseFloat(formData.capacity) || 0,
        cost: parseFloat(formData.cost) || 0,
      };
      if (editingItem) {
        await inventoryOpsService.updatePackagingType(editingItem.id, payload);
        toast.success('Packaging type updated');
      } else {
        await inventoryOpsService.createPackagingType(payload);
        toast.success('Packaging type created');
      }
      setShowModal(false);
      loadTypes();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const openStockModal = (item) => {
    setSelectedItem(item);
    setStockForm({ packaging_type_id: item.id || item.packaging_type_id, quantity: '', notes: '' });
    setShowStockModal(true);
  };

  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryOpsService.adjustPackagingStock({
        packaging_type_id: stockForm.packaging_type_id,
        quantity: parseFloat(stockForm.quantity) || 0,
        notes: stockForm.notes || null,
      });
      toast.success('Stock adjusted');
      setShowStockModal(false);
      loadInventory();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const typeColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: (row) => row.category ? row.category.charAt(0).toUpperCase() + row.category.slice(1) : '-' },
    { header: 'Capacity', accessor: (row) => row.capacity ? `${row.capacity}` : '-' },
    { header: 'Unit', accessor: (row) => row.unit || '-' },
    { header: 'Cost', accessor: (row) => formatCurrency(row.cost) },
    {
      header: 'Returnable',
      accessor: (row) => row.is_returnable ? 'Yes' : 'No',
    },
  ];

  const inventoryColumns = [
    {
      header: 'Packaging Type',
      accessor: (row) => row.packaging_type_name || row.name || row.packaging_type?.name || '-',
    },
    { header: 'Current Stock', accessor: (row) => row.current_stock ?? row.stock ?? 0 },
    { header: 'Threshold', accessor: (row) => row.threshold ?? row.low_stock_threshold ?? '-' },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); openStockModal(row); }}>
          <Package size={14} /> Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="packaging-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Packaging</h2>
          <p className="page-subtitle">Manage packaging types and inventory levels</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadAll} variant="ghost"><RefreshCw size={16} /></Button>
          {activeTab === 'types' && (
            <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Add Packaging Type</Button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'types' ? 'active' : ''}`} onClick={() => setActiveTab('types')}>
          Types
        </button>
        <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          Inventory
        </button>
      </div>

      {activeTab === 'types' && (
        <div className="data-table-container">
          <DataTable columns={typeColumns} data={packagingTypes} searchKey="name"
            searchPlaceholder="Search packaging types..." exportFileName="packaging-types-export"
            onRowView={(item) => openEditModal(item)}
          />
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="data-table-container">
          <DataTable columns={inventoryColumns} data={packagingInventory}
            exportFileName="packaging-inventory-export"
          />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Packaging Type' : 'Add Packaging Type'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Name *</label>
                  <input name="name" value={formData.name} onChange={handleFormChange} required /></div>
                <div className="form-group"><label>Category</label>
                  <select name="category" value={formData.category} onChange={handleFormChange}>
                    {PACKAGING_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>Capacity</label>
                  <input name="capacity" type="number" step="0.01" value={formData.capacity} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Unit</label>
                  <input name="unit" value={formData.unit} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Cost (₹)</label>
                  <input name="cost" type="number" step="0.01" value={formData.cost} onChange={handleFormChange} /></div>
                <div className="form-group checkbox-group">
                  <label><input name="is_returnable" type="checkbox" checked={formData.is_returnable} onChange={handleFormChange} /> Returnable</label>
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

      {showStockModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adjust Stock — {selectedItem.packaging_type_name || selectedItem.name || 'Packaging'}</h3>
            <p className="modal-hint">Current stock: {selectedItem.current_stock ?? selectedItem.stock ?? 0}</p>
            <form onSubmit={handleStockSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Adjustment Quantity *</label>
                  <input name="quantity" type="number" step="1" value={stockForm.quantity}
                    onChange={handleStockChange} placeholder="Use positive to add, negative to remove" required /></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea name="notes" value={stockForm.notes} onChange={handleStockChange} rows={2} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowStockModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Adjust Stock</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packaging;
