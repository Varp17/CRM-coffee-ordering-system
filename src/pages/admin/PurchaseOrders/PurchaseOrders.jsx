import React, { useState, useEffect, useMemo } from 'react';
import './PurchaseOrders.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { poService } from '../../../services/purchaseOrders';
import { supplierService } from '../../../services/suppliers';
import { rawMaterialService } from '../../../services/rawMaterials';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Package } from 'lucide-react';

const PO_STATUSES = ['draft', 'pending', 'ordered', 'received', 'cancelled'];

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  const [formData, setFormData] = useState({
    supplier_id: '', order_date: new Date().toISOString().split('T')[0],
    expected_delivery: '', notes: '', items: [],
  });

  const [receiveData, setReceiveData] = useState({ items: [] });

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await poService.getAll();
      setOrders(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load purchase orders: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const resp = await supplierService.getAll();
      setSuppliers(unwrapList(resp));
    } catch { setSuppliers([]); }
  };

  const loadRawMaterials = async () => {
    try {
      const resp = await rawMaterialService.getAll();
      setRawMaterials(unwrapList(resp));
    } catch { setRawMaterials([]); }
  };

  useEffect(() => { loadOrders(); loadSuppliers(); loadRawMaterials(); }, []);

  const filteredOrders = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).filter((item) => {
      const q = searchQuery.toLowerCase();
      const poMatch = (item.po_number || '').toLowerCase().includes(q);
      const supMatch = (item.supplier_name || item.supplier?.company_name || '').toLowerCase().includes(q);
      const matchesSearch = !q || poMatch || supMatch;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      supplier_id: '', order_date: new Date().toISOString().split('T')[0],
      expected_delivery: '', notes: '', items: [],
    });
    setShowModal(true);
  };

  const getFilteredRawMaterials = useMemo(() => {
    if (!formData.supplier_id) return rawMaterials;
    const supplierId = parseInt(formData.supplier_id);
    return rawMaterials.filter(rm => {
      return parseInt(rm.supplier_id) === supplierId;
    });
  }, [formData.supplier_id, rawMaterials]);

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
      items: [...prev.items, { raw_material_id: '', quantity: '', unit_price: '' }],
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
        ...formData,
        items: formData.items.map((it) => ({
          raw_material_id: it.raw_material_id,
          quantity_ordered: parseFloat(it.quantity) || 0,
          unit_price: parseFloat(it.unit_price) || 0,
        })),
      };
      if (editingItem) {
        await poService.create(payload);
        toast.success('Purchase order updated');
      } else {
        await poService.create(payload);
        toast.success('Purchase order created');
      }
      setShowModal(false);
      loadOrders();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const openReceiveModal = (order) => {
    setSelectedOrder(order);
    const items = (order.items || []).map((it) => ({
      ...it,
      quantity_accepted: it.quantity_received || 0,
    }));
    setReceiveData({ items });
    setShowReceiveModal(true);
  };

  const handleReceiveQtyChange = (index, value) => {
    const updated = [...receiveData.items];
    updated[index] = { ...updated[index], quantity_accepted: parseFloat(value) || 0 };
    setReceiveData((prev) => ({ ...prev, items: updated }));
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await poService.receive(selectedOrder.id, {
        items: receiveData.items.map((it) => ({
          po_item_id: it.id,
          quantity_accepted: it.quantity_accepted,
          quantity_rejected: 0,
        })),
      });
      toast.success('Purchase order received — stock updated');
      setShowReceiveModal(false);
      loadOrders();
    } catch (err) {
      toast.error('Failed to receive: ' + err.message);
    }
  };

  const columns = [
    { header: 'PO Number', accessor: (row) => row.po_number || `PO-${String(row.id).slice(0, 8)}` },
    { header: 'Supplier', accessor: (row) => row.supplier_name || row.supplier?.company_name || '-' },
    { header: 'Order Date', accessor: (row) => row.order_date ? new Date(row.order_date).toLocaleDateString() : '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`status-badge ${row.status || 'draft'}`}>
          {(row.status || 'draft').charAt(0).toUpperCase() + (row.status || 'draft').slice(1)}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: (row) => formatCurrency(row.total_amount || row.total || 0),
    },
    {
      header: 'Items',
      accessor: (row) => (row.items || []).length,
    },
    {
      header: 'Actions',
      accessor: (row) => {
        if (row.status === 'ordered' || row.status === 'pending') {
          return (
            <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); openReceiveModal(row); }}>
              <Package size={14} /> Receive
            </Button>
          );
        }
        return '-';
      },
    },
  ];

  return (
    <div className="purchase-orders-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Purchase Orders</h2>
          <p className="page-subtitle">Create and manage purchase orders for suppliers</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadOrders} variant="ghost" disabled={isLoading}><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> New Purchase Order</Button>
        </div>
      </div>

      <div className="filters-row">
        <div className="search-wrapper">
          <input type="text" placeholder="Search by PO number or supplier..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          {PO_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={filteredOrders} searchKey="po_number"
          searchPlaceholder="Search purchase orders..." exportFileName="purchase-orders-export"
          onRowView={(item) => openReceiveModal(item)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Purchase Order' : 'New Purchase Order'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Supplier *</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleFormChange} required>
                    <option value="">Select supplier</option>
                    {(Array.isArray(suppliers) ? suppliers : []).map((s) => (
                      <option key={s.id} value={s.id}>{s.company_name}</option>
                    ))}
                  </select></div>
                <div className="form-group"><label>Order Date</label>
                  <input name="order_date" type="date" value={formData.order_date} onChange={handleFormChange} /></div>
                <div className="form-group"><label>Expected Delivery</label>
                  <input name="expected_delivery" type="date" value={formData.expected_delivery} onChange={handleFormChange} /></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} /></div>
              </div>

              <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--color-secondary)' }}>Items</h4>
              {formData.items.map((item, idx) => (
                <div key={idx} className="add-item-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Raw Material</label>
                    <select value={item.raw_material_id} onChange={(e) => handleItemChange(idx, 'raw_material_id', e.target.value)}>
                      <option value="">Select</option>
                      {(getFilteredRawMaterials.length > 0 ? getFilteredRawMaterials : rawMaterials).map((rm) => (
                        <option key={rm.id} value={rm.id}>{rm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Qty</label>
                    <input type="number" step="0.001" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Unit Price</label>
                    <input type="number" step="0.01" value={item.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeItemRow(idx)} style={{ marginTop: 24 }}>X</Button>
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={addItemRow}><Plus size={14} /> Add Item</Button>

              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiveModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Receive — {selectedOrder.po_number || `PO-${String(selectedOrder.id).slice(0, 8)}`}</h3>
              <Button variant="ghost" onClick={() => setShowReceiveModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleReceiveSubmit}>
              <table className="items-table">
                <thead>
                  <tr><th>Item</th><th>Ordered</th><th>Unit Price</th><th>Accepted Qty</th></tr>
                </thead>
                <tbody>
                  {receiveData.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.raw_material?.name || it.raw_material_name || it.name || `Item #${idx + 1}`}</td>
                      <td>{it.quantity_ordered}</td>
                      <td>{formatCurrency(it.unit_price)}</td>
                      <td>
                        <input type="number" step="0.001" min="0" max={it.quantity_ordered}
                          value={it.quantity_accepted || 0}
                          onChange={(e) => handleReceiveQtyChange(idx, e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowReceiveModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Receive Items</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
