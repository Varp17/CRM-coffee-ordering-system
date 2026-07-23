import React, { useState, useEffect, useMemo } from 'react';
import './Support.css';
import { supportService } from '../../../services/support';
import { formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Send, ChevronRight } from 'lucide-react';

const INITIAL_KIOSK_SUPPORT = [
  {
    id: 't-901',
    subject: 'Bulk Corporate Order Inquiry for Tech Park Kiosk',
    customer_name: 'Vikram Roy',
    email: 'vikram.roy@innovate.co',
    phone: '+91 98765 43210',
    priority: 'high',
    status: 'open',
    source: 'Kiosk Contact Form',
    created_at: '2026-07-23T09:15:00Z',
    message: 'Hello Chilld Coffee Team, we would like to set up a monthly subscription of 500 cold brew bottles for our office in Whitefield.'
  },
  {
    id: 't-902',
    subject: 'Custom Recipe Approval Status',
    customer_name: 'Priya Sundaram',
    email: 'priya.s@gmail.com',
    phone: '+91 98123 45678',
    priority: 'medium',
    status: 'in_progress',
    source: 'Kiosk Contact Form',
    created_at: '2026-07-22T14:30:00Z',
    message: 'Hi! I created the Cardamom Vanilla Blend on your kiosk custom builder yesterday. Wanted to check if it will be featured on the community recipes page!'
  },
  {
    id: 't-903',
    subject: 'Feedback on Classic Cold Brew Concentrate',
    customer_name: 'Amitabh Joshi',
    email: 'ajoshi@techmail.com',
    phone: '+91 99887 76655',
    priority: 'low',
    status: 'resolved',
    source: 'Kiosk Contact Form',
    created_at: '2026-07-21T16:45:00Z',
    message: 'Loved the smooth taste of the Classic concentrate at the Indiranagar kiosk. Is this available for home delivery in 1L bottles?'
  }
];

const getMergedSupport = () => {
  try {
    const userMsgs = JSON.parse(localStorage.getItem('chilld_kiosk_contacts') || '[]');
    if (Array.isArray(userMsgs) && userMsgs.length > 0) {
      const formatted = userMsgs.map((m) => ({
        id: m.id || `t-${Date.now()}`,
        subject: m.subject || 'Website Inquiry',
        customer_name: m.name,
        email: m.email,
        phone: m.phone || 'N/A',
        priority: 'medium',
        status: m.status || 'open',
        source: 'Kiosk Contact Form',
        created_at: m.createdAt || new Date().toISOString(),
        message: m.message,
      }));
      return [...formatted, ...INITIAL_KIOSK_SUPPORT];
    }
  } catch (_) {}
  return INITIAL_KIOSK_SUPPORT;
};

const Support = () => {
  const [tickets, setTickets] = useState(getMergedSupport);

  // Sync with kiosk website contact submissions
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chilld_kiosk_contacts') {
        setTickets(getMergedSupport());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  const [stats, setStats] = useState({ open: 2, urgent: 1 });
  const [loading, setLoading] = useState(false);
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
        supportService.getTickets().catch(() => null),
        supportService.getStats().catch(() => null),
      ]);
      const list = unwrapList(ticketsRes);
      if (list && list.length > 0) {
        setTickets(list);
      }
      const s = unwrapObject(statsRes);
      if (s && s.open !== undefined) {
        setStats({ open: s.open || 0, urgent: s.urgent || 0 });
      }
    } catch {
      // Retain INITIAL_KIOSK_SUPPORT fallback
    } finally {
      setLoading(false);
    }
  };

const STATUS_FLOW = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: 'open',
};

const nextStatus = (current) => STATUS_FLOW[current?.toLowerCase()] || null;

const priorityColor = {
  low: '#718096',
  medium: '#D97706',
  high: '#DC2626',
  urgent: '#991B1B',
};

  const openDetail = (ticket) => {
    setSelected(ticket);
    setShowDetail(true);
    setMessages([
      {
        id: 'm-1',
        sender: 'customer',
        text: ticket.message,
        time: ticket.created_at || 'Today 10:15 AM',
      },
    ]);
  };

  const handleStatusUpdate = (id, newStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (selected?.id === id) {
      setSelected((prev) => ({ ...prev, status: newStatus }));
    }
    toast.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const msgObj = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      text: newMsg.trim(),
      time: 'Just now',
    };
    setMessages((prev) => [...prev, msgObj]);
    setNewMsg('');
    toast.success('Reply sent to customer!');
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
          <button className="support-action-btn ghost" onClick={loadAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
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
