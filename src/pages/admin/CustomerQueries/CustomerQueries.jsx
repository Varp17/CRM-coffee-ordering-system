import React, { useState, useEffect, useMemo } from 'react';
import './CustomerQueries.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { customerQueriesService } from '../../../services/customerQueries';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, MessageSquare, CheckCircle, Clock } from 'lucide-react';

const CONCERN_TYPES = [
  { value: 'faulty_product', label: 'Faulty Product' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'other', label: 'Other Support Query' },
];

const STATUS_OPTS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const CustomerQueries = () => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    concern_type: 'other',
    description: '',
  });

  const [resolveData, setResolveData] = useState({
    status: 'resolved',
    resolution_notes: '',
  });

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await customerQueriesService.getAll();
      setTickets(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load tickets: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return (Array.isArray(tickets) ? tickets : []).filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const term = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (item.customer_name && item.customer_name.toLowerCase().includes(term)) ||
        (item.customer_phone && item.customer_phone.includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const openAddModal = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      concern_type: 'other',
      description: '',
    });
    setShowAddModal(true);
  };

  const openResolveModal = (ticket) => {
    setSelectedTicket(ticket);
    setResolveData({
      status: ticket.status,
      resolution_notes: ticket.resolution_notes || '',
    });
    setShowResolveModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResolveChange = (e) => {
    const { name, value } = e.target;
    setResolveData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await customerQueriesService.create(formData);
      toast.success('Support ticket logged.');
      setShowAddModal(false);
      loadTickets();
    } catch (err) {
      toast.error('Failed to log ticket: ' + err.message);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      await customerQueriesService.update(selectedTicket.id, resolveData);
      toast.success('Support ticket updated successfully.');
      setShowResolveModal(false);
      loadTickets();
    } catch (err) {
      toast.error('Failed to update ticket: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this support ticket? This cannot be undone.')) return;
    try {
      await customerQueriesService.delete(item.id);
      toast.success('Ticket deleted');
      loadTickets();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const columns = [
    { header: 'Customer', accessor: (row) => row.customer_name || 'Guest' },
    { header: 'Phone', accessor: (row) => row.customer_phone || '-' },
    {
      header: 'Concern Type',
      accessor: (row) => CONCERN_TYPES.find((c) => c.value === row.concern_type)?.label || row.concern_type || '-',
    },
    { header: 'Description', accessor: (row) => row.description || '-' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`status-badge ${row.status}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    { header: 'Resolution Notes', accessor: (row) => row.resolution_notes || '-' },
    {
      header: 'Created Date',
      accessor: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '-',
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button onClick={() => openResolveModal(row)} variant="ghost" className="action-btn-update">
          Update
        </Button>
      ),
    },
  ];

  return (
    <div className="customer-queries-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Customer Support Queries</h2>
          <p className="page-subtitle">Log, manage, and resolve customer concerns and faulty products</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={loadTickets} variant="ghost">
            <RefreshCw size={16} />
          </Button>
          <Button onClick={openAddModal} variant="primary">
            <Plus size={16} /> Log Ticket
          </Button>
        </div>
      </div>

      <div className="filters-row">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name, phone, or issue..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-search"
        />
      </div>

      <div className="data-table-container">
        <DataTable
          columns={columns}
          data={filteredTickets}
          exportFileName="customer-queries-export"
          onRowView={(item) => openResolveModal(item)}
          onRowDelete={(item) => handleDelete(item)}
        />
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <MessageSquare size={20} className="modal-header-icon" />
              <h3>Log Support Ticket</h3>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    name="customer_name"
                    type="text"
                    placeholder="Enter name"
                    value={formData.customer_name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    name="customer_phone"
                    type="text"
                    placeholder="Enter phone"
                    value={formData.customer_phone}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Concern Category *</label>
                  <select
                    name="concern_type"
                    value={formData.concern_type}
                    onChange={handleFormChange}
                    required
                  >
                    {CONCERN_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description of Issue *</label>
                  <textarea
                    name="description"
                    placeholder="Provide details about the customer's complaint or query..."
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Log Issue
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <CheckCircle size={20} className="modal-header-icon" />
              <h3>Update Support Ticket Status</h3>
            </div>
            <form onSubmit={handleResolveSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Status</label>
                  <select
                    name="status"
                    value={resolveData.status}
                    onChange={handleResolveChange}
                    required
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Resolution & Action Notes</label>
                  <textarea
                    name="resolution_notes"
                    placeholder="What action was taken to resolve this query?"
                    value={resolveData.resolution_notes}
                    onChange={handleResolveChange}
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowResolveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Update Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerQueries;
