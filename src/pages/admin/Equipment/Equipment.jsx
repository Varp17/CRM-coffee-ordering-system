import React, { useState, useEffect, useMemo } from 'react';
import './Equipment.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { equipmentService } from '../../../services/equipment';
import { unwrapList } from '../../../utils/apiResponse';
import { formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Eye, AlertTriangle, Wrench, Calendar } from 'lucide-react';

const EQUIPMENT_STATUSES = ['active', 'maintenance', 'calibration_due', 'broken', 'retired'];

const STATUS_LABELS = {
  active: 'Active',
  maintenance: 'In Maintenance',
  calibration_due: 'Calibration Due',
  broken: 'Broken',
  retired: 'Retired',
};

const STATUS_COLORS = {
  active: '#2e7d32',
  maintenance: '#e65100',
  calibration_due: '#c62828',
  broken: '#b71c1c',
  retired: '#757575',
};

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showMaintenanceLogs, setShowMaintenanceLogs] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [calibrationDue, setCalibrationDue] = useState([]);

  const [formData, setFormData] = useState({
    name: '', category: '', store: '', status: 'active', next_calibration: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'repair', description: '', performed_by: '', cost: '', performed_at: new Date().toISOString().split('T')[0],
  });

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const resp = await equipmentService.getAll();
      setEquipment(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load equipment: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalibrationDue = async () => {
    try {
      const resp = await equipmentService.getCalibrationDue();
      const data = unwrapList(resp);
      setCalibrationDue(data);
    } catch {
      setCalibrationDue([]);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadCalibrationDue();
  }, []);

  const stats = useMemo(() => {
    const arr = Array.isArray(equipment) ? equipment : [];
    return {
      total: arr.length,
      calibrationDue: arr.filter((e) => e.status === 'calibration_due').length,
      inMaintenance: arr.filter((e) => e.status === 'maintenance').length,
    };
  }, [equipment]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', store: '', status: 'active', next_calibration: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category || '', store: item.store || '',
      status: item.status, next_calibration: item.next_calibration || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (editingItem) {
        await equipmentService.update(editingItem.id, payload);
        toast.success('Equipment updated');
      } else {
        await equipmentService.create(payload);
        toast.success('Equipment created');
      }
      setShowModal(false);
      loadEquipment();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await equipmentService.delete(item.id);
      toast.success('Equipment deleted');
      loadEquipment();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const viewMaintenance = async (item) => {
    setSelectedEquipment(item);
    try {
      const resp = await equipmentService.getMaintenance(item.id);
      setMaintenanceLogs(unwrapList(resp));
    } catch { setMaintenanceLogs([]); }
    setShowMaintenanceLogs(true);
  };

  const openAddMaintenance = (item) => {
    setSelectedEquipment(item);
    setMaintenanceForm({
      type: 'repair', description: '', performed_by: '', cost: '', performed_at: new Date().toISOString().split('T')[0],
    });
    setShowMaintenanceModal(true);
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    try {
      await equipmentService.addMaintenance(selectedEquipment.id, {
        ...maintenanceForm,
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
      });
      toast.success('Maintenance log added');
      setShowMaintenanceModal(false);
      loadEquipment();
      loadCalibrationDue();
    } catch (err) {
      toast.error('Failed to add maintenance: ' + err.message);
    }
  };

  const columns = useMemo(() => [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { header: 'Store', accessor: 'store', sortable: true },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className="status-badge" style={{
          background: STATUS_COLORS[row.status] + '20',
          color: STATUS_COLORS[row.status],
        }}>
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
    {
      header: 'Next Calibration', accessor: 'next_calibration', sortable: true,
      render: (row) => row.next_calibration ? formatDate(row.next_calibration) : '-',
    },
    {
      header: 'Actions', accessor: 'id',
      render: (row) => (
        <div className="action-btn-group">
          <button className="action-btn-sm outline" onClick={() => viewMaintenance(row)}>
            <Eye size={14} /> Logs
          </button>
          <button className="action-btn-sm outline" onClick={() => openAddMaintenance(row)}>
            <Wrench size={14} /> Maint.
          </button>
          <button className="action-btn-sm outline" onClick={() => openEditModal(row)}>
            Edit
          </button>
        </div>
      ),
    },
  ], []);

  const maintenanceColumns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Description', accessor: 'description' },
    { header: 'Performed By', accessor: 'performed_by' },
    { header: 'Cost', accessor: (row) => row.cost ? `₹${row.cost}` : '-' },
    { header: 'Date', accessor: (row) => formatDate(row.performed_at) },
  ];

  return (
    <div className="equipment-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Equipment</h2>
          <p className="page-subtitle">Manage equipment, maintenance logs, and calibration schedules</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadEquipment} variant="ghost"><RefreshCw size={16} /></Button>
          <Button onClick={openAddModal} variant="primary"><Plus size={16} /> Add Equipment</Button>
        </div>
      </div>

      {calibrationDue.length > 0 && (
        <div className="alert-bar">
          <AlertTriangle size={18} />
          <span><strong>{calibrationDue.length}</strong> equipment item(s) due for calibration</span>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Equipment</span></div>
        <div className="stat-card warning"><span className="stat-value">{stats.calibrationDue}</span><span className="stat-label">Calibration Due</span></div>
        <div className="stat-card danger"><span className="stat-value">{stats.inMaintenance}</span><span className="stat-label">In Maintenance</span></div>
      </div>

      <div className="data-table-container">
        <DataTable
          columns={columns}
          data={equipment}
          searchKey="name"
          searchPlaceholder="Search equipment..."
          exportFileName="equipment"
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Equipment' : 'Add Equipment'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Name *</label>
                  <input name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label>Category</label>
                  <input name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
                <div className="form-group"><label>Store</label>
                  <input name="store" value={formData.store} onChange={(e) => setFormData({ ...formData, store: e.target.value })} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select></div>
                <div className="form-group"><label>Next Calibration</label>
                  <input name="next_calibration" type="date" value={formData.next_calibration} onChange={(e) => setFormData({ ...formData, next_calibration: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && selectedEquipment && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Maintenance Log — {selectedEquipment.name}</h3>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Type</label>
                  <select value={maintenanceForm.type} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}>
                    <option value="repair">Repair</option>
                    <option value="calibration">Calibration</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="inspection">Inspection</option>
                  </select></div>
                <div className="form-group"><label>Date</label>
                  <input type="date" value={maintenanceForm.performed_at} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_at: e.target.value })} /></div>
                <div className="form-group full-width"><label>Description *</label>
                  <textarea value={maintenanceForm.description} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} required rows={2} /></div>
                <div className="form-group"><label>Performed By</label>
                  <input value={maintenanceForm.performed_by} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })} /></div>
                <div className="form-group"><label>Cost (₹)</label>
                  <input type="number" step="0.01" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowMaintenanceModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Add Log</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceLogs && selectedEquipment && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceLogs(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>Maintenance Logs — {selectedEquipment.name}</h3>
              <Button variant="ghost" onClick={() => setShowMaintenanceLogs(false)}>Close</Button>
            </div>
            {maintenanceLogs.length === 0 ? (
              <p className="empty-state">No maintenance logs recorded yet.</p>
            ) : (
              <table className="maintenance-table">
                <thead><tr><th>Type</th><th>Description</th><th>Performed By</th><th>Cost</th><th>Date</th></tr></thead>
                <tbody>
                  {maintenanceLogs.map((log, i) => (
                    <tr key={log.id || i}>
                      <td><span className="badge">{log.type}</span></td>
                      <td>{log.description}</td>
                      <td>{log.performed_by || '-'}</td>
                      <td>{log.cost ? `₹${log.cost}` : '-'}</td>
                      <td>{formatDate(log.performed_at)}</td>
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

export default Equipment;
