import React from 'react';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  in_stock:    { label: 'In Stock',    color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  low_stock:   { label: 'Low Stock',   color: '#D97706', bg: '#FEF3C7', icon: AlertTriangle },
  out_of_stock:{ label: 'Out of Stock',color: '#DC2626', bg: '#FEE2E2', icon: Clock },
  reserved:    { label: 'Reserved',    color: '#6366F1', bg: '#EEF2FF', icon: Package },
};

const InventoryCard = ({ item, onClick }) => {
  const stock = item.quantity ?? 0;
  const reserved = item.reserved_qty ?? 0;
  const available = stock - reserved;
  const threshold = item.thresholds?.low ?? 20;
  const critical = item.thresholds?.critical ?? 10;

  let status = 'in_stock';
  if (stock <= 0) status = 'out_of_stock';
  else if (stock <= critical) status = 'out_of_stock';
  else if (stock <= threshold) status = 'low_stock';

  if (reserved > 0 && status === 'in_stock') status = 'reserved';

  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const pct = Math.min(100, Math.max(0, (stock / Math.max(threshold * 2, 1)) * 100));

  return (
    <div className="inventory-card" onClick={onClick}>
      <div className="inv-card-header">
        <div className="inv-card-name">
          <Package size={16} color="#6B7280" />
          <span>{item.name}</span>
        </div>
        <span className="inv-card-badge" style={{ background: cfg.bg, color: cfg.color }}>
          <StatusIcon size={12} />
          {cfg.label}
        </span>
      </div>

      <div className="inv-card-stock-row">
        <div className="inv-card-stock-val">
          <span className="inv-card-qty">{stock}</span>
          <span className="inv-card-unit">{item.unit || 'units'}</span>
        </div>
        {reserved > 0 && (
          <div className="inv-card-reserved">
            {reserved} reserved
          </div>
        )}
      </div>

      <div className="inv-card-bar-track">
        <div
          className="inv-card-bar-fill"
          style={{
            width: `${pct}%`,
            background: status === 'in_stock' ? '#059669'
                      : status === 'reserved' ? '#6366F1'
                      : status === 'low_stock' ? '#D97706'
                      : '#DC2626',
          }}
        />
        <div className="inv-card-bar-threshold" style={{ left: `${(threshold / Math.max(threshold * 2, 1)) * 100}%` }} />
      </div>

      <div className="inv-card-footer">
        <span className="inv-card-threshold">Threshold: {threshold}</span>
        <span className="inv-card-available">{available} available</span>
      </div>

      {item.updated_at && (
        <div className="inv-card-time">
          Updated {new Date(item.updated_at).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default InventoryCard;
