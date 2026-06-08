import React from 'react';

const KPICards = ({ stats }) => {
  const formatMl = (v) => v != null ? Number(v).toLocaleString() + ' ml' : '-';

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-card-label">Total Batches Today</span>
        <span className="kpi-card-value">{stats.totalToday || 0}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-card-label">Running Batches</span>
        <span className="kpi-card-value">{stats.running || 0}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-card-label">QC Pending</span>
        <span className="kpi-card-value">{stats.qcPending || 0}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-card-label">Total Volume Produced</span>
        <span className="kpi-card-value">{formatMl(stats.totalVolume)}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-card-label">Distributed Volume</span>
        <span className="kpi-card-value">{formatMl(stats.distributedVolume)}</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-card-label">Current Central Stock</span>
        <span className="kpi-card-value">{formatMl(stats.totalVolume - stats.distributedVolume)}</span>
      </div>
    </div>
  );
};

export default KPICards;
