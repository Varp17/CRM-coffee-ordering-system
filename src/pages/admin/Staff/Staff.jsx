import React, { useState, useEffect, useMemo } from 'react';
import './Staff.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { staffService } from '../../../services/staff';
import { storeService } from '../../../services/stores';
import { unwrapList } from '../../../utils/apiResponse';
import { formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Clock, UserCheck, UserX } from 'lucide-react';

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const SHIFT_STATUSES = ['scheduled', 'checked_in', 'checked_out', 'absent'];
const PERMISSIONS_LIST = ['Dashboard', 'Orders', 'Menu', 'Inventory', 'Customers', 'Roles', 'Financials', 'CMS'];

const Staff = () => {
  const [currentTab, setCurrentTab] = useState('records');
  const [records, setRecords] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({ on_duty: 0, scheduled: 0, absent: 0 });

  const [recordForm, setRecordForm] = useState({
    employee_code: '', name: '', designation: '', store_id: '',
    employment_type: 'full_time', status: 'active', user_id: '',
    permissions: [],
  });

  const [shiftForm, setShiftForm] = useState({
    staff_id: '', date: new Date().toISOString().split('T')[0],
    start_time: '09:00', end_time: '17:00',
  });

  const loadStores = async () => {
    try {
      const resp = await storeService.getAll();
      setStores(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load stores: ' + err.message);
    }
  };

  const loadRecords = async () => {
    try {
      const resp = await staffService.getRecords();
      setRecords(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load records: ' + err.message);
    }
  };

  const loadShifts = async (date) => {
    try {
      const params = date ? { date } : {};
      const resp = await staffService.getShifts(params);
      setShifts(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load shifts: ' + err.message);
    }
  };

  const loadTimeLogs = async () => {
    try {
      const resp = await staffService.getTimeLogs();
      setTimeLogs(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load time logs: ' + err.message);
    }
  };

  const loadSummary = async () => {
    try {
      const resp = await staffService.getStaffSummary({ date: filterDate });
      const data = resp?.data || resp;
      setSummary({
        on_duty: data?.on_duty || 0,
        scheduled: data?.scheduled || 0,
        absent: data?.absent || 0,
      });
    } catch {
      setSummary({ on_duty: 0, scheduled: 0, absent: 0 });
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([loadRecords(), loadShifts(filterDate), loadTimeLogs(), loadSummary(), loadStores()]);
    setIsLoading(false);
  };

  useEffect(() => {
    handleRefresh();
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('action') === 'add') {
      setEditingRecord(null);
      setRecordForm({
        employee_code: '', name: '', designation: '', store_id: '',
        employment_type: 'full_time', status: 'active', user_id: '',
        permissions: [],
      });
      setShowRecordModal(true);
      // Clean query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 'shifts') loadShifts(filterDate);
    if (currentTab === 'records') loadSummary();
  }, [filterDate, currentTab]);

  const openAddRecord = () => {
    setEditingRecord(null);
    setRecordForm({
      employee_code: '', name: '', designation: '', store_id: '',
      employment_type: 'full_time', status: 'active', user_id: '',
      permissions: [],
    });
    setShowRecordModal(true);
  };

  const openEditRecord = (item) => {
    setEditingRecord(item);
    setRecordForm({
      employee_code: item.employee_code, name: item.name, designation: item.designation || '',
      store_id: item.store_id || '', employment_type: item.employment_type || 'full_time',
      status: item.status, user_id: item.user_id || '',
      permissions: item.permissions || [],
    });
    setShowRecordModal(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await staffService.updateRecord(editingRecord.id, recordForm);
        toast.success('Staff record updated');
      } else {
        await staffService.createRecord(recordForm);
        toast.success('Staff record created');
      }
      setShowRecordModal(false);
      loadRecords();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleShiftStatus = async (id, status) => {
    try {
      await staffService.updateShiftStatus(id, { status });
      toast.success(`Shift ${status}`);
      loadShifts(filterDate);
    } catch (err) {
      toast.error('Failed to update shift: ' + err.message);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await staffService.createShift(shiftForm);
      toast.success('Shift created');
      setShowShiftModal(false);
      setShiftForm({
        staff_id: '', date: new Date().toISOString().split('T')[0],
        start_time: '09:00', end_time: '17:00',
      });
      loadShifts(filterDate);
    } catch (err) {
      toast.error('Failed to create shift: ' + err.message);
    }
  };

  const recordColumns = useMemo(() => [
    { header: 'Employee Code', accessor: 'employee_code', sortable: true },
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Designation', accessor: 'designation', sortable: true },
    { header: 'Store', accessor: 'store_name', sortable: true },
    {
      header: 'Type', accessor: 'employment_type', sortable: true,
      render: (row) => <span className="badge">{row.employment_type?.replace('_', ' ')}</span>,
    },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      ),
    },
  ], []);

  const shiftColumns = useMemo(() => [
    { header: 'Staff Name', accessor: 'staff_name', sortable: true },
    { header: 'Date', accessor: 'date', sortable: true, render: (row) => formatDate(row.date) },
    { header: 'Start Time', accessor: 'start_time' },
    { header: 'End Time', accessor: 'end_time' },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status}`}>
          {row.status === 'checked_in' ? 'Checked In' : row.status === 'checked_out' ? 'Checked Out' : row.status}
        </span>
      ),
    },
    {
      header: 'Actions', accessor: 'id',
      render: (row) => {
        if (row.status === 'scheduled') {
          return (
            <div className="action-btn-group">
              <button className="action-btn-sm success" onClick={() => handleShiftStatus(row.id, 'checked_in')}>
                <UserCheck size={14} /> Check In
              </button>
              <button className="action-btn-sm danger" onClick={() => handleShiftStatus(row.id, 'absent')}>
                <UserX size={14} /> Absent
              </button>
            </div>
          );
        }
        if (row.status === 'checked_in') {
          return (
            <button className="action-btn-sm warning" onClick={() => handleShiftStatus(row.id, 'checked_out')}>
              <Clock size={14} /> Check Out
            </button>
          );
        }
        return <span className="text-muted">—</span>;
      },
    },
  ], []);

  const timeLogColumns = useMemo(() => [
    { header: 'Staff', accessor: 'staff_name', sortable: true },
    { header: 'Clock In', accessor: (row) => formatDate(row.clock_in) },
    { header: 'Clock Out', accessor: (row) => row.clock_out ? formatDate(row.clock_out) : '-' },
    { header: 'Total Hours', accessor: (row) => row.total_hours ? `${row.total_hours}h` : '-' },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status || 'active'}`}>{row.status || 'Active'}</span>
      ),
    },
  ], []);

  return (
    <div className="staff-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Staff Management</h2>
          <p className="page-subtitle">Manage employee records, shifts, and time tracking</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={handleRefresh} variant="ghost" disabled={isLoading}><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></Button>
          {currentTab === 'records' && <Button onClick={openAddRecord} variant="primary"><Plus size={16} /> Add Record</Button>}
          {currentTab === 'shifts' && <Button onClick={() => setShowShiftModal(true)} variant="primary"><Plus size={16} /> Create Shift</Button>}
        </div>
      </div>

      <div className="staff-tabs">
        {[
          { key: 'records', label: 'Records' },
          { key: 'shifts', label: 'Shifts' },
          { key: 'timeLogs', label: 'Time Logs' },
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

      {currentTab === 'records' && (
        <>
          <div className="stats-row">
            <div className="stat-card"><span className="stat-value">{summary.on_duty}</span><span className="stat-label">On Duty</span></div>
            <div className="stat-card"><span className="stat-value">{summary.scheduled}</span><span className="stat-label">Scheduled</span></div>
            <div className="stat-card danger"><span className="stat-value">{summary.absent}</span><span className="stat-label">Absent</span></div>
            <div className="stat-card"><span className="stat-value">{Array.isArray(records) ? records.length : 0}</span><span className="stat-label">Total Staff</span></div>
          </div>
          <DataTable
            columns={recordColumns}
            data={records}
            searchKey="name"
            searchPlaceholder="Search staff records..."
            exportFileName="staff-records"
            onRowView={(item) => openEditRecord(item)}
          />
        </>
      )}

      {currentTab === 'shifts' && (
        <>
          <div className="filters-row">
            <div className="form-group" style={{ flex: 1, maxWidth: 300 }}>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="search-input" />
            </div>
          </div>
          <DataTable
            columns={shiftColumns}
            data={shifts}
            searchKey="staff_name"
            searchPlaceholder="Search shifts..."
            exportFileName="staff-shifts"
          />
        </>
      )}

      {currentTab === 'timeLogs' && (
        <DataTable
          columns={timeLogColumns}
          data={timeLogs}
          searchKey="staff_name"
          searchPlaceholder="Search time logs..."
          exportFileName="staff-time-logs"
        />
      )}

      {showRecordModal && (
        <div className="modal-overlay" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRecord ? 'Edit Staff Record' : 'Add Staff Record'}</h3>
            <form onSubmit={handleRecordSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Employee Code *</label>
                  <input value={recordForm.employee_code} onChange={(e) => setRecordForm({ ...recordForm, employee_code: e.target.value })} required /></div>
                <div className="form-group"><label>Name *</label>
                  <input value={recordForm.name} onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })} required /></div>
                <div className="form-group"><label>Designation</label>
                  <input value={recordForm.designation} onChange={(e) => setRecordForm({ ...recordForm, designation: e.target.value })} /></div>
                <div className="form-group"><label>Store *</label>
                  <select value={recordForm.store_id} onChange={(e) => setRecordForm({ ...recordForm, store_id: Number(e.target.value) })} required>
                    <option value="">Select Store</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
                <div className="form-group"><label>Employment Type</label>
                  <select value={recordForm.employment_type} onChange={(e) => setRecordForm({ ...recordForm, employment_type: e.target.value })}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select></div>
                <div className="form-group"><label>User ID (linking)</label>
                  <input value={recordForm.user_id} onChange={(e) => setRecordForm({ ...recordForm, user_id: e.target.value })} placeholder="Optional" /></div>
                <div className="form-group"><label>Status</label>
                  <select value={recordForm.status} onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select></div>
                <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                  <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Custom Permissions Override</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {PERMISSIONS_LIST.map((p) => {
                      const checked = (recordForm.permissions || []).includes(p);
                      return (
                        <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const newPerms = checked
                                ? recordForm.permissions.filter((x) => x !== p)
                                : [...(recordForm.permissions || []), p];
                              setRecordForm({ ...recordForm, permissions: newPerms });
                            }}
                          />
                          {p}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowRecordModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingRecord ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShiftModal && (
        <div className="modal-overlay" onClick={() => setShowShiftModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Shift</h3>
            <form onSubmit={handleCreateShift}>
              <div className="form-grid">
                <div className="form-group"><label>Staff ID *</label>
                  <input value={shiftForm.staff_id} onChange={(e) => setShiftForm({ ...shiftForm, staff_id: e.target.value })} required /></div>
                <div className="form-group"><label>Date</label>
                  <input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} /></div>
                <div className="form-group"><label>Start Time</label>
                  <input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} /></div>
                <div className="form-group"><label>End Time</label>
                  <input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowShiftModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Shift</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
