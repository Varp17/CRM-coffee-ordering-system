import React, { useState, useEffect } from 'react';
import { Plus, X, RefreshCw } from 'lucide-react';
import { menuRecipeService } from '../../../services/menuRecipes';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const RecipeDetail = ({ recipe, onRefresh }) => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // New ingredient form
  const [showAdd, setShowAdd] = useState(false);
  const [newIngId, setNewIngId] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newUnit, setNewUnit] = useState('ml');
  const [allIngredients, setAllIngredients] = useState([]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await menuRecipeService.getById(recipe.id || recipe.uuid);
      const data = unwrapObject(res);
      if (data) {
        setIngredients(data.ingredients || data.recipe_ingredients || []);
      }
    } catch (err) {
      toast.error('Failed to load recipe detail: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipe?.id || recipe?.uuid) {
      loadDetail();
    }
  }, [recipe?.id, recipe?.uuid]);

  const handleAdd = async () => {
    if (!newIngId || !newQty) {
      toast.error('Select an ingredient and enter quantity');
      return;
    }
    try {
      await menuRecipeService.addIngredient(recipe.id || recipe.uuid, {
        ingredient_id: newIngId,
        quantity: parseFloat(newQty),
        unit: newUnit,
      });
      toast.success('Ingredient added');
      setShowAdd(false);
      setNewIngId('');
      setNewQty(10);
      loadDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to add ingredient: ' + err.message);
    }
  };

  const handleRemove = async (ingredientId) => {
    try {
      await menuRecipeService.removeIngredient(recipe.id || recipe.uuid, ingredientId);
      toast.success('Ingredient removed');
      loadDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to remove ingredient: ' + err.message);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await menuRecipeService.recalculate(recipe.id || recipe.uuid);
      toast.success('Cost recalculated');
      loadDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Recalculation failed: ' + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="rb-detail-ingredients">
      <div className="rb-detail-toolbar">
        <span className="rb-ing-count">{ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}</span>
        <div className="rb-detail-actions">
          <button className="rb-btn-sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} /> Add
          </button>
          <button className="rb-btn-sm" onClick={handleRecalculate} disabled={recalculating}>
            <RefreshCw size={14} className={recalculating ? 'spinner' : ''} /> Recalculate
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rb-add-ing-form">
          <input
            type="text"
            placeholder="Ingredient UUID"
            value={newIngId}
            onChange={e => setNewIngId(e.target.value)}
            className="rb-input-sm"
          />
          <input
            type="number"
            placeholder="Qty"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            className="rb-input-sm rb-input-narrow"
          />
          <input
            type="text"
            placeholder="Unit"
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            className="rb-input-sm rb-input-narrow"
          />
          <button className="rb-btn-sm primary" onClick={handleAdd}>Add</button>
          <button className="rb-btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="rb-loading">Loading ingredients...</div>
      ) : ingredients.length === 0 ? (
        <div className="rb-empty">No ingredients mapped to this recipe</div>
      ) : (
        <table className="rb-ing-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ingredient</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Cost/Unit</th>
              <th>Line Cost</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item, idx) => {
              const ing = item.ingredient || {};
              const qty = parseFloat(item.quantity || 0);
              const cpu = parseFloat(ing.cost_per_unit || item.cost_per_unit || 0);
              const lineCost = qty * cpu;
              return (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{ing.name || item.ingredient_name || '—'}</td>
                  <td>{qty}</td>
                  <td>{item.unit || ing.unit || 'ml'}</td>
                  <td>₹{cpu.toFixed(2)}</td>
                  <td>₹{lineCost.toFixed(2)}</td>
                  <td>
                    <button
                      className="rb-remove-btn"
                      onClick={() => handleRemove(item.ingredient_id || item.id)}
                      title="Remove ingredient"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecipeDetail;
