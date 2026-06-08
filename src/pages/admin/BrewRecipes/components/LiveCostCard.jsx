import React from 'react';
import { formatCurrency } from '../../../../utils/formatters';

const LiveCostCard = ({ expectedCost, yieldMl }) => {
  const yieldL = (yieldMl || 0) / 1000;
  const costPerLiter = yieldL > 0 ? expectedCost / yieldL : 0;

  return (
    <div className="live-cost-card">
      <div className="live-cost-header">
        <span className="pulsing-dot" /> Live Cost Projection
      </div>
      <div className="live-cost-body">
        <div className="live-cost-row">
          <span className="live-cost-lbl">Expected Cost</span>
          <span className="live-cost-val highlight-total">{formatCurrency(expectedCost)}</span>
        </div>
        <div className="live-cost-row">
          <span className="live-cost-lbl">Expected Yield</span>
          <span className="live-cost-val">{yieldL.toFixed(2)} L</span>
        </div>
        <hr className="live-cost-divider" />
        <div className="live-cost-row">
          <span className="live-cost-lbl">Cost per Liter</span>
          <span className="live-cost-val highlight-liter">{formatCurrency(costPerLiter)}</span>
        </div>
      </div>
    </div>
  );
};

export default LiveCostCard;
