import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, RefreshCw } from 'lucide-react';
import { menuRecipeService } from '../../../services/menuRecipes';
import { ingredientService } from '../../../services/ingredients';
import { unwrapObject, unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import BeverageFormulator from './BeverageFormulator';

const RecipeDetail = ({ recipe, onRefresh }) => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [useFormulator, setUseFormulator] = useState(false);

  // New ingredient form
  const [showAdd, setShowAdd] = useState(false);
  const [newIngId, setNewIngId] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newUnit, setNewUnit] = useState('ml');
  const [allIngredients, setAllIngredients] = useState([]);

  const addedIngredientIds = useMemo(() => {
    const ids = new Set();
    ingredients.forEach(item => {
      const id = item.ingredient?.id || item.ingredient_id;
      if (id) ids.add(String(id));
    });
    return ids;
  }, [ingredients]);

  const availableIngredients = useMemo(() => {
    return allIngredients.filter(i => !addedIngredientIds.has(String(i.id)));
  }, [allIngredients, addedIngredientIds]);

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
    ingredientService.getAll({ limit: 1000 })
      .then(res => setAllIngredients(unwrapList(res)))
      .catch(() => {});
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

  if (useFormulator) {
    return <BeverageFormulator recipe={recipe} onRefresh={onRefresh} onClose={() => setUseFormulator(false)} />;
  }

  return (
    <div className="rb-detail-ingredients">
      <div className="rb-detail-toolbar">
        <span className="rb-ing-count">{ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}</span>
        <div className="rb-detail-actions">
          <button className="rb-btn-sm" onClick={() => setUseFormulator(true)}>
            Use Formulator
          </button>
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
          <select
            value={newIngId}
            onChange={e => {
              const val = e.target.value;
              setNewIngId(val);
              const ing = allIngredients.find(i => String(i.id) === String(val) || String(i.uuid) === String(val));
              if (ing) {
                setNewUnit(ing.unit || 'ml');
              }
            }}
            className="rb-input-sm"
            style={{ flex: 2 }}
          >
            <option value="">-- Select Ingredient --</option>
            {availableIngredients.length === 0 && allIngredients.length > 0 ? (
              <option value="" disabled>All ingredients already added</option>
            ) : availableIngredients.map(i => (
              <option key={i.id} value={i.id}>{i.name} ({i.ingredient_type || '—'}) — ₹{parseFloat(i.cost_per_unit || 0).toFixed(2)}/{i.unit || 'unit'}</option>
            ))}
          </select>
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
                      onClick={() => handleRemove(item.ingredient?.id || item.ingredient_id)}
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
