import React from 'react';
import { Truck, Store, ArrowRight } from 'lucide-react';
import { formatDate } from '../../../../utils/formatters';

const InventoryTimeline = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p style={{ padding: '24px', color: '#6B7280' }}>No recent distribution activity.</p>;
  }

  return (
    <ul className="ci-timeline">
      {logs.slice(0, 10).map((log) => (
        <li key={log.id} className="ci-timeline-item">
          <div className="ci-timeline-icon">
            {log.channel === 'store' ? <Store size={16} /> : <Truck size={16} />}
          </div>
          <div className="ci-timeline-content">
            <h4 className="ci-timeline-title">
              Distributed <strong>{((log.quantity_ml || 0) / 1000).toFixed(2)}L</strong> of {log.product_name}
            </h4>
            <p className="ci-timeline-meta">
              To: {log.store || log.channel} &bull; Batch: {log.batch_number}
            </p>
            <p className="ci-timeline-meta" style={{ marginTop: '4px' }}>
              {formatDate(log.distributed_at)} by {log.distributed_by}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default InventoryTimeline;
