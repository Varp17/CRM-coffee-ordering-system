import React, { useEffect, useState } from 'react';
import { api } from '../../../../services/api';
import { formatDate, formatCurrency } from '../../../../utils/formatters';

const QC_METRICS = {
  ph:   { label: 'pH Level', unit: '', min: 4.0, max: 6.0, decimals: 2 },
  tds:  { label: 'TDS', unit: ' ppm', min: 2.0, max: 5.0, decimals: 2 },
  brix: { label: 'Brix', unit: ' °Bx', min: 2.0, max: 6.0, decimals: 2 },
};

const BatchDetailDrawer = ({ batchId, onClose }) => {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await api.get(`/production/batches/${batchId}`);
        setBatch(data);
      } catch (err) {
        console.error('Failed to load batch details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [batchId]);

  const renderQcMetric = (key) => {
    const cfg = QC_METRICS[key];
    const actual = batch.quality?.[key];
    const target = batch.qc_targets?.[key];
    if (actual == null && target == null) return null;
    const isPass = target != null && actual != null && Math.abs(target - actual) / target <= 0.1;
    return (
      <div className={`qc-metric ${isPass ? 'pass' : actual != null ? 'fail' : ''}`}>
        <div className="qc-metric-label">{cfg.label}</div>
        <div className="qc-metric-target">Target: {target != null ? target.toFixed(cfg.decimals) : 'N/A'}{cfg.unit}</div>
        <div className="qc-metric-value">
          {actual != null ? `${actual.toFixed(cfg.decimals)}${cfg.unit}` : '-'}
          {target != null && actual != null && (
            <span className={`qc-status-badge ${isPass ? 'pass' : 'fail'}`}>
              {isPass ? 'PASS' : 'FAIL'}
            </span>
          )}
        </div>
      </div>
    );
  };

  const revenue = batch ? (batch.product?.base_price || 0) * (batch.quantity_produced_ml / 1000) : 0;
  const cost = batch?.production_cost || 0;
  const profit = revenue - cost;

  if (!batchId) return null;

  return (
    <div className="batch-drawer-overlay" onClick={onClose}>
      <div className="batch-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>Batch Details</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
              {loading ? 'Loading...' : batch?.batch_number}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        
        {loading ? (
          <div className="drawer-body"><p>Loading details...</p></div>
        ) : batch ? (
          <div className="drawer-body">
            
            <div className="drawer-section">
              <h3 className="drawer-section-title">Timeline</h3>
              <div className="timeline-item completed">
                <div className="timeline-line"></div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Created</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {formatDate(batch.created_at)} by {batch.created_by}
                </div>
              </div>
              <div className={`timeline-item ${batch.status === 'completed' ? 'completed' : 'active'}`}>
                <div className="timeline-line"></div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Production {batch.status === 'completed' ? 'Finished' : 'In Progress'}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  Produced {Number(batch.quantity_produced_ml).toLocaleString()} ml
                </div>
              </div>
              {batch.qc_status && batch.qc_status !== 'pending' && (
                <div className="timeline-item completed">
                  <div className="timeline-line"></div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    QC {batch.qc_status === 'passed' ? 'Approved' : batch.qc_status === 'failed' ? 'Rejected' : 'Rework'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Status: {batch.qc_status}
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-section">
              <h3 className="drawer-section-title">Costing Summary</h3>
              <div className="costing-grid">
                <div className="costing-item">
                  <div className="costing-label">Raw Material Cost</div>
                  <div className="costing-value">{formatCurrency(cost)}</div>
                </div>
                <div className="costing-item">
                  <div className="costing-label">Estimated Revenue</div>
                  <div className="costing-value">{formatCurrency(revenue)}</div>
                </div>
                <div className="costing-item">
                  <div className="costing-label">Profit</div>
                  <div className={`costing-value ${profit >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(profit)}
                  </div>
                </div>
                <div className="costing-item">
                  <div className="costing-label">Cost per Liter</div>
                  <div className="costing-value">{formatCurrency(cost / (batch.quantity_produced_ml / 1000) || 0)}</div>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h3 className="drawer-section-title">Quality Control</h3>
              <div className="qc-grid">
                {renderQcMetric('ph')}
                {renderQcMetric('tds')}
                {renderQcMetric('brix')}
                <div className={`qc-metric ${batch.quality?.yield_ml && batch.qc_targets?.yield_ml ? (
                  Math.abs(batch.quality.yield_ml - batch.qc_targets.yield_ml) / batch.qc_targets.yield_ml <= 0.1 ? 'pass' : 'fail'
                ) : ''}`}>
                  <div className="qc-metric-label">Yield</div>
                  <div className="qc-metric-target">
                    Target: {batch.qc_targets?.yield_ml ? `${batch.qc_targets.yield_ml} ml` : 'N/A'}
                  </div>
                  <div className="qc-metric-value">
                    {batch.quality?.yield_ml ? `${batch.quality.yield_ml} ml` : '-'}
                    {batch.qc_targets?.yield_ml && batch.quality?.yield_ml && (
                      <span className={`qc-status-badge ${
                        Math.abs(batch.quality.yield_ml - batch.qc_targets.yield_ml) / batch.qc_targets.yield_ml <= 0.1 ? 'pass' : 'fail'
                      }`}>
                        {Math.abs(batch.quality.yield_ml - batch.qc_targets.yield_ml) / batch.qc_targets.yield_ml <= 0.1 ? 'PASS' : 'FAIL'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h3 className="drawer-section-title">Raw Materials Consumed</h3>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                {batch.raw_materials?.length > 0 ? (
                  batch.raw_materials.map((rm, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx < batch.raw_materials.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                      <span style={{ fontSize: '14px', color: '#374151' }}>{rm.ingredient?.name}</span>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{rm.quantity_used} {rm.ingredient?.unit}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>No raw materials recorded.</p>
                )}
              </div>
            </div>

            {batch.distributions?.length > 0 && (
              <div className="drawer-section">
                <h3 className="drawer-section-title">Distributions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {batch.distributions.map((d) => (
                    <div key={d.id} style={{ border: '1px solid #E5E7EB', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>{d.channel.toUpperCase()} {d.store ? `- ${d.store}` : ''}</strong>
                        <span>{Number(d.quantity_ml).toLocaleString()} ml</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {formatDate(d.distributed_at)} by {d.distributed_by}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="drawer-body"><p>Error loading batch details.</p></div>
        )}
      </div>
    </div>
  );
};

export default BatchDetailDrawer;
