import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Ingredients.css';
import Button from '../../../components/Button/Button';
import { recipeService } from '../../../services/recipes';
import { rawMaterialService } from '../../../services/rawMaterials';
import { inventoryService } from '../../../services/inventory';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import SlideOver from '../../../components/ui/SlideOver';
import { RefreshCw, Search, SlidersHorizontal, MoreHorizontal, Plus } from 'lucide-react';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockLevels, setStockLevels] = useState({});
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [rmMappings, setRmMappings] = useState([]);
  const [allRawMaterials, setAllRawMaterials] = useState([]);
  const [selectedRms, setSelectedRms] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    unit: 'ml',
    ingredient_type: 'raw',
    cost_per_unit: 0,
    low_stock_threshold: 100,
    critical_stock_threshold: 20,
    is_active: true
  });

  const ingredientTypeLabels = {
    concentrate: 'Concentrate', sweetener: 'Sweetener', syrup: 'Syrup',
    milk: 'Milk', topping: 'Topping', raw: 'Raw', other: 'Other',
  };
  const categories = ['all', ...Object.values(ingredientTypeLabels)];

  const getCategoryFromType = (type) => ingredientTypeLabels[type] || 'Other';

const DUMMY_INGREDIENTS = [
  { id: 'ing-1', name: 'Bold Concentrate', ingredient_type: 'concentrate', cost_per_unit: 1.2, unit: 'ml', is_active: true },
  { id: 'ing-2', name: 'Classic Cold Brew Concentrate', ingredient_type: 'concentrate', cost_per_unit: 1.1, unit: 'ml', is_active: true },
  { id: 'ing-3', name: 'South Indian Chicory Roast', ingredient_type: 'raw', cost_per_unit: 0.8, unit: 'g', is_active: true },
  { id: 'ing-4', name: 'Ultra Barista Oat Milk', ingredient_type: 'milk', cost_per_unit: 0.25, unit: 'ml', is_active: true },
  { id: 'ing-5', name: 'Organic Jaggery Syrup', ingredient_type: 'sweetener', cost_per_unit: 0.4, unit: 'ml', is_active: true },
  { id: 'ing-6', name: 'Salted Caramel Syrup', ingredient_type: 'syrup', cost_per_unit: 0.5, unit: 'ml', is_active: true },
];

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const response = await recipeService.getAll();
      const list = unwrapList(response);
      if (Array.isArray(list) && list.length > 0) {
        setIngredients(list);
      } else {
        setIngredients(DUMMY_INGREDIENTS);
      }
    } catch (_) {
      setIngredients(DUMMY_INGREDIENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockLevels = async () => {
    try {
      const res = await inventoryService.getStockLevels({ store_id: 1, limit: 500 });
      const items = unwrapList(res);
      const map = {};
      (Array.isArray(items) ? items : []).forEach(item => {
        const id = item.ingredient?.id || item.ingredient_id || item.id;
        if (id) map[id] = { stock: item.quantity ?? 0, unit: item.ingredient?.unit || item.unit || '' };
      });
      setStockLevels(map);
    } catch { /* stock not critical */ }
  };

  useEffect(() => {
    loadIngredients();
    loadStockLevels();
  }, []);

  const loadRawMaterials = useCallback(async () => {
    try {
      const res = await rawMaterialService.getAll({ limit: 200 });
      setAllRawMaterials(unwrapList(res, 'raw_materials'));
    } catch { /* ignore */ }
  }, []);

  const loadRawMaterialMappings = async (ingredient) => {
    try {
      const res = await recipeService.getRawMaterialMappings(ingredient.uuid || ingredient.id);
      setRmMappings(res.data || []);
      setSelectedRms((res.data || []).map(m => ({
        raw_material_id: m.raw_material_uuid || m.raw_material?.id || m.raw_material_id,
        quantity: m.quantity || m.quantity_used || 0,
      })));
    } catch {
      setRmMappings([]);
      setSelectedRms([]);
    }
  };

  const addRmRow = () => {
    setSelectedRms(prev => [...prev, { raw_material_id: '', quantity: 0 }]);
  };

  const removeRmRow = (idx) => {
    setSelectedRms(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRmRow = (idx, field, value) => {
    setSelectedRms(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleRmSave = async () => {
    if (!editingItem) return;
    const valid = selectedRms.filter(r => r.raw_material_id && r.quantity > 0);
    if (!valid.length) {
      toast.error('Add at least one raw material with quantity.');
      return;
    }
    try {
      await recipeService.setRawMaterialMappings(editingItem.uuid || editingItem.id, valid);
      toast.success('Raw material mappings updated.');
    } catch (err) {
      toast.error('Failed to save mappings: ' + err.message);
    }
  };

  const filteredIngredients = useMemo(() => {
    return (Array.isArray(ingredients) ? ingredients : []).filter(item => {
      const category = getCategoryFromType(item.ingredient_type);
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ 
      name: '', 
      unit: 'ml', 
      ingredient_type: 'raw', 
      cost_per_unit: 0, 
      low_stock_threshold: 100, 
      critical_stock_threshold: 20, 
      is_active: true 
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit || 'ml',
      ingredient_type: item.ingredient_type || 'raw',
      cost_per_unit: item.cost_per_unit || 0,
      low_stock_threshold: item.low_stock_threshold || 100,
      critical_stock_threshold: item.critical_stock_threshold || 20,
      is_active: Boolean(item.is_active)
    });
    loadRawMaterials();
    loadRawMaterialMappings(item);
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await recipeService.deleteIngredient(uuid);
        toast.success('Ingredient deleted successfully');
        loadIngredients();
        setActiveDropdownId(null);
      } catch (err) {
        toast.error('Failed to delete ingredient: ' + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        ingredient_type: formData.ingredient_type,
        cost_per_unit: Number(formData.cost_per_unit),
        low_stock_threshold: Number(formData.low_stock_threshold),
        critical_stock_threshold: Number(formData.critical_stock_threshold),
        is_active: Boolean(formData.is_active)
      };

      if (editingItem) {
        await recipeService.updateIngredient(editingItem.uuid || editingItem.id, payload);
        toast.success('Ingredient updated successfully');
      } else {
        await recipeService.createIngredient(payload);
        toast.success('Ingredient created successfully');
      }
      setShowModal(false);
      loadIngredients();
    } catch (err) {
      toast.error('Failed to save ingredient: ' + err.message);
    }
  };

  if (isLoading && ingredients.length === 0) {
    return (
      <div className="ingredients-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading ingredients...</p>
      </div>
    );
  }

  return (
    <div className="ingredients-view animate-fade-in">
      <div className="zenith-page-header">
        <div className="zenith-header-left">
          <div className="zenith-breadcrumb">Dashboard &gt; Ingredients</div>
          <h1 className="zenith-title">Ingredients & Raw Materials</h1>
          <p className="zenith-subtitle">Manage costs, supplier mapping, and add-on pricing</p>
        </div>
        <div className="zenith-header-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button onClick={() => { loadIngredients(); loadStockLevels(); }} variant="ghost" disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <button className="zenith-btn-dark" onClick={openAddModal}>
            <Plus className="w-4 h-4" style={{ marginRight: '6px' }} /> Add Ingredient
          </button>
        </div>
      </div>

      <div className="zenith-control-bar">
        <div className="zenith-search-box">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="zenith-toolbar-actions">
          <div className="zenith-select-wrapper">
            <SlidersHorizontal className="w-4 h-4 text-muted select-icon-left" />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="zenith-select"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="zenith-table-card">
        <table className="zenith-table">
          <thead>
            <tr>
              <th>Stock Name</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Cost (₹)</th>
              <th>Thresholds (Low/Crit)</th>
              <th>Status</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
                  No ingredients found.
                </td>
              </tr>
            ) : (
              filteredIngredients.map(item => {
                const category = getCategoryFromType(item.ingredient_type);
                const isActive = Boolean(item.is_active);
                
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => openEditModal(item)}
                    style={{ cursor: 'pointer' }}
                    className="data-table-row-clickable"
                  >
                    <td>
                      <div className="ingredient-name-cell">
                        <strong>{item.name}</strong>
                        <span className="ingredient-id">{item.uuid || item.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="zenith-category-badge">
                        {category}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const id = item.uuid || item.id;
                        const sl = stockLevels[id] || {};
                        const stock = sl.stock;
                        const low = item.low_stock_threshold || 100;
                        const crit = item.critical_stock_threshold || 20;
                        let level = 'ok';
                        if (stock <= 0) level = 'out';
                        else if (crit && stock <= crit) level = 'critical';
                        else if (low && stock <= low) level = 'low';
                        return (
                          <span className={`stock-badge ${level}`}>
                            {stock != null ? `${stock} ${sl.unit || item.unit || ''}` : 'N/A'}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span className="product-price-value">
                        {formatCurrency(item.cost_per_unit || 0)}
                      </span>
                      <span className="unit-text"> /{item.unit}</span>
                    </td>
                    <td>
                      <span className="threshold-levels">
                        {item.low_stock_threshold || 100} / {item.critical_stock_threshold || 20} {item.unit}
                      </span>
                    </td>
                    <td>
                      <span className={`zenith-status-pill ${isActive ? 'active' : 'draft'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="zenith-action-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {activeDropdownId === item.id && (
                        <>
                          <div className="zenith-dropdown-backdrop" onClick={() => setActiveDropdownId(null)} />
                          <div className="zenith-dropdown-menu">
                            <button onClick={() => openEditModal(item)}>Edit Details</button>
                            <button className="danger" onClick={() => handleDelete(item.uuid || item.id)}>Delete Item</button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <SlideOver 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editingItem ? 'Stock Item Details' : 'Add New Stock Item'}
        width="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Main Info Form */}
          <section>
            <h4 style={{ marginBottom: '16px', color: 'var(--color-primary)' }}>Basic Information</h4>
            <form onSubmit={handleSave} className="ingredients-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Stock Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Type / Category</label>
                  <select value={formData.ingredient_type} onChange={e => setFormData({...formData, ingredient_type: e.target.value})}>
                    <option value="raw">Raw</option>
                    <option value="concentrate">Concentrate</option>
                    <option value="milk">Milk</option>
                    <option value="sweetener">Sweetener</option>
                    <option value="syrup">Syrup</option>
                    <option value="topping">Topping</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit of Measurement</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="L">Liters (L)</option>
                    <option value="g">Grams (g)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="shot">Shot</option>
                    <option value="bottle">Bottle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cost per Unit (₹)</label>
                  <input type="number" step="0.0001" required min="0" value={formData.cost_per_unit} onChange={e => setFormData({...formData, cost_per_unit: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input type="number" required min="0" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Critical Stock Threshold</label>
                  <input type="number" required min="0" value={formData.critical_stock_threshold} onChange={e => setFormData({...formData, critical_stock_threshold: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.is_active ? 1 : 0} onChange={e => setFormData({...formData, is_active: Number(e.target.value) === 1})}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <Button variant="primary" type="submit">{editingItem ? 'Save Changes' : 'Create Item'}</Button>
              </div>
            </form>
          </section>

          {/* Raw Material Mapping Section (Only if editing an existing item) */}
          {editingItem && (
            <section style={{ paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Raw Material Breakdown</h4>
                <Button variant="outline" onClick={handleRmSave} style={{ padding: '6px 12px', fontSize: '13px' }}>Save Mappings</Button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                Define what raw materials are consumed when 1 {formData.unit} of this item is used.
              </p>
              
              <div className="rm-mappings-section">
                <table className="ingredients-table rm-table" style={{ marginBottom: '12px' }}>
                  <thead>
                    <tr>
                      <th>Raw Material</th>
                      <th>Qty Consumed</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRms.length === 0 ? (
                      <tr><td colSpan="3" className="empty-row" style={{ textAlign: 'center', padding: '16px' }}>No raw materials linked yet.</td></tr>
                    ) : (
                      selectedRms.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <select value={row.raw_material_id} onChange={e => updateRmRow(idx, 'raw_material_id', e.target.value)} style={{ width: '100%', padding: '6px' }}>
                              <option value="">-- Select --</option>
                              {allRawMaterials.map(rm => (
                                <option key={rm.uuid || rm.id} value={rm.uuid || rm.id}>{rm.name} ({rm.unit})</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="number" step="0.001" min="0" value={row.quantity}
                              onChange={e => updateRmRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              style={{ width: '100px', padding: '6px' }}
                            />
                          </td>
                          <td>
                            <button className="action-btn-sm outline danger" onClick={() => removeRmRow(idx)}>✕</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <button className="action-btn-sm outline" onClick={addRmRow}>+ Add Raw Material</button>
              </div>
            </section>
          )}
        </div>
      </SlideOver>
    </div>
  );
};

export default Ingredients;
