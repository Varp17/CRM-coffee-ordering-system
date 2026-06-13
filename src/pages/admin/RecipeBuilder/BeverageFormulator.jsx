import React, { useState, useEffect } from 'react';
import { ingredientService } from '../../../services/ingredients';
import { menuRecipeService } from '../../../services/menuRecipes';
import { productService } from '../../../services/products';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import './RecipeBuilder.css';

const BeverageFormulator = ({ recipe, onRefresh, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Categorized ingredients
  const [allIngredients, setAllIngredients] = useState([]);
  
  const [concentratesList, setConcentratesList] = useState([]);
  const [sweetenersList, setSweetenersList] = useState([]);
  const [milksList, setMilksList] = useState([]);
  const [toppingsList, setToppingsList] = useState([]);

  // Form State - arrays for multi-select
  const [formData, setFormData] = useState({
    concentrates: [],
    sweeteners: [],
    milks: [],
    toppings: [],
    remarks: '',
    isActive: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load categorized ingredients
      const allRes = await ingredientService.getAll({ limit: 1000 });
      const allIngs = unwrapList(allRes);
      setAllIngredients(allIngs);
      
      setConcentratesList(allIngs.filter(i => ['concentrate'].includes(i.ingredient_type)));
      setSweetenersList(allIngs.filter(i => ['sweetener', 'syrup'].includes(i.ingredient_type)));
      setMilksList(allIngs.filter(i => ['milk', 'base'].includes(i.ingredient_type)));
      setToppingsList(allIngs.filter(i => ['topping', 'ice'].includes(i.ingredient_type)));

      // 2. Load existing recipe & product status
      const recipeRes = await menuRecipeService.getById(recipe.id || recipe.uuid);
      const recipeData = recipeRes?.data || recipeRes;
      const currentIngredients = recipeData.ingredients || recipeData.recipe_ingredients || [];

      let isActive = false;
      // Product UUID comes from the recipe's linked product, NOT from the recipe itself
      const linkedProductId = recipeData.product?.id || recipe.product?.id;
      if (linkedProductId) {
        try {
          const prodRes = await productService.getById(linkedProductId);
          const prod = unwrapObject(prodRes);
          if (prod) isActive = !!prod.is_active;
        } catch(e) {
          // Product may not exist yet or failed to fetch
        }
      }

      const newFormData = { 
        concentrates: [], sweeteners: [], milks: [], toppings: [], 
        remarks: recipeData.description || '',
        isActive
      };
      
      currentIngredients.forEach(item => {
        // Backend returns nested: item.ingredient.id (UUID), not flat item.ingredient_id
        const itemIngId = item.ingredient?.id || item.ingredient_id;
        const ing = allIngs.find(i => i.id === itemIngId || i.uuid === itemIngId);
        if (ing) {
          const type = ing.ingredient_type;
          const mapTo = ['concentrate'].includes(type) ? 'concentrates' :
                        ['sweetener', 'syrup'].includes(type) ? 'sweeteners' :
                        ['milk', 'base'].includes(type) ? 'milks' :
                        ['topping', 'ice'].includes(type) ? 'toppings' : null;
          if (mapTo) {
            newFormData[mapTo].push({
              ingredient_id: ing.id || ing.uuid,
              quantity: item.quantity,
              unit: item.unit || ing.unit || 'ml'
            });
          }
        }
      });

      // Ensure at least one empty row per category if empty
      ['concentrates', 'sweeteners', 'milks', 'toppings'].forEach(cat => {
        if (newFormData[cat].length === 0) {
          newFormData[cat].push({ ingredient_id: '', quantity: '', unit: '' });
        }
      });
      
      setFormData(newFormData);
    } catch (error) {
      toast.error('Failed to load formulation data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addRow = (category) => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { ingredient_id: '', quantity: '', unit: '' }]
    }));
  };

  const removeRow = (category, index) => {
    setFormData(prev => {
      const newArr = [...prev[category]];
      newArr.splice(index, 1);
      return { ...prev, [category]: newArr };
    });
  };

  const updateRow = (category, index, field, value) => {
    setFormData(prev => {
      const newArr = [...prev[category]];
      newArr[index][field] = value;
      
      // Auto selection of unit when ingredient is chosen
      if (field === 'ingredient_id') {
        const ing = allIngredients.find(i => i.id === value || i.uuid === value);
        if (ing) {
          newArr[index]['unit'] = ing.unit || 'ml';
        }
      }
      return { ...prev, [category]: newArr };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recipeId = recipe.id || recipe.uuid;
      
      // Update recipe remarks/description
      if (formData.remarks !== undefined) {
        await menuRecipeService.update(recipeId, { description: formData.remarks });
      }

      // Update product status (Super Admin direct launch capability)
      const linkedProdId = recipe.product?.id || recipe.product_id;
      if (linkedProdId) {
        try {
          await productService.update(linkedProdId, { is_active: Boolean(formData.isActive) });
        } catch(e) {
          toast.warning('Product status sync skipped — product may not be linked yet.');
        }
      }

      const recipeRes = await menuRecipeService.getById(recipeId);
      const recipeData = recipeRes?.data || recipeRes;
      const currentIngredients = recipeData.ingredients || recipeData.recipe_ingredients || [];
      
      // Remove existing ingredients
      for (const item of currentIngredients) {
        const ingUuid = item.ingredient?.id || item.ingredient_id;
        if (ingUuid) {
          await menuRecipeService.removeIngredient(recipeId, ingUuid);
        }
      }

      // Add all valid filled slots
      const allFilled = [
        ...formData.concentrates, 
        ...formData.sweeteners, 
        ...formData.milks, 
        ...formData.toppings
      ].filter(item => item.ingredient_id && item.quantity);

      for (const data of allFilled) {
        await menuRecipeService.addIngredient(recipeId, {
          ingredient_id: data.ingredient_id,
          quantity: parseFloat(data.quantity),
          unit: data.unit || 'ml' // use dynamically resolved unit
        });
      }
      
      // Recalculate cost
      await menuRecipeService.recalculate(recipeId);

      toast.success('Beverage formulation saved successfully!');
      if (onRefresh) onRefresh();
      if (onClose) onClose();
    } catch (error) {
      toast.error('Failed to save formulation: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rb-loading">Loading Formulator...</div>;

  const renderSection = (title, categoryKey, optionsList, placeholderQty) => (
    <div className="formulator-section" style={{ background: '#FAF6F0', padding: '16px', borderRadius: '12px', border: '1px solid #E2D4C4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h5 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700 }}>{title}</h5>
        <button className="rb-btn-sm outline" onClick={() => addRow(categoryKey)} style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}>
          <Plus size={12} /> Add
        </button>
      </div>
      {formData[categoryKey].map((row, idx) => {
        const selectedIng = allIngredients.find(i => i.id === row.ingredient_id || i.uuid === row.ingredient_id);
        const resolvedUnit = row.unit || selectedIng?.unit || placeholderQty;
        
        return (
          <div className="formulator-row" key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <select 
                value={row.ingredient_id} 
                onChange={e => updateRow(categoryKey, idx, 'ingredient_id', e.target.value)}
                style={{ height: '36px', fontSize: '12px' }}
              >
                <option value="">-- Select {title} --</option>
                {optionsList.map(i => <option key={i.id} value={i.id}>{i.name} {i.unit ? `(${i.unit})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="number" 
                  value={row.quantity} 
                  onChange={e => updateRow(categoryKey, idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                  style={{ height: '36px', paddingRight: '36px', fontSize: '12px', width: '100%' }}
                />
                <span style={{ position: 'absolute', right: '8px', fontSize: '10px', fontWeight: 600, color: '#999', pointerEvents: 'none' }}>
                  {resolvedUnit}
                </span>
              </div>
            </div>
            {formData[categoryKey].length > 1 && (
              <button className="rb-btn-sm ghost" onClick={() => removeRow(categoryKey, idx)} style={{ color: '#ef4444', padding: '6px', border: 'none', background: 'transparent' }} title="Remove item">
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="beverage-formulator">
      <div className="formulator-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4>Formulation: {recipe.name}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: formData.isActive ? '#16A34A' : '#6B7280' }}>
            {formData.isActive ? 'Active on D2C/Kiosk' : 'Inactive'}
          </label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="formulator-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          {renderSection('Concentrate Base', 'concentrates', concentratesList, 'ml')}
          <div style={{ height: '16px' }} />
          {renderSection('Syrups & Sweeteners', 'sweeteners', sweetenersList, 'ml/g')}
        </div>
        <div>
          {renderSection('Milk & Cream Bases', 'milks', milksList, 'ml')}
          <div style={{ height: '16px' }} />
          {renderSection('Toppings & Ice', 'toppings', toppingsList, 'g/pcs')}
        </div>
        
        {/* Remarks */}
        <div className="formulator-row full-width" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
          <div className="form-group" style={{ width: '100%' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Remarks / Formulation Notes</label>
            <input 
              type="text" 
              value={formData.remarks} 
              onChange={e => setFormData({...formData, remarks: e.target.value})}
              placeholder="e.g. Fixed menu, serve cold"
              className="rb-input-sm"
              style={{ width: '100%', height: '36px', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>

      <div className="formulator-actions">
        <button className="rb-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="rb-btn-sm primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Formulation'}
        </button>
      </div>
    </div>
  );
};

export default BeverageFormulator;
