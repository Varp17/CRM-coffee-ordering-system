import React, { useState, useEffect, useMemo } from 'react';
import './Shipping.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { shippingService } from '../../../services/shipping';
import { unwrapList } from '../../../utils/apiResponse';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Eye, Truck } from 'lucide-react';

const SHIPMENT_STATUSES = ['pending', 'label_generated', 'picked_up', 'in_transit', 'delivered', 'failed'];

const SHIPMENT_STATUS_COLORS = {
  pending: '#757575',
  label_generated: '#1565c0',
  picked_up: '#e65100',
  in_transit: '#7b1fa2',
  delivered: '#2e7d32',
  failed: '#c62828',
};

const Shipping = () => {
  const [currentTab, setCurrentTab] = useState('carriers');
  const [carriers, setCarriers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [carrierForm, setCarrierForm] = useState({
    name: '', code: '', api_key: '', secret: '', status: 'active',
  });

  const [shipmentForm, setShipmentForm] = useState({
    order_id: '', carrier_id: '', tracking_number: '', shipping_cost: '', status: 'pending',
  });

  const [trackingForm, setTrackingForm] = useState({
    event: '', location: '', notes: '',
  });

  const loadCarriers = async () => {
    try {
      const resp = await shippingService.getCarriers();
      setCarriers(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load carriers: ' + err.message);
    }
  };

  const loadShipments = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const resp = await shippingService.getShipments(params);
      setShipments(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load shipments: ' + err.message);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadCarriers(), loadShipments()]);
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    loadShipments();
  }, [statusFilter]);

  const openAddCarrier = () => {
    setEditingCarrier(null);
    setCarrierForm({ name: '', code: '', api_key: '', secret: '', status: 'active' });
    setShowCarrierModal(true);
  };

  const openEditCarrier = (item) => {
    setEditingCarrier(item);
    setCarrierForm({
      name: item.name, code: item.code, api_key: '', secret: '',
      status: item.status,
    });
    setShowCarrierModal(true);
  };

  const handleCarrierSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: carrierForm.name,
        code: carrierForm.code,
        status: carrierForm.status,
      };
      if (carrierForm.api_key) payload.api_key = carrierForm.api_key;
      if (carrierForm.secret) payload.secret = carrierForm.secret;

      if (editingCarrier) {
        await shippingService.updateCarrier(editingCarrier.id, payload);
        toast.success('Carrier updated');
      } else {
        await shippingService.createCarrier(payload);
        toast.success('Carrier created');
      }
      setShowCarrierModal(false);
      loadCarriers();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleShipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await shippingService.createShipment({
        ...shipmentForm,
        shipping_cost: shipmentForm.shipping_cost ? parseFloat(shipmentForm.shipping_cost) : undefined,
      });
      toast.success('Shipment created');
      setShowShipmentModal(false);
      setShipmentForm({ order_id: '', carrier_id: '', tracking_number: '', shipping_cost: '', status: 'pending' });
      loadShipments();
    } catch (err) {
      toast.error('Failed to create shipment: ' + err.message);
    }
  };

  const handleUpdateShipmentStatus = async (id, status) => {
    try {
      await shippingService.updateShipmentStatus(id, { status });
      toast.success(`Shipment status updated to ${status}`);
      loadShipments();
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  const openTrackingModal = (shipment) => {
    setSelectedShipment(shipment);
    setTrackingForm({ event: '', location: '', notes: '' });
    setShowTrackingModal(true);
  };

  const handleTrackingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShipment) return;
    try {
      await shippingService.addTrackingEvent(selectedShipment.id, trackingForm);
      toast.success('Tracking event added');
      setShowTrackingModal(false);
    } catch (err) {
      toast.error('Failed to add tracking event: ' + err.message);
    }
  };

  const carrierColumns = useMemo(() => [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Code', accessor: 'code', sortable: true },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      ),
    },
  ], []);

  const shipmentColumns = useMemo(() => [
    { header: 'Order #', accessor: 'order_id', sortable: true },
    { header: 'Carrier', accessor: 'carrier_name', sortable: true },
    { header: 'Tracking #', accessor: 'tracking_number' },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className="status-badge" style={{
          background: SHIPMENT_STATUS_COLORS[row.status] + '20',
          color: SHIPMENT_STATUS_COLORS[row.status],
        }}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Cost', accessor: 'shipping_cost', sortable: true,
      render: (row) => row.shipping_cost ? formatCurrency(row.shipping_cost) : '-',
    },
    {
      header: 'Actions', accessor: 'id',
      render: (row) => (
        <div className="action-btn-group">
          <select
            className="status-select"
            value={row.status}
            onChange={(e) => handleUpdateShipmentStatus(row.id, e.target.value)}
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="action-btn-sm outline" onClick={() => openTrackingModal(row)}>
            <Truck size={14} /> Track
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="shipping-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Shipping</h2>
          <p className="page-subtitle">Manage carriers and shipments</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={() => { loadCarriers(); loadShipments(); }} variant="ghost"><RefreshCw size={16} /></Button>
          {currentTab === 'carriers' && <Button onClick={openAddCarrier} variant="primary"><Plus size={16} /> Add Carrier</Button>}
          {currentTab === 'shipments' && <Button onClick={() => setShowShipmentModal(true)} variant="primary"><Plus size={16} /> Create Shipment</Button>}
        </div>
      </div>

      <div className="shipping-tabs">
        {[
          { key: 'carriers', label: 'Carriers' },
          { key: 'shipments', label: 'Shipments' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${currentTab === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab === 'carriers' && (
        <DataTable
          columns={carrierColumns}
          data={carriers}
          searchKey="name"
          searchPlaceholder="Search carriers..."
          exportFileName="shipping-carriers"
          onRowView={(item) => openEditCarrier(item)}
        />
      )}

      {currentTab === 'shipments' && (
        <>
          <div className="filters-row">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Statuses</option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <DataTable
            columns={shipmentColumns}
            data={shipments}
            searchKey="tracking_number"
            searchPlaceholder="Search shipments..."
            exportFileName="shipping-shipments"
          />
        </>
      )}

      {showCarrierModal && (
        <div className="modal-overlay" onClick={() => setShowCarrierModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCarrier ? 'Edit Carrier' : 'Add Carrier'}</h3>
            <form onSubmit={handleCarrierSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Name *</label>
                  <input value={carrierForm.name} onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })} required /></div>
                <div className="form-group"><label>Code *</label>
                  <input value={carrierForm.code} onChange={(e) => setCarrierForm({ ...carrierForm, code: e.target.value })} required /></div>
                {!editingCarrier && (
                  <div className="form-group"><label>API Key</label>
                    <input type="password" value={carrierForm.api_key} onChange={(e) => setCarrierForm({ ...carrierForm, api_key: e.target.value })} /></div>
                )}
                {!editingCarrier && (
                  <div className="form-group"><label>Secret</label>
                    <input type="password" value={carrierForm.secret} onChange={(e) => setCarrierForm({ ...carrierForm, secret: e.target.value })} /></div>
                )}
                <div className="form-group"><label>Status</label>
                  <select value={carrierForm.status} onChange={(e) => setCarrierForm({ ...carrierForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowCarrierModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingCarrier ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShipmentModal && (
        <div className="modal-overlay" onClick={() => setShowShipmentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Shipment</h3>
            <form onSubmit={handleShipmentSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Order ID *</label>
                  <input value={shipmentForm.order_id} onChange={(e) => setShipmentForm({ ...shipmentForm, order_id: e.target.value })} required /></div>
                <div className="form-group"><label>Carrier ID *</label>
                  <input value={shipmentForm.carrier_id} onChange={(e) => setShipmentForm({ ...shipmentForm, carrier_id: e.target.value })} required /></div>
                <div className="form-group"><label>Tracking Number</label>
                  <input value={shipmentForm.tracking_number} onChange={(e) => setShipmentForm({ ...shipmentForm, tracking_number: e.target.value })} /></div>
                <div className="form-group"><label>Shipping Cost (₹)</label>
                  <input type="number" step="0.01" value={shipmentForm.shipping_cost} onChange={(e) => setShipmentForm({ ...shipmentForm, shipping_cost: e.target.value })} /></div>
                <div className="form-group"><label>Status</label>
                  <select value={shipmentForm.status} onChange={(e) => setShipmentForm({ ...shipmentForm, status: e.target.value })}>
                    {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowShipmentModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrackingModal && selectedShipment && (
        <div className="modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Tracking Event — {selectedShipment.tracking_number}</h3>
            <form onSubmit={handleTrackingSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Event *</label>
                  <input value={trackingForm.event} onChange={(e) => setTrackingForm({ ...trackingForm, event: e.target.value })} placeholder="e.g. Picked up, In transit" required /></div>
                <div className="form-group"><label>Location</label>
                  <input value={trackingForm.location} onChange={(e) => setTrackingForm({ ...trackingForm, location: e.target.value })} /></div>
                <div className="form-group full-width"><label>Notes</label>
                  <textarea value={trackingForm.notes} onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })} rows={2} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowTrackingModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Add Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipping;
