import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Support.css';
import { supportService } from '../../../services/support';
import { formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { X, RefreshCw, Send, ChevronRight, ChevronDown } from 'lucide-react';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, urgent: 0 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  // Smooth dropdown pickers for Priority and Status
  const [openStatusId, setOpenStatusId] = useState(null);
  const [openPriorityId, setOpenPriorityId] = useState(null);

  const confirmAction = useConfirmation();

  // Close open pickers on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenStatusId(null);
      setOpenPriorityId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        supportService.getTickets(),
        supportService.getStats(),
      ]);
      const list = unwrapList(ticketsRes);
      setTickets(Array.isArray(list) ? list : []);
      const s = unwrapObject(statsRes);
      if (s && s.open !== undefined) {
        setStats({ open: s.open || 0, urgent: s.urgent || 0 });
      }
    } catch (error) {
      setTickets([]);
      setStats({ open: 0, urgent: 0 });
      toast.error(error.message || 'Unable to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = {
    low: '#718096',
    medium: '#D97706',
    high: '#DC2626',
    urgent: '#991B1B',
  };

  const openDetail = async (ticket) => {
    setSelected(ticket);
    setShowDetail(true);
    const initialMessage = {
      id: `ticket-${ticket.id}`,
      sender: 'customer',
      text: ticket.message,
      time: ticket.created_at,
    };
    setMessages([initialMessage]);

    try {
      const response = await supportService.getMessages(ticket.id);
      const replies = unwrapList(response).map((message) => ({
        id: message.id,
        sender: message.sender,
        text: message.message,
        time: message.created_at,
      }));
      setMessages([initialMessage, ...replies]);
    } catch (error) {
      toast.error(error.message || 'Unable to load ticket replies');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    const ticket = tickets.find((t) => t.id === id);
    const label = newStatus.replace('_', ' ');

    if (newStatus === 'resolved' || newStatus === 'closed') {
      const isConfirmed = await confirmAction({
        title: `${label.charAt(0).toUpperCase() + label.slice(1)} Ticket`,
        description: `Are you sure you want to mark ticket #${ticket?.id || id} as "${label}"? This will close the conversation with ${ticket?.customer_name || 'the customer'}.`,
        type: 'level1',
        isDestructive: newStatus === 'closed',
      });
      if (!isConfirmed) return;
    }

    try {
      await supportService.updateTicketStatus(id, { status: newStatus });
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === id ? { ...ticket, status: newStatus } : ticket))
      );
      if (selected?.id === id) {
        setSelected((previous) => ({ ...previous, status: newStatus }));
      }
      toast.success(`Ticket status updated to ${label}`);
      loadAll();
    } catch (error) {
      toast.error(error.message || 'Unable to update ticket status');
    }
  };

  const handlePriorityUpdate = async (id, newPriority) => {
    try {
      await supportService.updateTicketPriority(id, { priority: newPriority });
      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === id ? { ...ticket, priority: newPriority } : ticket))
      );
      if (selected?.id === id) {
        setSelected((previous) => ({ ...previous, priority: newPriority }));
      }
      toast.success(`Priority updated to "${newPriority.toUpperCase()}"`);
    } catch (error) {
      toast.error(error.message || 'Unable to update ticket priority');
    }
  };

  const handleAssign = async (id, assignedTo) => {
    try {
      await supportService.assignTicket(id, { assigned_to: assignedTo });
      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === id ? { ...ticket, assigned_to: assignedTo } : ticket
        )
      );
      setSelected((previous) =>
        previous?.id === id ? { ...previous, assigned_to: assignedTo } : previous
      );
      toast.success('Ticket assignment saved');
    } catch (error) {
      toast.error(error.message || 'Unable to assign ticket');
    }
  };

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text || !selected?.id) return;

    try {
      const response = await supportService.addMessage(selected.id, {
        sender: 'agent',
        message: text,
      });
      const reply = unwrapObject(response);
      setMessages((previous) => [
        ...previous,
        {
          id: reply.id,
          sender: reply.sender || 'agent',
          text: reply.message || text,
          time: reply.created_at || new Date().toISOString(),
        },
      ]);
      setNewMsg('');
      toast.success('Reply saved');
    } catch (error) {
      toast.error(error.message || 'Unable to save reply');
    }
  };

  // WebSocket-driven real-time refresh
  const wsNotifications = useNotificationStore((s) => s.notifications);
  const prevNotifCountRef = useRef(0);

  useEffect(() => {
    const currentCount = wsNotifications.length;
    if (prevNotifCountRef.current > 0 && currentCount > prevNotifCountRef.current) {
      loadAll();
    }
    prevNotifCountRef.current = currentCount;
  }, [wsNotifications.length]);

  const columns = [
    {
      header: 'Subject',
      accessor: 'subject',
      sortable: true,
      render: (row) => (
        <span 
          style={{ color: '#007AFF', fontWeight: 600, cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); openDetail(row); }}
        >
          {row.subject}
        </span>
      ),
    },
    {
      header: 'Customer & Contact',
      accessor: 'customer_name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>{row.customer_name || 'Guest Customer'}</span>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
            ✉️ {row.email || 'N/A'} {row.phone ? ` · 📞 ${row.phone}` : ''}
          </span>
        </div>
      ),
    },
    { header: 'Category', accessor: 'category', sortable: true },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => {
        const isOpen = openPriorityId === row.id;
        return (
          <div style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 9999 : 1 }}>
            <button
              type="button"
              className="support-priority-pill"
              style={{ color: priorityColor[row.priority] || '#888' }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenPriorityId(isOpen ? null : row.id);
                setOpenStatusId(null);
              }}
            >
              {row.priority?.toUpperCase()} <ChevronDown size={12} className="picker-chevron" />
            </button>

            {isOpen && (
              <div className="support-dropdown-picker" onClick={(e) => e.stopPropagation()}>
                {['low', 'medium', 'high', 'urgent'].map((p) => {
                  const isActive = row.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`picker-item ${isActive ? 'picker-item--active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isActive) handlePriorityUpdate(row.id, p);
                        setOpenPriorityId(null);
                      }}
                    >
                      <span className="picker-dot" style={{ backgroundColor: priorityColor[p] }} />
                      <span style={{ color: priorityColor[p], fontWeight: isActive ? 700 : 600 }}>
                        {p.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        const isOpen = openStatusId === row.id;
        const cls = {
          open: 'badge-info',
          in_progress: 'badge-warning',
          resolved: 'badge-success',
          closed: 'badge-muted',
        }[row.status] || 'badge-info';

        return (
          <div style={{ position: 'relative', display: 'inline-block', zIndex: isOpen ? 9999 : 1 }}>
            <button
              type="button"
              className={`badge ${cls} support-status-btn`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenStatusId(isOpen ? null : row.id);
                setOpenPriorityId(null);
              }}
            >
              {row.status?.replace('_', ' ')} <ChevronDown size={12} className="picker-chevron" />
            </button>

            {isOpen && (
              <div className="support-dropdown-picker" onClick={(e) => e.stopPropagation()}>
                {[
                  { value: 'open', label: 'open', color: '#2563EB' },
                  { value: 'in_progress', label: 'in progress', color: '#D97706' },
                  { value: 'resolved', label: 'resolved', color: '#16A34A' },
                  { value: 'closed', label: 'closed', color: '#6B7280' },
                ].map((s) => {
                  const isActive = row.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      className={`picker-item ${isActive ? 'picker-item--active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isActive) handleStatusUpdate(row.id, s.value);
                        setOpenStatusId(null);
                      }}
                    >
                      <span className="picker-dot" style={{ backgroundColor: s.color }} />
                      <span style={{ color: s.color, fontWeight: isActive ? 700 : 600 }}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
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
          <button className="action-btn-sm primary" onClick={(e) => { e.stopPropagation(); openDetail(row); }}>
            <ChevronRight size={12} /> View
          </button>
        </div>
      ),
    },
  ];

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
                  <select
                    className="support-assign-select"
                    onChange={(event) => handleAssign(selected.id, event.target.value)}
                    value={selected.assigned_to || ''}
                  >
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
                  messages.map((msg) => (
                    <div key={msg.id} className={`support-msg ${msg.sender === 'agent' ? 'staff' : 'customer'}`}>
                      <div className="support-msg-bubble">
                        <p>{msg.text}</p>
                        <span className="support-msg-time">{formatDate(msg.time)}</span>
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
