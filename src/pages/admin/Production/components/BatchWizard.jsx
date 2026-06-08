import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';
import { unwrapList } from '../../../../utils/apiResponse';
import Button from '../../../../components/Button/Button';
import toast from 'react-hot-toast';
import { Plus, Trash, ChevronRight, ChevronLeft } from 'lucide-react';

const BatchWizard = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [brewRecipes, setBrewRecipes] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [form, setForm] = useState({
    product_id: '',
    brew_recipe_id: '',
    status: 'completed',
    quantity_ml: '',
    raw_materials: [{ ingredient_id: '', quantity_used: '' }],
    ph: '',
    tds: '',
    brix: '',
    yield_ml: '',
    produced_at: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, brRes, ingRes] = await Promise.all([
          api.get('/products?limit=200'),
          api.get('/brew-recipes?limit=200'),
          api.get('/ingredients?limit=200'),
        ]);
        setProducts(unwrapList(pRes));
        setBrewRecipes(unwrapList(brRes));
        setIngredientsList(unwrapList(ingRes));
      } catch (err) {
        toast.error('Failed to load required data');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleProductSelect = (id) => {
    setForm({ ...form, product_id: id });
  };

  const nextStep = () => {
    if (step === 1 && !form.product_id) return toast.error('Please select a product');
    if (step === 1 && !form.quantity_ml) return toast.error('Please specify target volume');
    if (step === 2) {
      const validRM = form.raw_materials.filter(rm => rm.ingredient_id && rm.quantity_used);
      if (validRM.length === 0) return toast.error('Please add at least one raw material');
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const validRM = form.raw_materials
      .filter(rm => rm.ingredient_id && rm.quantity_used)
      .map(rm => ({
        ingredient_id: Number(rm.ingredient_id),
        quantity_used: Number(rm.quantity_used)
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
    if (form.ph) payload.ph_level = Number(form.ph);
    if (form.tds) payload.tds_level = Number(form.tds);
    if (form.brix) payload.brix_level = Number(form.brix);
    if (form.yield_ml) payload.yield_percentage = Number(form.yield_ml);

    try {
      await api.post('/production/batches', payload);
      toast.success('Batch created successfully');
      onSuccess();
    } catch (err) {
      toast.error('Failed to create batch: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddRM = () => {
    setForm({
      ...form,
      raw_materials: [...form.raw_materials, { ingredient_id: '', quantity_used: '' }]
    });
  };

  const handleRemoveRM = (idx) => {
    const list = [...form.raw_materials];
    list.splice(idx, 1);
    setForm({ ...form, raw_materials: list });
  };

  const handleRMChange = (idx, field, val) => {
    const list = [...form.raw_materials];
    list[idx][field] = val;
    setForm({ ...form, raw_materials: list });
  };

  // Recipe selection auto-fills RM if possible
  const handleRecipeSelect = (e) => {
    const id = e.target.value;
    setForm({ ...form, brew_recipe_id: id });
    if (id) {
      // In a real scenario, we might fetch recipe details and pre-fill raw_materials
      // For now, we just select it.
    }
  };

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-modal" onClick={e => e.stopPropagation()}>
        <div className="wizard-header">
          <h2 style={{ margin: 0, fontSize: '20px' }}>Create Production Batch</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        
        <div className="wizard-steps">
          <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}></div>
          <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}></div>
          <div className={`wizard-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}></div>
          <div className={`wizard-step ${step >= 4 ? 'active' : ''}`}></div>
        </div>

        <div className="wizard-body">
          {loadingData ? (
            <p>Loading setup data...</p>
          ) : (
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
                          key={p.id} 
                          className={`product-card-select ${form.product_id === String(p.id) ? 'selected' : ''}`}
                          onClick={() => handleProductSelect(String(p.id))}
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
                      <input 
                        type="number" 
                        required min="1" 
                        value={form.quantity_ml}
                        onChange={e => setForm({...form, quantity_ml: e.target.value})} 
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Brew Recipe</label>
                      <select 
                        value={form.brew_recipe_id} 
                        onChange={handleRecipeSelect}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                      >
                        <option value="">-- Manual Process --</option>
                        {brewRecipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 2: Raw Materials</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Log exact material consumption to deduct from central inventory.</p>
                  
                  <div style={{ marginTop: '24px' }}>
                    {form.raw_materials.map((rm, idx) => (
                      <div key={idx} className="rm-wizard-row">
                        <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px' }}>Ingredient</label>
                          <select
                            required
                            value={rm.ingredient_id}
                            onChange={e => handleRMChange(idx, 'ingredient_id', e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                          >
                            <option value="">Select Ingredient...</option>
                            {ingredientsList.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, width: '150px' }}>
                          <label style={{ fontSize: '12px' }}>Quantity</label>
                          <input
                            type="number"
                            required min="0.01" step="0.01"
                            value={rm.quantity_used}
                            onChange={e => handleRMChange(idx, 'quantity_used', e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                          />
                        </div>
                        {form.raw_materials.length > 1 && (
                          <Button variant="ghost" onClick={() => handleRemoveRM(idx)} style={{ color: '#EF4444', padding: '12px' }}>
                            <Trash size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" onClick={handleAddRM} style={{ color: '#6F4E37' }}>
                      <Plus size={16} style={{ marginRight: '8px' }}/> Add Ingredient Line
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
                      <select 
                        value={form.status} 
                        onChange={e => setForm({...form, status: e.target.value})}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                      >
                        <option value="draft">Draft</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="quarantined">Quarantined (Hold)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Produced At</label>
                      <input 
                        type="datetime-local" 
                        value={form.produced_at}
                        onChange={e => setForm({...form, produced_at: e.target.value})} 
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: '24px', background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                    <div className="form-group">
                      <label>pH Level</label>
                      <input type="number" step="0.01" value={form.ph} onChange={e => setForm({...form, ph: e.target.value})} placeholder="5.18" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}/>
                    </div>
                    <div className="form-group">
                      <label>TDS</label>
                      <input type="number" step="0.01" value={form.tds} onChange={e => setForm({...form, tds: e.target.value})} placeholder="3.37" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}/>
                    </div>
                    <div className="form-group">
                      <label>Brix (°Bx)</label>
                      <input type="number" step="0.1" value={form.brix} onChange={e => setForm({...form, brix: e.target.value})} placeholder="4.2" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}/>
                    </div>
                    <div className="form-group">
                      <label>Actual Yield (ml)</label>
                      <input type="number" step="1" value={form.yield_ml} onChange={e => setForm({...form, yield_ml: e.target.value})} placeholder="18000" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}/>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '24px' }}>
                    <label>Notes</label>
                    <textarea 
                      rows="3" 
                      value={form.notes} 
                      onChange={e => setForm({...form, notes: e.target.value})}
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="animate-fade-in">
                  <h3 style={{ marginTop: 0 }}>Step 4: Review</h3>
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>Please review the batch details before submitting. Central inventory will be deducted.</p>
                  
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', marginTop: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Product</div>
                        <div style={{ fontWeight: '500' }}>{products.find(p => String(p.id) === form.product_id)?.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Target Volume</div>
                        <div style={{ fontWeight: '500' }}>{Number(form.quantity_ml).toLocaleString()} ml</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Status</div>
                        <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{form.status.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>Raw Materials</div>
                        <div style={{ fontWeight: '500' }}>{form.raw_materials.filter(r => r.ingredient_id).length} items</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="wizard-footer">
          <Button variant="ghost" onClick={step === 1 ? onClose : prevStep}>
            {step === 1 ? 'Cancel' : <><ChevronLeft size={16} /> Back</>}
          </Button>
          
          {step < 4 ? (
            <Button variant="primary" onClick={nextStep}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit}>
              Submit Batch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchWizard;
