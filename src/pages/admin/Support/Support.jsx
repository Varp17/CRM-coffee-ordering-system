import React, { useState, useEffect, useMemo } from 'react';
import './Support.css';
import { supportService } from '../../../services/support';
import { formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Send, ChevronRight } from 'lucide-react';

const STATUS_FLOW = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' };

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        supportService.getTickets(),
        supportService.getStats(),
      ]);
      setTickets(unwrapList(ticketsRes));
      const s = unwrapObject(statsRes);
      setStats({ open: s.open || 0, urgent: s.urgent || 0 });
    } catch (err) {
      toast.error('Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (ticket) => {
    setSelected(ticket);
    setShowDetail(true);
    try {
      const res = await supportService.getMessages(ticket.id);
      setMessages(unwrapList(res));
    } catch {
      setMessages([]);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await supportService.updateTicketStatus(id, { status });
      toast.success(`Ticket ${status}`);
      loadAll();
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch {
      toast.error('Failed to update ticket status');
    }
  };

  const handleAssign = async (id, e) => {
    const staffId = e.target.value;
    if (!staffId) return;
    try {
      await supportService.assignTicket(id, { staff_id: staffId });
      toast.success('Ticket assigned');
      loadAll();
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    try {
      await supportService.addMessage(selected.id, { message: newMsg });
      setNewMsg('');
      const res = await supportService.getMessages(selected.id);
      setMessages(unwrapList(res));
    } catch {
      toast.error('Failed to send message');
    }
  };

  const nextStatus = (current) => STATUS_FLOW[current?.toLowerCase()] || null;

  const priorityColor = {
    low: '#888',
    medium: '#D97706',
    high: '#DC2626',
    urgent: '#991B1B',
  };

  const columns = useMemo(() => [
    {
      header: 'Subject',
      accessor: 'subject',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.subject}</strong>,
    },
    { header: 'Customer', accessor: 'customer_name', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => (
        <span className="support-priority" style={{ color: priorityColor[row.priority] || '#888' }}>
          {row.priority}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        const cls = {
          open: 'badge-info',
          in_progress: 'badge-warning',
          resolved: 'badge-success',
          closed: 'badge-muted',
        }[row.status] || 'badge-info';
        return <span className={`badge ${cls}`}>{row.status}</span>;
      },
    },
    {
      header: 'Created',
      accessor: 'created_at',
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {nextStatus(row.status) && (
            <button className="action-btn-sm outline" onClick={() => handleStatusUpdate(row.id, nextStatus(row.status))}>
              → {nextStatus(row.status).replace('_', ' ')}
            </button>
          )}
          <button className="action-btn-sm primary" onClick={() => openDetail(row)}>
            <ChevronRight size={12} /> View
          </button>
        </div>
      ),
    },
  ], [tickets]);

  return (
    <div className="support-view animate-fade-in">
      <div className="support-header">
        <div>
          <h1 className="support-title">Support</h1>
          <p className="support-sub">Customer support tickets</p>
        </div>
        <div className="support-header-actions">
          <button className="support-action-btn ghost" onClick={loadAll}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="support-stats-row">
        <div className="support-stat-card">
          <span className="stat-num">{stats.open}</span>
          <span className="stat-label">Open Tickets</span>
        </div>
        <div className="support-stat-card urgent">
          <span className="stat-num">{stats.urgent}</span>
          <span className="stat-label">Urgent</span>
        </div>
      </div>

      {loading ? (
        <div className="support-loading">Loading...</div>
      ) : (
        <DataTable columns={columns} data={tickets} exportFileName="support-tickets" />
      )}

      {showDetail && selected && (
        <>
          <div className="side-panel-overlay" onClick={() => setShowDetail(false)} />
          <div className="side-panel" role="dialog" aria-label="Ticket Detail">
            <div className="side-panel-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{selected.subject}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>
                  {selected.customer_name} · {selected.category}
                </p>
              </div>
              <button className="panel-close-btn" onClick={() => setShowDetail(false)}><X size={16} /></button>
            </div>

            <div className="side-panel-body">
              <div className="support-ticket-meta">
                <div className="detail-row"><span className="detail-label">Priority</span><span style={{ color: priorityColor[selected.priority], fontWeight: 600 }}>{selected.priority}</span></div>
                <div className="detail-row"><span className="detail-label">Status</span><span className={`badge ${selected.status === 'open' ? 'badge-info' : selected.status === 'in_progress' ? 'badge-warning' : selected.status === 'resolved' ? 'badge-success' : 'badge-muted'}`}>{selected.status}</span></div>
                <div className="detail-row"><span className="detail-label">Assign to</span>
                  <select className="support-assign-select" onChange={(e) => handleAssign(selected.id, e)} defaultValue="">
                    <option value="" disabled>Select staff</option>
                    <option value="staff1">Staff 1</option>
                    <option value="staff2">Staff 2</option>
                    <option value="staff3">Staff 3</option>
                  </select>
                </div>
              </div>

              <div className="support-messages">
                {messages.length === 0 ? (
                  <p className="support-no-msgs">No messages yet</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`support-msg ${msg.is_staff ? 'staff' : 'customer'}`}>
                      <div className="support-msg-bubble">
                        <p>{msg.message}</p>
                        <span className="support-msg-time">{formatDate(msg.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="support-chat-footer">
              <input
                className="support-chat-input"
                placeholder="Type a message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="support-send-btn" onClick={handleSend}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Support;
