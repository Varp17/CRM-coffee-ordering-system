import React, { useState, useEffect, useMemo } from 'react';
import './Suppliers.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { supplierService } from '../../../services/suppliers';
import { rawMaterialService } from '../../../services/rawMaterials';
import { unwrapList, unwrapData } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import SlideOver from '../../../components/ui/SlideOver';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [allRawMaterials, setAllRawMaterials] = useState([]);

  const [formData, setFormData] = useState({
    name: '', contact_person: '', email: '', phone: '',
    gstin: '', city: '', state: '', address: '', pincode: '',
    alternate_phone: '', payment_terms: '',
    category: '', description: '',
    lead_time_days: 0, min_order_value: 0, rating: 0, notes: '',
    is_active: true, raw_material_ids: [],
  });

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await supplierService.getAll();
      setSuppliers(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load suppliers: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRawMaterials = async () => {
    try {
      const res = await rawMaterialService.getAll({ limit: 200 });
      const items = unwrapList(res, []);
      setAllRawMaterials(Array.isArray(items) ? items : []);
    } catch { }
  };

  useEffect(() => { loadSuppliers(); loadRawMaterials(); }, []);

  const filteredSuppliers = useMemo(() => {
    return (Array.isArray(suppliers) ? suppliers : []).filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.contact_person || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? item.is_active : !item.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '', contact_person: '', email: '', phone: '',
      gstin: '', city: '', state: '', address: '', pincode: '',
      alternate_phone: '', payment_terms: '',
      category: '', description: '',
      lead_time_days: 0, min_order_value: 0, rating: 0, notes: '',
      is_active: true, raw_material_ids: [],
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    loadRawMaterials();
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      contact_person: item.contact_person || '',
      email: item.email || '',
      phone: item.phone || '',
      gstin: item.gstin || '',
      city: item.city || '',
      state: item.state || '',
      address: item.address || '',
      pincode: item.pincode || '',
      alternate_phone: item.alternate_phone || '',
      payment_terms: item.payment_terms || '',
      category: item.category || '',
      description: item.description || '',
      lead_time_days: item.lead_time_days ?? 0,
      min_order_value: item.min_order_value ?? 0,
      rating: item.rating ?? 0,
      notes: item.notes || '',
      is_active: item.is_active !== false,
      raw_material_ids: (item.raw_materials || []).map((rm) => rm.id),
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRmToggle = (rmId) => {
    setFormData((prev) => ({
      ...prev,
      raw_material_ids: prev.raw_material_ids.includes(rmId)
        ? prev.raw_material_ids.filter((id) => id !== rmId)
        : [...prev.raw_material_ids, rmId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        lead_time_days: parseInt(formData.lead_time_days) || 0,
        min_order_value: parseFloat(formData.min_order_value) || 0,
        rating: parseFloat(formData.rating) || 0,
      };
      if (editingItem) {
        await supplierService.update(editingItem.id, payload);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(payload);
        toast.success('Supplier created');
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete supplier "${item.name}"? This cannot be undone.`)) return;
    try {
      await supplierService.delete(item.id);
      toast.success('Supplier deleted');
      loadSuppliers();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact Person', accessor: (row) => row.contact_person || '-' },
    { header: 'Email', accessor: (row) => row.email || '-' },
    { header: 'Phone', accessor: (row) => row.phone || '-' },
    { header: 'City', accessor: (row) => row.city || '-' },
    { header: 'Category', accessor: (row) => row.category || '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`status-badge ${row.is_active ? 'active' : 'inactive'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const selectedRmNames = allRawMaterials
    .filter((rm) => formData.raw_material_ids.includes(rm.id))
    .map((rm) => rm.name);

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Suppliers</h2>
          <p className="page-subtitle">Manage your coffee suppliers and vendor information</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadSuppliers} variant="ghost" disabled={isLoading}><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Add Supplier</Button>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-wrapper">
          <input type="text" placeholder="Search by name, email or contact..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredSuppliers} searchKey="name"
          searchPlaceholder="Search suppliers..."
          exportFileName="suppliers-export"
          onRowClick={(item) => openEditModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      <SlideOver
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Supplier Details & Edit' : 'Add Supplier'}
        width="700px"
      >
        <div style={{ paddingBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          {editingItem ? `Manage information for ${editingItem.name}.` : 'Create a new supplier profile.'}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Name *</label>
              <input name="name" value={formData.name} onChange={handleFormChange} required /></div>
            <div className="form-group"><label>Contact Person</label>
              <input name="contact_person" value={formData.contact_person} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Alternate Phone</label>
              <input name="alternate_phone" value={formData.alternate_phone} onChange={handleFormChange} /></div>
            <div className="form-group"><label>GSTIN</label>
              <input name="gstin" value={formData.gstin} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Category</label>
              <input name="category" value={formData.category} onChange={handleFormChange} placeholder="e.g., Coffee, Syrups, Packaging" /></div>
            <div className="form-group"><label>City</label>
              <input name="city" value={formData.city} onChange={handleFormChange} /></div>
            <div className="form-group"><label>State</label>
              <input name="state" value={formData.state} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Pincode</label>
              <input name="pincode" value={formData.pincode} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Payment Terms</label>
              <input name="payment_terms" value={formData.payment_terms} onChange={handleFormChange} placeholder="e.g., Net 30" /></div>
            <div className="form-group"><label>Lead Time (days)</label>
              <input name="lead_time_days" type="number" min="0" value={formData.lead_time_days} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Min Order Value (₹)</label>
              <input name="min_order_value" type="number" step="0.01" min="0" value={formData.min_order_value} onChange={handleFormChange} /></div>
            <div className="form-group"><label>Rating (1-5)</label>
              <input name="rating" type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={handleFormChange} /></div>
            <div className="form-group">
              <label>Active</label>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleFormChange} />
                {formData.is_active ? 'Active' : 'Inactive'}
              </label>
            </div>
            <div className="form-group full-width"><label>Address</label>
              <textarea name="address" value={formData.address} onChange={handleFormChange} rows={2} /></div>
            <div className="form-group full-width"><label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleFormChange} rows={2} placeholder="Supplier description..." /></div>
            <div className="form-group full-width"><label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} /></div>

            <div className="form-group full-width">
              <label>Raw Materials (Multi-select)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', maxHeight: '160px', overflowY: 'auto', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                {allRawMaterials.length === 0 && <span style={{ color: '#9ca3af', fontSize: '12px' }}>Loading raw materials...</span>}
                {allRawMaterials.map((rm) => (
                  <label key={rm.id || rm.uuid} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', padding: '3px 8px', borderRadius: '4px', background: formData.raw_material_ids.includes(rm.id) ? 'var(--color-primary-light, #e0e7ff)' : '#f3f4f6' }}>
                    <input
                      type="checkbox"
                      checked={formData.raw_material_ids.includes(rm.id)}
                      onChange={() => handleRmToggle(rm.id)}
                      style={{ margin: 0 }}
                    />
                    {rm.name}
                  </label>
                ))}
              </div>
              {selectedRmNames.length > 0 && (
                <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                  Selected: {selectedRmNames.join(', ')}
                </small>
              )}
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingItem ? 'Update Supplier' : 'Create Supplier'}</Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
};

export default Suppliers;
