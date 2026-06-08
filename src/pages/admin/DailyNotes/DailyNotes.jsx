import React, { useState, useEffect, useMemo } from 'react';
import './DailyNotes.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { executiveNotesService } from '../../../services/executiveNotes';
import { storeService } from '../../../services/stores';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, ClipboardList, Pencil } from 'lucide-react';

const EMPTY_FORM = {
  store_id: '',
  notes: '',
  challenges: '',
  reported_date: new Date().toISOString().slice(0, 10),
};

const DailyNotes = () => {
  const [notesList, setNotesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeFilter, setStoreFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await executiveNotesService.getAll();
      setNotesList(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load daily notes: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const resp = await storeService.getAll();
      setStores(unwrapList(resp));
    } catch {
      setStores([]);
    }
  };

  useEffect(() => {
    loadNotes();
    loadStores();
  }, []);

  const filteredNotes = useMemo(() => {
    return (Array.isArray(notesList) ? notesList : []).filter((item) => {
      const matchesStore = storeFilter === 'all' || item.store_name === storeFilter || String(item.store_id) === String(storeFilter);
      const matchesDate = !dateFilter || (item.reported_date && item.reported_date.slice(0, 10) === dateFilter);
      return matchesStore && matchesDate;
    });
  }, [notesList, storeFilter, dateFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM, reported_date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      store_id: item.store_id || '',
      notes: item.notes || '',
      challenges: item.challenges || '',
      reported_date: item.reported_date ? item.reported_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
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
      if (editingItem) {
        await executiveNotesService.update(editingItem.uuid || editingItem.id, formData);
        toast.success('Daily report updated.');
      } else {
        await executiveNotesService.create(formData);
        toast.success('Daily report logged successfully.');
      }
      setShowModal(false);
      loadNotes();
    } catch (err) {
      toast.error('Failed to save report: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this executive report? This cannot be undone.')) return;
    try {
      await executiveNotesService.delete(item.uuid || item.id);
      toast.success('Daily report deleted');
      loadNotes();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const columns = [
    {
      header: 'Reported Date',
      accessor: (row) => row.reported_date ? new Date(row.reported_date).toLocaleDateString() : '-',
    },
    { header: 'Store', accessor: (row) => row.store_name || '-' },
    { header: 'Logged By', accessor: (row) => row.executive_name || '-' },
    { header: 'Daily Summary Notes', accessor: (row) => row.notes || '-' },
    { header: 'Operational Challenges', accessor: (row) => row.challenges || '-' },
  ];

  return (
    <div className="daily-notes-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Daily Executive Notes</h2>
          <p className="page-subtitle">Log and track daily manager updates and store challenges</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadNotes} variant="ghost">
            <RefreshCw size={16} />
          </Button>
          <Button onClick={openAddModal} variant="primary">
            <Plus size={16} /> Log Day Closure
          </Button>
        </div>
      </div>

      <div className="filters-row">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Stores</option>
          {(Array.isArray(stores) ? stores : []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-date"
        />
      </div>

      <div className="data-table-container">
        <DataTable
          columns={columns}
          data={filteredNotes}
          exportFileName="daily-notes-export"
          onRowView={(item) => openEditModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <ClipboardList size={20} className="modal-header-icon" />
              <h3>{editingItem ? 'Edit Day Report' : 'Log End-of-Day Report'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Store *</label>
                  <select
                    name="store_id"
                    value={formData.store_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select store</option>
                    {(Array.isArray(stores) ? stores : []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Report Date *</label>
                  <input
                    name="reported_date"
                    type="date"
                    value={formData.reported_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Daily Summary &amp; Notes *</label>
                  <textarea
                    name="notes"
                    placeholder="Enter sales summaries, closing balances, staff logs, and updates..."
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Operational Challenges &amp; Blockers</label>
                  <textarea
                    name="challenges"
                    placeholder="Enter any machinery breakdowns, supplier issues, ingredient wastage, or other problems..."
                    value={formData.challenges}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  <Pencil size={14} /> {editingItem ? 'Update Report' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyNotes;
