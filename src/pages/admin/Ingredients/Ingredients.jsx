import React, { useState, useEffect, useMemo } from 'react';
import './Ingredients.css';
import Button from '../../../components/Button/Button';
import { recipeService } from '../../../services/recipes';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const Ingredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'ml',
    cost_per_unit: 0,
    low_stock_threshold: 100,
    critical_stock_threshold: 20,
    is_active: true
  });

  const categories = ['all', 'Beans', 'Dairy/Alt', 'Syrups', 'Add-ons', 'Packaging'];

  // Helper to dynamically categorise based on name
  const getCategoryByName = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('bean') || n.includes('roast') || n.includes('coffee')) return 'Beans';
    if (n.includes('milk') || n.includes('dairy') || n.includes('cream')) return 'Dairy/Alt';
    if (n.includes('syrup') || n.includes('flavor') || n.includes('sugar')) return 'Syrups';
    if (n.includes('cup') || n.includes('lid') || n.includes('straw') || n.includes('pack')) return 'Packaging';
    return 'Add-ons';
  };

  // Helper to guess supplier
  const getSupplierByName = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('bean') || n.includes('roast')) return 'Coorg Estates';
    if (n.includes('oat')) return 'Oatly India';
    if (n.includes('syrup') || n.includes('flavor')) return 'Monin Syrups';
    return 'Generic B2B Supplier';
  };

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const response = await recipeService.getAll();
      setIngredients(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load ingredients: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    return (Array.isArray(ingredients) ? ingredients : []).filter(item => {
      const category = getCategoryByName(item.name);
      const supplier = getSupplierByName(item.name);
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ 
      name: '', 
      unit: 'ml', 
      cost_per_unit: 0, 
      low_stock_threshold: 100, 
      critical_stock_threshold: 20, 
      is_active: true 
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit || 'ml',
      cost_per_unit: item.cost_per_unit || 0,
      low_stock_threshold: item.low_stock_threshold || 100,
      critical_stock_threshold: item.critical_stock_threshold || 20,
      is_active: item.is_active === 1 || item.is_active === true
    });
    setShowModal(true);
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await recipeService.deleteIngredient(uuid);
        toast.success('Ingredient deleted successfully');
        loadIngredients();
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
      <div className="view-header">
        <div>
          <h2 className="section-title">Ingredients & Raw Materials</h2>
          <p className="section-subtitle">Manage costs, supplier mapping, and add-on pricing</p>
        </div>
        <Button variant="primary" onClick={openAddModal}>+ Add Ingredient</Button>
      </div>

      <div className="ingredients-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ingredients-search-input"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      <div className="ingredients-table-container ">
        <table className="ingredients-table">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Cost (₹)</th>
              <th>Thresholds (Low/Crit)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No ingredients found.</td></tr>
            ) : (
              filteredIngredients.map(item => {
                const category = getCategoryByName(item.name);
                const supplier = getSupplierByName(item.name);
                const isActive = item.is_active === 1 || item.is_active === true;
                
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="ingredient-name-cell">
                        <strong>{item.name}</strong>
                        <span className="ingredient-id">{item.uuid || item.id}</span>
                      </div>
                    </td>
                    <td><span className="category-tag">{category}</span></td>
                    <td>{supplier}</td>
                    <td>{formatCurrency(item.cost_per_unit || 0)} <span className="unit-text">/{item.unit}</span></td>
                    <td>
                      <span className="threshold-levels">
                        {item.low_stock_threshold || 100} / {item.critical_stock_threshold || 20} {item.unit}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn-sm outline" onClick={() => openEditModal(item)}>Edit</button>
                        <button className="action-btn-sm outline danger" onClick={() => handleDelete(item.uuid || item.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content ingredients-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="ingredients-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Ingredient Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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

              <div className="modal-footer">
                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button variant="primary" type="submit">{editingItem ? 'Save Changes' : 'Create Ingredient'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingredients;
