import React, { useEffect, useState } from 'react';
import { api } from '../../../../services/api';
import { formatDate } from '../../../../utils/formatters';
import { ArrowDown, ArrowUp, AlertTriangle, RefreshCw, Truck } from 'lucide-react';

const TXN_ICONS = {
  stock_in:    { icon: ArrowUp,    color: '#059669' },
  stock_out:   { icon: ArrowDown,  color: '#DC2626' },
  adjustment:  { icon: RefreshCw,  color: '#D97706' },
  wastage:     { icon: AlertTriangle, color: '#DC2626' },
  transfer:    { icon: Truck,      color: '#6366F1' },
};

const InventoryTimeline = ({ itemId, storeType = 'store', onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const params = {};
        if (itemId) params.ingredient_id = itemId;
        if (storeType === 'central') params.central = true;
        const res = await api.get('/inventory/transactions', params);
        const data = res?.data || res?.transactions || res;
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setLoading(false);
      }
    };
    if (itemId) fetchTxns();
  }, [itemId, storeType]);

  if (!itemId) return null;

  return (
    <div className="inv-timeline-overlay" onClick={onClose}>
      <div className="inv-timeline-panel" onClick={e => e.stopPropagation()}>
        <div className="inv-timeline-header">
          <h3>Transaction History</h3>
          <button onClick={onClose} className="inv-timeline-close">×</button>
        </div>
        <div className="inv-timeline-body">
          {loading ? (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '24px' }}>Loading...</p>
          ) : transactions.length === 0 ? (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '24px' }}>No transactions found.</p>
          ) : (
            <div className="inv-timeline-list">
              {transactions.map((txn, idx) => {
                const cfg = TXN_ICONS[txn.txn_type] || TXN_ICONS.adjustment;
                const Icon = cfg.icon;
                return (
                  <div key={txn.id || idx} className="inv-timeline-item">
                    <div className="inv-tl-icon" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      <Icon size={14} />
                    </div>
                    <div className="inv-tl-content">
                      <div className="inv-tl-type">{txn.txn_type?.replace(/_/g, ' ')}</div>
                      <div className="inv-tl-qty" style={{ color: txn.quantity >= 0 ? '#059669' : '#DC2626' }}>
                        {txn.quantity >= 0 ? '+' : ''}{txn.quantity} {txn.unit || ''}
                      </div>
                      {txn.notes && <div className="inv-tl-notes">{txn.notes}</div>}
                      <div className="inv-tl-meta">
                        Balance: {txn.balance_after} &middot; {txn.created_at ? formatDate(txn.created_at) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryTimeline;
