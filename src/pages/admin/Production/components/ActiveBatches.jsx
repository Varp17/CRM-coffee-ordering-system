import React from 'react';
import { formatDate } from '../../../../utils/formatters';

const ActiveBatches = ({ batches, onClickBatch }) => {
  const activeStatuses = ['in_progress', 'draft', 'quarantined'];
  const activeBatches = batches.filter(b => activeStatuses.includes(b.status) || !b.status); // fallback

  const renderStatusDot = (status) => {
    return <div className={`batch-status-dot ${status || 'completed'}`} title={status}></div>;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'Running';
      case 'completed': return 'Completed';
      case 'quarantined': return 'Quarantined';
      case 'draft': return 'Draft';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3 className="dashboard-card-title">Active & Recent Batches</h3>
      </div>
      <div className="active-batches-list">
        {batches.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: '14px' }}>No recent batches found.</p>
        ) : (
          batches.slice(0, 10).map((batch) => (
            <div 
              key={batch.id} 
              className="active-batch-item"
              onClick={() => onClickBatch(batch)}
            >
              <div className="batch-info-main">
                {renderStatusDot(batch.status)}
                <div>
                  <div className="batch-title">{batch.batch_number} - {batch.product?.name || 'Unknown Product'}</div>
                  <div className="batch-meta">
                    {getStatusLabel(batch.status)} • Produced: {formatDate(batch.produced_at)}
                  </div>
                </div>
              </div>
              <div className="batch-progress">
                <div className="batch-title">{Number(batch.quantity_produced_ml).toLocaleString()} ml</div>
                <div className="batch-meta">{batch.brew_recipe?.name || 'No Recipe'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveBatches;
