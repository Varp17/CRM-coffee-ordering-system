import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { unwrapList } from '../../../../utils/apiResponse';
import Button from '../../../../components/Button/Button';
import toast from 'react-hot-toast';
import { Plus, Trash, ChevronRight, ChevronLeft } from 'lucide-react';

const EMPTY_RM = { raw_material_id: '', quantity_used: '' };

const BatchWizard = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [brewRecipes, setBrewRecipes] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]); // FIX-04: raw materials, not ingredients
  const [loadingData, setLoadingData] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    brew_recipe_id: '',
    status: 'completed',
    quantity_ml: '',
    raw_materials: [{ ...EMPTY_RM }],
    ph: '', tds: '', brix: '', yield_ml: '',
    produced_at: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, brRes, rmRes] = await Promise.all([
          api.get('/products?limit=200'),
          api.get('/recipes/brew?limit=200'),
          api.get('/raw-materials?limit=200'), // FIX-04: raw materials endpoint
        ]);
        const allProducts = unwrapList(pRes);
        // FIX-03: filter by recipe_id presence — that's the real production signal
        const productionProducts = allProducts.filter(p =>
          p.recipe_id != null ||
          p.product_type === 'concentrate' ||
          p.product_type === 'production'
        );
        setProducts(productionProducts.length > 0 ? productionProducts : allProducts);
        setBrewRecipes(unwrapList(brRes));
        setRawMaterials(unwrapList(rmRes));
      } catch {
        toast.error('Failed to load required data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const prefillRawMaterialsFromRecipe = async (recipeId) => {
    if (!recipeId) return;
    setLoadingRecipe(true);
    try {
      const res = await api.get(`/recipes/brew/${recipeId}`);
      const recipe = res?.data?.data || res?.data || res;
      const rms = recipe?.raw_materials || [];
      if (rms.length > 0) {
        // FIX-04: map to raw_material_id (not ingredient_id)
        const prefilled = rms.map(rm => ({
          raw_material_id: String(rm.raw_material_id || rm.id || ''),
          quantity_used: String(rm.quantity || rm.quantity_used || ''),
        }));
        setForm(prev => ({ ...prev, raw_materials: prefilled }));
        toast.success(`Pre-filled ${prefilled.length} raw material(s) from recipe`);
      }
    } catch {
      // silently fail — user fills manually
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleProductSelect = async (id) => {
    const product = products.find(p => String(p._pk || p.id) === String(id));
    let newBrewRecipeId = '';

    if (product?.recipe_id) {
      const linked = brewRecipes.find(r => String(r.id) === String(product.recipe_id));
      if (linked) newBrewRecipeId = String(product.recipe_id);
    }

    // FIX-08: always reset raw_materials before prefill
    setForm(prev => ({
      ...prev,
      product_id: id,
      brew_recipe_id: newBrewRecipeId,
      raw_materials: [{ ...EMPTY_RM }],
    }));

    if (newBrewRecipeId) {
      await prefillRawMaterialsFromRecipe(newBrewRecipeId);
    }
  };

  const handleRecipeSelect = async (e) => {
    const id = e.target.value;
    // FIX-08: reset raw_materials before prefill
    setForm(prev => ({ ...prev, brew_recipe_id: id, raw_materials: [{ ...EMPTY_RM }] }));
    await prefillRawMaterialsFromRecipe(id);
  };

  const nextStep = () => {
    if (step === 1 && !form.product_id) return toast.error('Please select a product');
    if (step === 1 && !form.quantity_ml) return toast.error('Please specify target volume');
    if (step === 2) {
      const valid = form.raw_materials.filter(rm => rm.raw_material_id && rm.quantity_used);
      if (valid.length === 0) return toast.error('Please add at least one raw material');
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    // FIX-04: backend validator expects ingredient_id — raw material IDs ARE ingredient IDs
    // in this system (raw_materials table rows are referenced by ingredient_id in production)
    const validRM = form.raw_materials
      .filter(rm => rm.raw_material_id && rm.quantity_used)
      .map(rm => ({
        ingredient_id: Number(rm.raw_material_id),
        quantity_used: Number(rm.quantity_used),
      }));

    const payload = {
      product_id: Number(form.product_id),
      quantity_ml: Number(form.quantity_ml),
      status: form.status,
      raw_materials: validRM,
      produced_at: form.produced_at ? new Date(form.produced_at).toISOString() : undefined,
      notes: form.notes || undefined,
    };
    if (form.brew_recipe_id) payload.brew_recipe_id = Number(form.brew_recipe_id);
    if (form.ph)       payload.ph_level          = Number(form.ph);
    if (form.tds)      payload.tds_level         = Number(form.tds);
    if (form.brix)     payload.brix_level        = Number(form.brix);
    if (form.yield_ml) payload.yield_percentage  = Number(form.yield_ml);

    try {
      await api.post('/production/batches', payload);
      toast.success('Batch created successfully');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create batch: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddRM    = () => setForm(prev => ({ ...prev, raw_materials: [...prev.raw_materials, { ...EMPTY_RM }] }));
  const handleRemoveRM = (idx) => setForm(prev => ({ ...prev, raw_materials: prev.raw_materials.filter((_, i) => i !== idx) }));
  const handleRMChange = (idx, field, val) => {
    setForm(prev => {
      const list = [...prev.raw_materials];
      list[idx] = { ...list[idx], [field]: val };
      return { ...prev, raw_materials: list };
    });
  };

  const inp = (style = {}) => ({ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%', ...style });

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-modal" onClick={e => e.stopPropagation()}>
        <div className="wizard-header">
          <h2 style={{ margin: 0, fontSize: '20px' }}>Create Production Batch</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>

        <div className="wizard-steps">
          {[1,2,3,4].map(n => (
            <div key={n} className={`wizard-step ${step >= n ? 'active' : ''} ${step > n ? 'completed' : ''}`} />
          ))}
        </div>

        <div className="wizard-body">
          {loadingData ? <p>Loading setup data...</p> : (
            <>
              {step === 1 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 1: Core Details</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Select the product and target volume.</p>

                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Finished Product *</label>
                    <div className="wizard-product-select">
                      {products.map(p => (
                        <div
                          key={p._pk || p.id}
                          className={`product-card-select ${form.product_id === String(p._pk || p.id) ? 'selected' : ''}`}
                          onClick={() => handleProductSelect(String(p._pk || p.id))}
                        >
                          <div style={{ fontWeight: '500' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.product_type}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: '24px' }}>
                    <div className="form-group">
                      <label>Target Volume (ml) *</label>
                      <input type="number" required min="1" value={form.quantity_ml}
                        onChange={e => setForm(p => ({ ...p, quantity_ml: e.target.value }))}
                        style={inp()} />
                    </div>
                    <div className="form-group">
                      <label>Brew Recipe</label>
                      <select value={form.brew_recipe_id} onChange={handleRecipeSelect} style={inp()}>
                        <option value="">-- Manual Process --</option>
                        {brewRecipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 2: Raw Materials</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Log exact material consumption to deduct from warehouse stock.</p>
                  {loadingRecipe && <p style={{ color: '#C67C4E', fontSize: '13px', marginTop: '8px' }}>⏳ Loading recipe raw materials…</p>}

                  <div style={{ marginTop: '24px' }}>
                    {form.raw_materials.map((rm, idx) => (
                      <div key={idx} className="rm-wizard-row">
                        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px' }}>Raw Material</label>
                          <select required value={rm.raw_material_id}
                            onChange={e => handleRMChange(idx, 'raw_material_id', e.target.value)}
                            style={inp()}>
                            <option value="">Select Raw Material...</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>{rm.name} ({rm.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
                          <label style={{ fontSize: '12px' }}>Quantity</label>
                          <input type="number" required min="0.01" step="0.01"
                            value={rm.quantity_used}
                            onChange={e => handleRMChange(idx, 'quantity_used', e.target.value)}
                            style={inp()} />
                        </div>
                        {form.raw_materials.length > 1 && (
                          <Button variant="ghost" onClick={() => handleRemoveRM(idx)} style={{ color: '#EF4444', padding: '12px' }}>
                            <Trash size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" onClick={handleAddRM} style={{ color: '#6F4E37' }}>
                      <Plus size={16} style={{ marginRight: '8px' }} /> Add Raw Material
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 3: Quality Control & Status</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Log QC metrics to trigger auto-quarantine if bounds are exceeded.</p>

                  <div className="form-grid" style={{ marginTop: '24px' }}>
                    <div className="form-group">
                      <label>Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inp()}>
                        <option value="draft">Draft</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="quarantined">Quarantined (Hold)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Produced At</label>
                      <input type="datetime-local" value={form.produced_at}
                        onChange={e => setForm(p => ({ ...p, produced_at: e.target.value }))} style={inp()} />
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: '24px', background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                    {[['ph','pH Level','5.18'],['tds','TDS','3.37'],['brix','Brix (°Bx)','4.2'],['yield_ml','Actual Yield (ml)','18000']].map(([key, label, ph]) => (
                      <div key={key} className="form-group">
                        <label>{label}</label>
                        <input type="number" step={key === 'yield_ml' ? '1' : '0.01'} value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={ph} style={inp()} />
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Notes</label>
                    <textarea rows="3" value={form.notes}
                      onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      style={inp()} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 4: Review</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Review before submitting. Raw material stock will be deducted on completion.</p>

                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', marginTop: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[
                        ['Product', products.find(p => String(p._pk || p.id) === form.product_id)?.name],
                        ['Target Volume', `${Number(form.quantity_ml).toLocaleString()} ml`],
                        ['Status', form.status.replace('_', ' ')],
                        ['Raw Materials', `${form.raw_materials.filter(r => r.raw_material_id).length} items`],
                        ...(form.brix ? [['Brix', form.brix + ' °Bx']] : []),
                        ...(form.ph ? [['pH', form.ph]] : []),
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{label}</div>
                          <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="wizard-footer">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
            {step === 1 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
          </Button>
          {step < 4
            ? <Button variant="primary" onClick={nextStep}>Next <ChevronRight size={16} /></Button>
            : <Button variant="primary" onClick={handleSubmit}>Submit Batch</Button>
          }
        </div>
      </div>
    </div>
  );
};

export default BatchWizard;
