import React from 'react';
import { formatCurrency } from '../../../../utils/formatters';

const RecipeCard = ({ recipe, onClick }) => {
  const yieldL = (recipe.expected_yield_ml || 0) / 1000;
  const costPerL = recipe.cost_per_liter || 0;

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="recipe-card-header">
        <span className={`status-dot ${recipe.is_active ? 'active' : 'inactive'}`} />
        <span className="recipe-status-text">{recipe.is_active ? 'Active' : 'Inactive'}</span>
      </div>
      
      <div className="recipe-card-body">
        <h3 className="recipe-title">{recipe.name}</h3>
        <p className="recipe-description">{recipe.description || 'No description provided.'}</p>
        
        {recipe.product && (
          <div className="recipe-product-badge">
            📦 {recipe.product.name}
          </div>
        )}
        
        <div className="recipe-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Yield</span>
            <span className="metric-value">{yieldL} L</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">pH</span>
            <span className="metric-value">{recipe.expected_ph || 'N/A'}</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">TDS</span>
            <span className="metric-value">{recipe.expected_tds || 'N/A'}%</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Brix</span>
            <span className="metric-value">{recipe.expected_brix || 'N/A'}°</span>
          </div>
        </div>
      </div>

      <div className="recipe-card-footer">
        <div className="cost-info">
          <span className="cost-label">Est. Cost</span>
          <span className="cost-value">{formatCurrency(recipe.total_cost || 0)}</span>
        </div>
        <div className="cost-info align-right">
          <span className="cost-label">Cost/L</span>
          <span className="cost-value highlight">{formatCurrency(costPerL)}</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
