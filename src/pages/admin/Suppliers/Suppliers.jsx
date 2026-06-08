import React, { useState, useEffect, useMemo } from 'react';
import './Suppliers.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { supplierService } from '../../../services/suppliers';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';

const STATUSES = ['active', 'suspended', 'inactive'];

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '', contact_person: '', email: '', phone: '',
    gstin: '', credit_limit: 0, credit_days: 0, discount_pct: 0, status: 'active',
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

  useEffect(() => { loadSuppliers(); }, []);

  const filteredSuppliers = useMemo(() => {
    return (Array.isArray(suppliers) ? suppliers : []).filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (item.company_name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ company_name: '', contact_person: '', email: '', phone: '', gstin: '', credit_limit: 0, credit_days: 0, discount_pct: 0, status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      company_name: item.company_name, contact_person: item.contact_person || '',
      email: item.email || '', phone: item.phone || '', gstin: item.gstin || '',
      credit_limit: item.credit_limit ?? 0, credit_days: item.credit_days ?? 0,
      discount_pct: item.discount_pct ?? 0, status: item.status || 'active',
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
        credit_limit: parseFloat(formData.credit_limit) || 0,
        credit_days: parseInt(formData.credit_days) || 0,
        discount_pct: parseFloat(formData.discount_pct) || 0,
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
    if (!window.confirm(`Delete supplier "${item.company_name}"? This cannot be undone.`)) return;
    try {
      await supplierService.delete(item.id);
      toast.success('Supplier deleted');
      loadSuppliers();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const columns = [
    { header: 'Company Name', accessor: 'company_name' },
    { header: 'Contact Person', accessor: (row) => row.contact_person || '-' },
    { header: 'Email', accessor: (row) => row.email || '-' },
    { header: 'Phone', accessor: (row) => row.phone || '-' },
    { header: 'GSTIN', accessor: (row) => row.gstin || '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`status-badge ${row.status || 'active'}`}>
          {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Active'}
        </span>
      ),
    },
  ];

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Suppliers</h2>
          <p className="page-subtitle">Manage your coffee suppliers and vendor information</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadSuppliers} variant="ghost"><RefreshCw size={16} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Add Supplier</Button>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-wrapper">
          <input type="text" placeholder="Search by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredSuppliers} searchKey="company_name"
          searchPlaceholder="Search suppliers..." exportFileName="suppliers-export"
          onRowView={(item) => openEditModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Supplier' : 'Add Supplier'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Company Name *</label>
                  <input name="company_name" value={formData.company_name} onChange={handleFormChange} required /></div>
                <div className="form-group"><label>Contact Person</label>
                  <input name="contact_person" value={formData.contact_person} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleFormChange} /></div>
                <div className="form-group"><label>GSTIN</label>
                  <input name="gstin" value={formData.gstin} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Credit Limit (₹)</label>
                  <input name="credit_limit" type="number" step="0.01" value={formData.credit_limit} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Credit Days</label>
                  <input name="credit_days" type="number" value={formData.credit_days} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Discount %</label>
                  <input name="discount_pct" type="number" step="0.01" value={formData.discount_pct} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleFormChange}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
