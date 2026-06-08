import React, { useState, useEffect, useMemo } from 'react';
import './Menu.css';
import Button from '../../../components/Button/Button';
import { productService } from '../../../services/products';
import { inventoryService } from '../../../services/inventory';
import { menuRecipeService } from '../../../services/menuRecipes';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../../hooks/useConfirmation';
import RecipeBuilder from '../RecipeBuilder/RecipeBuilder';
import Ingredients from '../Ingredients/Ingredients';
import { Search, Plus, MoreHorizontal, Download, Columns, SlidersHorizontal } from 'lucide-react';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [productsList, setProductsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [stockSummary, setStockSummary] = useState({ low: 0, out: 0 });
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    description: '',
    base_price: 0,
    is_active: 1,
    image_url: ''
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [recipesList, setRecipesList] = useState([]);

  const loadProductsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [pRes, cRes, rRes] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        menuRecipeService.list(),
      ]);
      setProductsList(unwrapList(pRes));
      setCategoriesList(unwrapList(cRes));
      setRecipesList(unwrapList(rRes));
    } catch (err) {
      toast.error('Failed to load menu products: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getLinkedRecipeName = (product) => {
    if (!product.recipe_id) return null;
    const recipe = recipesList.find(r => r.id === product.recipe_id || r.uuid === product.recipe_id);
    return recipe ? recipe.name : null;
  };

  const loadStockSummary = async () => {
    try {
      const res = await inventoryService.getAlertSummary();
      if (res?.data) setStockSummary({ low: res.data.low_count || 0, out: res.data.out_count || 0 });
    } catch { /* optional */ }
  };

  useEffect(() => {
    loadProductsAndCategories();
    loadStockSummary();
  }, []);

  const categories = useMemo(() => {
    return ['all', ...categoriesList.map(c => c.name)];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category_name === categoryFilter;
      
      let matchesStatus = true;
      if (productStatusFilter === 'active') {
        matchesStatus = p.is_active === 1;
      } else if (productStatusFilter === 'draft') {
        matchesStatus = p.is_active === 0;
      } else if (productStatusFilter === 'archived') {
        matchesStatus = false; 
      }
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [productsList, searchQuery, categoryFilter, productStatusFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      category_id: categoriesList[0]?.id || 1, 
      description: '', 
      base_price: 0, 
      is_active: 1,
      image_url: ''
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      description: product.description || '',
      base_price: product.base_price || product.basePrice || 0,
      is_active: product.is_active ?? 1,
      image_url: product.image_url || ''
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const confirmAction = useConfirmation();

  const handleDelete = async (productId) => {
    const product = productsList.find(p => p.id === productId);
    const confirmed = await confirmAction({
      title: 'Delete Product',
      description: `You are about to permanently remove product "${product?.name || 'Item'}".`,
      type: 'level3',
      payload: {
        details: {
          name: product?.name,
          category: product?.category_name,
          price: formatCurrency(product?.base_price || product?.basePrice)
        }
      },
      isDestructive: true
    });

    if (confirmed) {
      try {
        await productService.delete(productId);
        toast.success('Product deleted successfully');
        loadProductsAndCategories();
        setActiveDropdownId(null);
      } catch (err) {
        toast.error('Failed to delete product: ' + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category_id: Number(formData.category_id),
        description: formData.description,
        base_price: Number(formData.base_price),
        is_active: Number(formData.is_active)
      };
      if (formData.image_url) {
        payload.image_url = formData.image_url;
      }

      const isPriceChanged = editingProduct && Number(formData.base_price) !== Number(editingProduct.base_price || editingProduct.basePrice || 0);
      if (isPriceChanged) {
        const confirmed = await confirmAction({
          title: 'Update Pricing',
          description: `Change ${editingProduct.name} price:`,
          type: 'level2',
          payload: {
            requireText: true,
            details: {
              original: formatCurrency(editingProduct.base_price || editingProduct.basePrice || 0),
              new: formatCurrency(formData.base_price)
            }
          }
        });
        if (!confirmed) return;
      }

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.create(payload);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      loadProductsAndCategories();
    } catch (err) {
      toast.error('Failed to save product: ' + err.message);
    }
  };

  const toggleStatus = async (product) => {
    const newStatus = product.is_active ? 0 : 1;
    const confirmed = await confirmAction({
      title: 'Update Product Status',
      description: `Mark product "${product.name}" as ${newStatus ? 'Active' : 'Inactive'}?`,
      type: 'level1',
      payload: {
        details: {
          name: product.name,
          current: product.is_active ? 'Active' : 'Inactive',
          target: newStatus ? 'Active' : 'Inactive'
        }
      }
    });

    if (confirmed) {
      try {
        await productService.update(product.id, { is_active: newStatus });
        toast.success(`Product marked as ${newStatus ? 'Active' : 'Inactive'}`);
        loadProductsAndCategories();
        setActiveDropdownId(null);
      } catch (err) {
        toast.error('Failed to toggle status: ' + err.message);
      }
    }
  };

  if (isLoading && productsList.length === 0) {
    return (
      <div className="menu-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading products list...</p>
      </div>
    );
  }

  return (
    <div className="menu-view animate-fade-in">
      <div className="settings-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`settings-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          id="menu-tab-products"
        >
          Products
        </button>
        <button
          className={`settings-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
          id="menu-tab-recipes"
        >
          Recipe Builder
        </button>
        <button
          className={`settings-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
          id="menu-tab-ingredients"
        >
          Ingredients
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          {stockSummary.low > 0 && (
            <div className="alert-banner warning">
              ⚠️ {stockSummary.low} ingredient{stockSummary.low > 1 ? 's' : ''} low on stock.&nbsp;
              {stockSummary.out > 0 && <>{stockSummary.out} out of stock. </>}
              <a href="/admin/inventory" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View Inventory</a>
            </div>
          )}
          
          <div className="zenith-page-header">
            <div className="zenith-header-left">
              <div className="zenith-breadcrumb">Dashboard &gt; Products</div>
              <h1 className="zenith-title">Products</h1>
              <p className="zenith-subtitle">Browse and manage your product catalog.</p>
            </div>
            <div className="zenith-header-right">
              <button className="zenith-btn-dark" onClick={openAddModal}>
                <Plus className="w-4 h-4" style={{ marginRight: '6px' }} /> Add Product
              </button>
            </div>
          </div>

          <div className="zenith-filters-row">
            {['all', 'active', 'draft', 'archived'].map(tab => (
              <button 
                key={tab} 
                className={`zenith-filter-pill ${productStatusFilter === tab ? 'active' : ''}`}
                onClick={() => setProductStatusFilter(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="zenith-search-toolbar">
            <div className="zenith-search-box">
              <Search className="w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search products..."
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
                      {c === 'all' ? 'Category' : c}
                    </option>
                  ))}
                </select>
              </div>

              <button className="zenith-btn-outline">
                <Columns className="w-4 h-4" style={{ marginRight: '6px' }} /> Columns
              </button>
              
              <button className="zenith-btn-outline">
                <Download className="w-4 h-4" style={{ marginRight: '6px' }} /> Export
              </button>
            </div>
          </div>

          <div className="zenith-table-card">
            <table className="zenith-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" className="zenith-checkbox" />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Recipe</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-row" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <input type="checkbox" className="zenith-checkbox" />
                      </td>
                      <td>
                        <div className="product-info-cell">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="product-thumb" />
                          ) : (
                            <div className="product-thumb placeholder">☕</div>
                          )}
                          <div className="product-text-details">
                            <span className="product-name">{product.name}</span>
                            <span className="product-desc">{product.description || 'No description provided.'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                          <span className="zenith-category-badge">
                            {product.category_name || 'Uncategorized'}
                          </span>
                        </td>
                        <td>
                          <span className="product-recipe-name">
                            {getLinkedRecipeName(product) || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`zenith-status-pill ${product.is_active ? 'active' : 'draft'}`}>
                            {product.is_active ? 'Active' : 'Draft'}
                          </span>
                        </td>
                      <td>
                        <span className="product-stock-count">
                          {product.stock_quantity ?? 999}
                        </span>
                      </td>
                      <td>
                        <span className="product-price-value">
                          {formatCurrency(product.base_price || product.basePrice)}
                        </span>
                      </td>
                      <td>
                        <span className="product-date">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Jan 15, 2026'}
                        </span>
                      </td>
                      <td style={{ position: 'relative' }}>
                        <button 
                          className="zenith-action-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(activeDropdownId === product.id ? null : product.id);
                          }}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {activeDropdownId === product.id && (
                          <>
                            <div className="zenith-dropdown-backdrop" onClick={() => setActiveDropdownId(null)} />
                            <div className="zenith-dropdown-menu">
                              <button onClick={() => openEditModal(product)}>Edit Details</button>
                              <button onClick={() => toggleStatus(product)}>
                                {product.is_active ? 'Mark Inactive' : 'Mark Active'}
                              </button>
                              <button className="danger" onClick={() => handleDelete(product.id)}>Delete Product</button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'recipes' && <RecipeBuilder />}

      {activeTab === 'ingredients' && <Ingredients />}

      {/* Create/Edit Modal */}
      {showModal && activeTab === 'products' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content menu-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="menu-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Base Price (₹)</label>
                  <input type="number" required min="0" value={formData.base_price} onChange={e => setFormData({...formData, base_price: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.is_active} onChange={e => setFormData({...formData, is_active: Number(e.target.value)})}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button variant="primary" type="submit">{editingProduct ? 'Save Changes' : 'Create Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;

