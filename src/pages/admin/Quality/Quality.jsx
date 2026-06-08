import React, { useState, useEffect } from 'react';
import './Quality.css';
import Button from '../../../components/Button/Button';
import { api } from '../../../services/api';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const Quality = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingQC = async () => {
    setLoading(true);
    try {
      const res = await api.get('/production/batches?qc_status=pending&limit=100');
      setBatches(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load pending QC batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingQC();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/production/batches/${id}/qc-${action}`);
      toast.success(`Batch successfully ${action}d`);
      loadPendingQC();
    } catch (err) {
      toast.error(`Failed to ${action} batch: ` + err.message);
    }
  };

  const renderProgressBar = (label, target, actual, min, max, unit = '') => {
    if (target == null) return null;
    const isPass = actual != null && Math.abs(target - actual) / target <= 0.1;
    const actualVal = actual ?? 0;
    const percent = Math.min(100, Math.max(0, ((actualVal - min) / (max - min)) * 100));
    const targetPercent = Math.min(100, Math.max(0, ((target - min) / (max - min)) * 100));

    return (
      <div className="qc-progress-container">
        <div className="qc-progress-header">
          <span className="qc-progress-label">{label}</span>
          <span className="qc-progress-values">
            Target: {target}{unit} &nbsp;&nbsp; Actual: <strong>{actual != null ? `${actual}${unit}` : '-'}</strong> &nbsp;&nbsp;
            {actual != null && (
              <span style={{ color: isPass ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                {isPass ? '● PASS' : '● FAIL'}
              </span>
            )}
          </span>
        </div>
        <div className="qc-progress-track">
          <div className="qc-progress-fill" style={{ width: `${percent}%`, background: actual != null && isPass ? '#10B981' : actual != null ? '#EF4444' : '#E5E7EB' }}></div>
          <div className="qc-progress-target" style={{ left: `${targetPercent}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="crm-dashboard">
      <div className="crm-header">
        <h2>Quality Control Queue</h2>
        <p>Target vs Actual metrics for pending production batches.</p>
      </div>

      <div className="crm-content">
        {loading ? (
          <p style={{ color: '#6B7280' }}>Loading QC Queue...</p>
        ) : batches.length === 0 ? (
          <div className="crm-empty-state">
            <CheckCircle size={48} color="#10B981" style={{ marginBottom: '16px' }} />
            <h3>All caught up!</h3>
            <p>There are no batches awaiting Quality Control.</p>
            <Button variant="outline" onClick={loadPendingQC} style={{ marginTop: '16px' }}>Refresh Queue</Button>
          </div>
        ) : (
          <div className="qc-cards-grid">
            {batches.map(batch => (
              <div key={batch.id} className="crm-card">
                <div className="crm-card-header">
                  <div>
                    <h3 className="crm-card-title">Batch: {batch.batch_number}</h3>
                    <p className="crm-card-subtitle">{batch.product?.name || 'Unknown Product'}</p>
                  </div>
                  <span className="qc-badge pending">Pending</span>
                </div>
                
                <div className="qc-metrics-list">
                  {renderProgressBar('pH Level', batch.qc_targets?.ph, batch.quality?.ph, 4.0, 6.0)}
                  {renderProgressBar('TDS', batch.qc_targets?.tds, batch.quality?.tds, 2.0, 5.0)}
                  {renderProgressBar('Brix', batch.qc_targets?.brix, batch.quality?.brix, 2.0, 6.0)}
                  {renderProgressBar('Yield', batch.qc_targets?.yield_ml ?? batch.quantity_ml, batch.quality?.yield_ml, batch.quantity_ml * 0.5, batch.quantity_ml * 1.2, 'L')}
                </div>

                <div className="qc-card-actions">
                  <Button variant="primary" onClick={() => handleAction(batch.id, 'approve')} style={{ background: '#10B981', borderColor: '#10B981' }}>
                    <CheckCircle size={16} /> Approve
                  </Button>
                  <Button variant="primary" onClick={() => handleAction(batch.id, 'reject')} style={{ background: '#EF4444', borderColor: '#EF4444' }}>
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button variant="outline" onClick={() => handleAction(batch.id, 'rework')} style={{ color: '#F59E0B', borderColor: '#F59E0B' }}>
                    <AlertTriangle size={16} /> Send for Rework
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quality;
