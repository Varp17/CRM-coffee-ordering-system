import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { menuRecipeService } from '../../../services/menuRecipes';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const CostingSummary = ({ recipeId, recipe, linkedProduct }) => {
  const [costing, setCosting] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipeId) return;
    setLoading(true);
    menuRecipeService.getCosting(recipeId)
      .then(res => {
        setCosting(unwrapObject(res));
      })
      .catch(err => {
        toast.error('Failed to load costing: ' + err.message);
      })
      .finally(() => setLoading(false));
  }, [recipeId]);

  const sellPrice = linkedProduct?.base_price || linkedProduct?.basePrice || recipe?.sell_price || 0;
  const totalCost = costing?.total_cost ?? recipe?.total_cost ?? 0;
  const profit = sellPrice > 0 ? sellPrice - totalCost : 0;
  const margin = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(1) : 0;

  return (
    <div className="rb-costing">
      {loading ? (
        <div className="rb-loading"><Loader2 size={20} className="spinner" /> Loading costing...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="rb-costing-cards">
            <div className="rb-cost-card">
              <span className="rb-cost-label">Total Cost</span>
              <strong className="rb-cost-value">{formatCurrency(totalCost)}</strong>
            </div>
            <div className="rb-cost-card">
              <span className="rb-cost-label">Sell Price</span>
              <strong className="rb-cost-value">{formatCurrency(sellPrice)}</strong>
            </div>
            <div className="rb-cost-card profit">
              <span className="rb-cost-label">Profit</span>
              <strong className="rb-cost-value">{formatCurrency(profit)}</strong>
            </div>
            <div className="rb-cost-card margin">
              <span className="rb-cost-label">Margin</span>
              <strong className="rb-cost-value">{margin}%</strong>
            </div>
          </div>

          {/* Line-by-Line Costing */}
          {costing?.line_items && costing.line_items.length > 0 && (
            <div className="rb-costing-detail">
              <h4>Cost Breakdown</h4>
              <table className="rb-costing-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Cost/Unit</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {costing.line_items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.ingredient_name || item.name || '—'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td>{formatCurrency(item.cost_per_unit || 0)}</td>
                      <td>{formatCurrency(item.line_total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4}><strong>Total</strong></td>
                    <td><strong>{formatCurrency(costing.total_cost || 0)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Raw Material Drill-Down */}
          {costing?.raw_materials && costing.raw_materials.length > 0 && (
            <div className="rb-costing-raw">
              <h4>Raw Material Costs</h4>
              <table className="rb-costing-table">
                <thead>
                  <tr>
                    <th>Raw Material</th>
                    <th>Used In</th>
                    <th>Cost/Unit</th>
                    <th>Total Used</th>
                    <th>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {costing.raw_materials.map((rm, idx) => (
                    <tr key={idx}>
                      <td>{rm.name || '—'}</td>
                      <td>{rm.ingredient_name || '—'}</td>
                      <td>{formatCurrency(rm.cost_per_unit || 0)}</td>
                      <td>{rm.total_quantity || 0} {rm.unit || ''}</td>
                      <td>{formatCurrency(rm.contribution || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(!costing?.line_items || costing.line_items.length === 0) && (
            <div className="rb-empty">No costing data available for this recipe.</div>
          )}
        </>
      )}
    </div>
  );
};

export default CostingSummary;
