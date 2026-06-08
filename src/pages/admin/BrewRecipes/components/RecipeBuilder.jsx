import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save } from 'lucide-react';
import MaterialRow from './MaterialRow';
import LiveCostCard from './LiveCostCard';
import { productService } from '../../../../services/products';
import { rawMaterialService } from '../../../../services/rawMaterials';
import { brewRecipeService } from '../../../../services/brewRecipes';
import { unwrapList, unwrapObject } from '../../../../utils/apiResponse';
import toast from 'react-hot-toast';

const RecipeBuilder = ({ recipeId, onClose, onSave }) => {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [yieldMl, setYieldMl] = useState(35000); // Default 35L
  const [ph, setPh] = useState(5.0);
  const [tds, setTds] = useState(3.4);
  const [brix, setBrix] = useState(4.0);
  const [brewTime, setBrewTime] = useState(12);
  const [ratio, setRatio] = useState('1:8');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Selected raw materials list
  const [recipeRawMaterials, setRecipeRawMaterials] = useState([
    { raw_material_id: '', quantity: 0, unit: 'g', cost_per_unit: 0, name: '' }
  ]);

  // Load products and raw materials
  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.getAll({ limit: 100 }),
      rawMaterialService.getAll({ limit: 100 })
    ]).then(([prodRes, rmRes]) => {
      setProducts(unwrapList(prodRes));
      setRawMaterials(unwrapList(rmRes));
    }).catch(err => {
      toast.error('Failed to load dependency data: ' + err.message);
    }).finally(() => setLoading(false));
  }, []);

  // Load existing recipe data if in edit mode
  useEffect(() => {
    if (recipeId) {
      setLoading(true);
      brewRecipeService.getById(recipeId)
        .then(res => {
          const recipe = unwrapObject(res);
          if (recipe) {
            setName(recipe.name || '');
            setDescription(recipe.description || '');
            setProductId(recipe.product ? recipe.product.id : '');
            setYieldMl(recipe.expected_yield_ml || 0);
            setPh(recipe.expected_ph || 0);
            setTds(recipe.expected_tds || 0);
            setBrix(recipe.expected_brix || 0);
            setBrewTime(recipe.brew_time_hours || 0);
            setRatio(recipe.ratio_description || '');
            setNotes(recipe.notes || '');
            setIsActive(recipe.is_active ?? true);
            
            if (recipe.raw_materials && recipe.raw_materials.length > 0) {
              setRecipeRawMaterials(recipe.raw_materials.map(rm => ({
                raw_material_id: rm.raw_material_id || '',
                quantity: rm.quantity || 0,
                unit: rm.unit || 'g',
                cost_per_unit: rm.raw_material ? parseFloat(rm.raw_material.cost_per_unit || 0) : 0,
                name: rm.raw_material ? rm.raw_material.name : ''
              })));
            } else {
              setRecipeRawMaterials([{ raw_material_id: '', quantity: 0, unit: 'g', cost_per_unit: 0, name: '' }]);
            }
          }
        })
        .catch(err => {
          toast.error('Failed to load recipe details: ' + err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [recipeId]);

  // Compute live expected cost
  const liveExpectedCost = useMemo(() => {
    return recipeRawMaterials.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const costPerUnit = parseFloat(item.cost_per_unit) || 0;
      return sum + (quantity * costPerUnit);
    }, 0);
  }, [recipeRawMaterials]);

  const handleMaterialChange = (index, updatedItem) => {
    const nextList = [...recipeRawMaterials];
    nextList[index] = updatedItem;
    setRecipeRawMaterials(nextList);
  };

  const handleAddMaterial = () => {
    setRecipeRawMaterials([
      ...recipeRawMaterials,
      { raw_material_id: '', quantity: 0, unit: 'g', cost_per_unit: 0, name: '' }
    ]);
  };

  const handleRemoveMaterial = (index) => {
    const nextList = recipeRawMaterials.filter((_, i) => i !== index);
    if (nextList.length === 0) {
      setRecipeRawMaterials([{ raw_material_id: '', quantity: 0, unit: 'g', cost_per_unit: 0, name: '' }]);
    } else {
      setRecipeRawMaterials(nextList);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Recipe name is required.');
      return;
    }

    setSaving(true);
    const payload = {
      name,
      description,
      product_id: productId ? parseInt(productId, 10) : null,
      expected_yield_ml: parseFloat(yieldMl) || 0,
      expected_ph: parseFloat(ph) || null,
      expected_tds: parseFloat(tds) || null,
      expected_brix: parseFloat(brix) || null,
      brew_time_hours: parseFloat(brewTime) || null,
      ratio_description: ratio,
      notes,
      is_active: isActive,
      raw_materials: recipeRawMaterials
        .filter(rm => rm.raw_material_id !== '')
        .map(rm => ({
          raw_material_id: parseInt(rm.raw_material_id, 10),
          quantity: parseFloat(rm.quantity),
          unit: rm.unit
        }))
    };

    try {
      if (recipeId) {
        await brewRecipeService.update(recipeId, payload);
        toast.success('Brew recipe updated successfully!', { icon: '📝' });
      } else {
        await brewRecipeService.create(payload);
        toast.success('Brew recipe created successfully!', { icon: '☕' });
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save brew recipe: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{recipeId ? 'Edit Brew Recipe' : 'New Brew Recipe'}</h3>
          <button className="panel-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: '300px' }}>
            <span className="spinner" /> Loading builder...
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="recipe-builder-form-grid">
            <div className="builder-left-pane">
              <h4 className="pane-section-title">Recipe Specifications</h4>
              
              <div className="form-group-row">
                <div className="form-input-col">
                  <label className="field-lbl">Recipe Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cold Brew 50:50"
                    className="builder-input-field"
                  />
                </div>
                <div className="form-input-col">
                  <label className="field-lbl">Associated Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="builder-input-field"
                  >
                    <option value="">-- None --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-input-col">
                  <label className="field-lbl">Expected Yield (ML) *</label>
                  <input
                    type="number"
                    required
                    value={yieldMl}
                    onChange={(e) => setYieldMl(e.target.value)}
                    placeholder="e.g. 35000"
                    className="builder-input-field"
                  />
                </div>
                <div className="form-input-col">
                  <label className="field-lbl">Target pH</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="builder-input-field"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-input-col">
                  <label className="field-lbl">Target TDS (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                    placeholder="e.g. 3.4"
                    className="builder-input-field"
                  />
                </div>
                <div className="form-input-col">
                  <label className="field-lbl">Target Brix (°)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={brix}
                    onChange={(e) => setBrix(e.target.value)}
                    placeholder="e.g. 4.0"
                    className="builder-input-field"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-input-col">
                  <label className="field-lbl">Brew Time (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={brewTime}
                    onChange={(e) => setBrewTime(e.target.value)}
                    placeholder="e.g. 12"
                    className="builder-input-field"
                  />
                </div>
                <div className="form-input-col">
                  <label className="field-lbl">Brew Ratio</label>
                  <input
                    type="text"
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                    placeholder="e.g. 1:8"
                    className="builder-input-field"
                  />
                </div>
              </div>

              <div className="form-input-col full-width">
                <label className="field-lbl">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Recipe description..."
                  className="builder-input-field textarea"
                  rows={2}
                />
              </div>

              <div className="form-input-col full-width">
                <label className="field-lbl">Instructions / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or batch notes..."
                  className="builder-input-field textarea"
                  rows={2}
                />
              </div>

              <div className="form-checkbox-row">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="builder-checkbox"
                />
                <label htmlFor="isActive" className="checkbox-lbl">Recipe is Active</label>
              </div>
            </div>

            <div className="builder-right-pane">
              <h4 className="pane-section-title">Raw Materials Checklist</h4>
              
              <div className="materials-rows-container">
                {recipeRawMaterials.map((rm, i) => (
                  <MaterialRow
                    key={i}
                    index={i}
                    selectedMaterial={rm}
                    materialsList={rawMaterials}
                    onChange={handleMaterialChange}
                    onRemove={handleRemoveMaterial}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddMaterial}
                className="action-btn-sm outline add-material-btn"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Raw Material
              </button>

              <div style={{ marginTop: '20px' }}>
                <LiveCostCard
                  expectedCost={liveExpectedCost}
                  yieldMl={yieldMl}
                />
              </div>

              <div className="builder-actions-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="action-btn-sm primary flex-center-gap"
                  style={{ width: '100%' }}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RecipeBuilder;
