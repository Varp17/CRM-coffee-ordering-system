import React, { useState, useEffect, useMemo } from 'react';
import './CashManagement.css';
import { cashService } from '../../../services/cashManagement';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, DollarSign, Clock, Archive } from 'lucide-react';

const CASH_STATUSES = ['open', 'closed', 'reconciled', 'discrepancy'];

const CashManagement = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ todayCashSales: 0, openSession: null, totalInDrawer: 0 });
  const [sessionFilter, setSessionFilter] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeSessionData, setCloseSessionData] = useState({ counted_cash: '', notes: '' });
  const [selectedSession, setSelectedSession] = useState(null);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await cashService.getSessions();
      const data = unwrapList(res);
      setSessions(data);
      const open = data.find(s => s.status === 'open');
      const daily = await cashService.getDailySummary();
      const summ = unwrapObject(daily);
      setSummary({
        todayCashSales: summ?.today_cash_sales || 0,
        openSession: open || null,
        totalInDrawer: summ?.total_in_drawer || 0,
      });
    } catch (err) {
      toast.error('Failed to load sessions: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async (sessionId) => {
    try {
      const res = await cashService.getTransactions(sessionId);
      setTransactions(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load transactions: ' + err.message);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions' && sessionFilter) {
      loadTransactions(sessionFilter);
    } else if (activeTab === 'transactions') {
      setTransactions([]);
    }
  }, [activeTab, sessionFilter]);

  const handleOpenSession = async () => {
    try {
      await cashService.openSession({ opening_balance: 0 });
      toast.success('Session opened successfully');
      loadSessions();
    } catch (err) {
      toast.error('Failed to open session: ' + err.message);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    try {
      await cashService.closeSession(selectedSession.id, closeSessionData);
      toast.success('Session closed');
      setShowCloseModal(false);
      setCloseSessionData({ counted_cash: '', notes: '' });
      setSelectedSession(null);
      loadSessions();
    } catch (err) {
      toast.error('Failed to close session: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = { open: 'status-open', closed: 'status-closed', reconciled: 'status-reconciled', discrepancy: 'status-discrepancy' };
    return colors[status?.toLowerCase()] || '';
  };

  const sessionColumns = useMemo(() => [
    { header: 'Session ID', accessor: 'id', sortable: true, render: (row) => <strong style={{ color: 'var(--color-primary)' }}>#{row.id}</strong> },
    { header: 'Store', accessor: 'store_name', sortable: true },
    { header: 'Opened By', accessor: 'opened_by_name', sortable: true },
    { header: 'Opening Balance', accessor: 'opening_balance', sortable: true, render: (row) => formatCurrency(row.opening_balance) },
    { header: 'Closing Balance', accessor: 'closing_balance', sortable: true, render: (row) => row.closing_balance != null ? formatCurrency(row.closing_balance) : '-' },
    { header: 'Status', accessor: 'status', sortable: true, render: (row) => <span className={`cash-status-badge ${getStatusColor(row.status)}`}>{row.status}</span> },
    { header: 'Date', accessor: 'created_at', sortable: true, render: (row) => formatDate(row.created_at) },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          {row.status === 'open' && (
            <button className="action-btn-sm primary" onClick={() => { setSelectedSession(row); setShowCloseModal(true); }} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '4px', border: 'none' }}>
              Close
            </button>
          )}
          <button className="action-btn-sm outline" onClick={() => { setSessionFilter(row.id); setActiveTab('transactions'); }} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            View TX
          </button>
        </div>
      )
    },
  ], []);

  const transactionColumns = useMemo(() => [
    { header: 'Type', accessor: 'type', sortable: true, render: (row) => <span className={`tx-type-badge ${row.type}`}>{row.type}</span> },
    { header: 'Amount', accessor: 'amount', sortable: true, render: (row) => <strong>{formatCurrency(row.amount)}</strong> },
    { header: 'Payment Method', accessor: 'payment_method', sortable: true },
    { header: 'Description', accessor: 'description', sortable: false },
    { header: 'Date', accessor: 'created_at', sortable: true, render: (row) => formatDate(row.created_at) },
  ], []);

  return (
    <div className="cash-view animate-fade-in">
      <div className="cash-header">
        <div>
          <h2 className="section-title">Cash Management</h2>
          <p className="section-subtitle">Track store cash sessions, transactions, and daily summaries</p>
        </div>
        <button className="cash-refresh-btn" onClick={loadSessions}><RefreshCw size={13} /></button>
      </div>

      <div className="cash-stats-row">
        <div className="cash-stat-card">
          <DollarSign size={18} className="stat-icon-cash" />
          <div className="stat-info">
            <span className="stat-num">{formatCurrency(summary.todayCashSales)}</span>
            <span className="stat-label">Today's Cash Sales</span>
          </div>
        </div>
        <div className="cash-stat-card">
          <Clock size={18} className="stat-icon-cash" />
          <div className="stat-info">
            <span className="stat-num">{summary.openSession ? `#${summary.openSession.id}` : 'None'}</span>
            <span className="stat-label">Current Open Session</span>
          </div>
        </div>
        <div className="cash-stat-card">
          <Archive size={18} className="stat-icon-cash" />
          <div className="stat-info">
            <span className="stat-num">{formatCurrency(summary.totalInDrawer)}</span>
            <span className="stat-label">Total in Drawer</span>
          </div>
        </div>
      </div>

      <div className="cash-tabs">
        <button className={`cash-tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>Sessions</button>
        <button className={`cash-tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</button>
      </div>

      {activeTab === 'sessions' && (
        <>
          <div className="cash-toolbar">
            <div />
            <button className="cash-action-btn primary" onClick={handleOpenSession} disabled={!!summary.openSession}>
              + Open Session
            </button>
          </div>
          <DataTable columns={sessionColumns} data={sessions} searchKey="store_name" searchPlaceholder="Search by store..." exportFileName="cash-sessions" />
        </>
      )}

      {activeTab === 'transactions' && (
        <>
          <div className="cash-toolbar">
            <div className="cash-session-picker">
              <label>Session:</label>
              <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="cash-select">
                <option value="">Select a session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} - {s.store_name || 'Store'} ({s.status})</option>)}
              </select>
            </div>
          </div>
          <DataTable columns={transactionColumns} data={transactions} exportFileName="cash-transactions" />
        </>
      )}

      {showCloseModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content close-session-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Close Session #{selectedSession.id}</h3>
              <button className="panel-close-btn" onClick={() => setShowCloseModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Counted Cash Amount</label>
                <input type="number" className="cash-input" value={closeSessionData.counted_cash} onChange={(e) => setCloseSessionData(p => ({ ...p, counted_cash: e.target.value }))} placeholder="Enter counted cash" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="cash-input cash-textarea" value={closeSessionData.notes} onChange={(e) => setCloseSessionData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cash-action-btn primary" onClick={handleCloseSession}>Close Session</button>
              <button className="cash-action-btn ghost" onClick={() => setShowCloseModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;
