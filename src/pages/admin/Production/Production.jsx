import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { unwrapList } from '../../../utils/apiResponse';
import Button from '../../../components/Button/Button';
import toast from 'react-hot-toast';
import './Production.css';

import KPICards from './components/KPICards';
import ActiveBatches from './components/ActiveBatches';
import BatchWizard from './components/BatchWizard';
import BatchDetailDrawer from './components/BatchDetailDrawer';

const Production = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showWizard, setShowWizard] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/production/batches?limit=100');
      setBatches(unwrapList(res));
    } catch (err) {
      setError(err.message || 'Failed to load production batches.');
      toast.error('Failed to load production batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const arr = Array.isArray(batches) ? batches : [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalToday: arr.filter(b => b.produced_at?.startsWith(today)).length,
      running: arr.filter(b => b.status === 'in_progress').length,
      qcPending: arr.filter(b => !b.quality?.ph && b.status !== 'draft').length,
      totalVolume: arr.reduce((s, b) => s + (b.quantity_produced_ml || 0), 0),
      distributedVolume: arr.reduce((s, b) => s + (b.total_distributed_ml || 0), 0),
    };
  }, [batches]);

  const handleWizardSuccess = () => {
    setShowWizard(false);
    loadData();
  };

  return (
    <div className="production-dashboard animate-fade-in">
      <div className="production-header">
        <div>
          <h2>Production Command Center</h2>
          <p>Real-time manufacturing, QC tracking, and inventory depletion</p>
        </div>
        <div className="production-header-actions">
          <Button variant="primary" onClick={() => setShowWizard(true)}>
            + Start New Batch
          </Button>
        </div>
      </div>

      <KPICards stats={stats} />

      <div className="dashboard-split">
        <div className="dashboard-main">
          {/* We can place additional complex components here in the future like Yield Charts */}
          <div className="dashboard-card" style={{ flex: 1 }}>
             <div className="dashboard-card-header">
               <h3 className="dashboard-card-title">Recent Batch History</h3>
             </div>
             {loading && batches.length === 0 ? (
               <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading history...</p>
             ) : error ? (
               <p style={{ color: 'var(--color-danger)' }}>{error}</p>
             ) : (
               <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                   <thead>
                     <tr style={{ borderBottom: '1px solid #E5E7EB', color: '#6B7280', textAlign: 'left' }}>
                       <th style={{ padding: '12px 8px' }}>Batch #</th>
                       <th style={{ padding: '12px 8px' }}>Product</th>
                       <th style={{ padding: '12px 8px' }}>Status</th>
                       <th style={{ padding: '12px 8px' }}>Volume</th>
                     </tr>
                   </thead>
                   <tbody>
                     {batches.slice(0, 8).map(b => (
                       <tr 
                         key={b.id} 
                         style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                         onClick={() => setSelectedBatchId(b.id)}
                       >
                         <td style={{ padding: '12px 8px', fontWeight: '500' }}>{b.batch_number}</td>
                         <td style={{ padding: '12px 8px', color: '#374151' }}>{b.product?.name || '-'}</td>
                         <td style={{ padding: '12px 8px' }}>
                           <span style={{ 
                             padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                             background: b.status === 'completed' ? '#ECFDF5' : '#F3F4F6',
                             color: b.status === 'completed' ? '#10B981' : '#4B5563',
                             textTransform: 'capitalize'
                           }}>
                             {(b.status || 'completed').replace('_', ' ')}
                           </span>
                         </td>
                         <td style={{ padding: '12px 8px' }}>{Number(b.quantity_produced_ml).toLocaleString()} ml</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>

        <div className="dashboard-side">
          <ActiveBatches 
            batches={batches} 
            onClickBatch={(batch) => setSelectedBatchId(batch.id)} 
          />
        </div>
      </div>

      {showWizard && (
        <BatchWizard 
          onClose={() => setShowWizard(false)} 
          onSuccess={handleWizardSuccess} 
        />
      )}

      {selectedBatchId && (
        <BatchDetailDrawer 
          batchId={selectedBatchId} 
          onClose={() => setSelectedBatchId(null)} 
        />
      )}
    </div>
  );
};

export default Production;
