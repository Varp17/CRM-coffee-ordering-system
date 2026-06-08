import React from 'react';

const InventoryCard = ({ item }) => {
  const { product, quantity_ml, reserved_qty, available_qty } = item;
  
  const total = quantity_ml;
  const availablePercent = total > 0 ? (available_qty / total) * 100 : 0;
  const reservedPercent = total > 0 ? (reserved_qty / total) * 100 : 0;

  return (
    <div className="crm-card" style={{ padding: '20px' }}>
      <div className="crm-card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h3 className="crm-card-title">{product.name}</h3>
          <p className="crm-card-subtitle">ID: {product.id.substring(0, 8)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
            {((total || 0) / 1000).toFixed(2)} L
          </span>
          <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Total Volume</p>
        </div>
      </div>

      <div className="qc-progress-container">
        <div className="qc-progress-header">
          <span className="qc-progress-label">Capacity Breakdown</span>
        </div>
        <div className="qc-progress-track" style={{ height: '12px', background: '#F3F4F6', display: 'flex' }}>
          <div 
            style={{ 
              width: `${availablePercent}%`, 
              background: '#10B981', 
              height: '100%', 
              borderTopLeftRadius: '4px', 
              borderBottomLeftRadius: '4px',
              borderTopRightRadius: reservedPercent === 0 ? '4px' : '0',
              borderBottomRightRadius: reservedPercent === 0 ? '4px' : '0'
            }} 
            title={`Available: ${available_qty}`}
          />
          <div 
            style={{ 
              width: `${reservedPercent}%`, 
              background: '#F59E0B', 
              height: '100%',
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
              borderTopLeftRadius: availablePercent === 0 ? '4px' : '0',
              borderBottomLeftRadius: availablePercent === 0 ? '4px' : '0'
            }} 
            title={`Reserved: ${reserved_qty}`}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
          <span style={{ color: '#10B981', fontWeight: 500 }}>● {((available_qty || 0) / 1000).toFixed(2)}L Available</span>
          <span style={{ color: '#F59E0B', fontWeight: 500 }}>● {((reserved_qty || 0) / 1000).toFixed(2)}L Reserved</span>
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;
