import React, { useEffect, useState } from 'react';
import { X, TrendingUp, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';
import { brewRecipeService } from '../../../../services/brewRecipes';
import toast from 'react-hot-toast';

const RecipeDetailDrawer = ({ recipeId, onClose, onEdit, onDelete }) => {
  const [costing, setCosting] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipeId) {
      setLoading(true);
      brewRecipeService.getCosting(recipeId)
        .then(res => {
          setCosting(res.data || res);
        })
        .catch(err => {
          toast.error('Failed to load recipe costing: ' + err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [recipeId]);

  if (!recipeId) return null;

  return (
    <div className="side-panel-wrapper">
      <div className="side-panel-overlay" onClick={onClose} />
      <div className="side-panel" role="dialog" aria-label="Brew Recipe Details">
        <div className="side-panel-header">
          <div>
            <h3 className="panel-title">Recipe Details</h3>
            <p className="panel-subtitle">Detailed specifications & costing breakdown</p>
          </div>
          <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <div className="side-panel-body">
          {loading ? (
            <div className="flex-center" style={{ height: '200px' }}>
              <span className="spinner" /> Loading details...
            </div>
          ) : costing ? (
            <div className="recipe-details-drawer-content">
              <div className="detail-section">
                <h4>Core Specifications</h4>
                <div className="specifications-grid">
                  <div className="spec-card">
                    <span className="lbl">Expected Yield</span>
                    <span className="val">{costing.expected_yield_l || ((costing.expected_yield_ml || 0) / 1000)} L</span>
                  </div>
                  <div className="spec-card">
                    <span className="lbl">Target pH</span>
                    <span className="val">{costing.expected_ph || 'N/A'}</span>
                  </div>
                  <div className="spec-card">
                    <span className="lbl">Target TDS</span>
                    <span className="val">{costing.expected_tds || 'N/A'}%</span>
                  </div>
                  <div className="spec-card">
                    <span className="lbl">Target Brix</span>
                    <span className="val">{costing.expected_brix || 'N/A'}°</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Costing Analysis</h4>
                <div className="costing-summary-box">
                  <div className="costing-row-summary">
                    <div>
                      <span className="lbl-sm">Estimated Batch Cost</span>
                      <h3 className="val-big">{formatCurrency(costing.total_cost || 0)}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="lbl-sm">Cost per Liter</span>
                      <h3 className="val-big accent">{formatCurrency(costing.cost_per_liter || 0)}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Raw Materials Used</h4>
                <div className="table-responsive">
                  <table className="table raw-materials-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Cost</th>
                        <th style={{ textAlign: 'right' }}>Line Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costing.raw_materials && costing.raw_materials.length > 0 ? (
                        costing.raw_materials.map((rm, i) => (
                          <tr key={i}>
                            <td><strong>{rm.name}</strong></td>
                            <td style={{ textAlign: 'right' }}>{rm.quantity} {rm.unit}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(rm.cost_per_unit)}/{rm.rm_unit}</td>
                            <td style={{ textAlign: 'right' }}><strong>{formatCurrency(rm.line_cost)}</strong></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-muted text-center">No raw materials defined.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-center" style={{ padding: '20px' }}>
              <AlertCircle size={24} style={{ marginBottom: '8px' }} />
              <p>Failed to load recipe details.</p>
            </div>
          )}
        </div>

        <div className="side-panel-footer">
          <button 
            className="action-btn-sm primary flex-center-gap"
            onClick={() => onEdit(recipeId)}
          >
            <Edit size={14} /> Edit Recipe
          </button>
          <button 
            className="action-btn-sm danger flex-center-gap"
            onClick={() => onDelete(recipeId)}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailDrawer;
