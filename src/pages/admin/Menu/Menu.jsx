import React, { useState, useEffect, useMemo } from 'react';
import './Menu.css';
import Button from '../../../components/Button/Button';
import { productService } from '../../../services/products';
import { inventoryService } from '../../../services/inventory';
import { menuRecipeService } from '../../../services/menuRecipes';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../../hooks/useConfirmation';
import MenuTab from '../Recipes/components/MenuTab';
import Ingredients from '../Ingredients/Ingredients';
import Inventory from '../Inventory/Inventory';
import { Search, Plus, MoreHorizontal, Download, Columns, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

const Menu = () => {
  const userRole = useAuthStore((state) => state.role);
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
    product_type: 'beverage',
    is_active: false,
    is_available_kiosk: true,
    is_available_d2c: false,
    is_available_admin: true,
    image_url: '',
    recipe_id: '',
    concentrate_type_id: ''
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [concentrateTypes, setConcentrateTypes] = useState([]);

  const loadProductsAndCategories = async () => {
    setIsLoading(true);
    const pPromise = productService.getAll().catch(err => {
      console.error('PRODUCT ERROR:', err);
      return null;
    });
    const cPromise = productService.getCategories().catch(() => null);
    const rPromise = menuRecipeService.list().catch(() => null);
    const ctPromise = api.get('/production/concentrate-types?limit=50').catch(() => null);
    const [pRes, cRes, rRes, ctRes] = await Promise.all([pPromise, cPromise, rPromise, ctPromise]);
    if (pRes) {
      const products = unwrapList(pRes);
      console.log('PRODUCTS LOADED:', products.length);
      console.log('PRODUCTS:', products);
      setProductsList(products);
    } else {
      toast.error('Failed to load products');
    }
    if (cRes) setCategoriesList(unwrapList(cRes));
    if (rRes) setRecipesList(unwrapList(rRes));
    if (ctRes) setConcentrateTypes(unwrapList(ctRes));
    setIsLoading(false);
  };

  const getLinkedRecipeName = (product) => {
    if (!product.recipe_id) return null;
    const recipe = recipesList.find(r => r._pk === product.recipe_id || r.id === product.recipe_id);
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
    return ['all', ...new Set(categoriesList.map(c => c.name))];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || (p.category?.name || 'Uncategorized') === categoryFilter;
      
      let matchesStatus = true;
      if (productStatusFilter === 'active') {
        matchesStatus = p.is_active === true;
      } else if (productStatusFilter === 'draft') {
        matchesStatus = p.is_active === false;
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
      product_type: 'beverage',
      is_active: false,
      is_available_kiosk: true,
      is_available_d2c: false,
      is_available_admin: true,
      image_url: '',
      recipe_id: '',
      concentrate_type_id: ''
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category?.id || '',
      description: product.description || '',
      base_price: product.base_price || product.basePrice || 0,
      product_type: product.product_type || 'beverage',
      is_active: product.is_active == null ? false : Boolean(product.is_active),
      is_available_kiosk: product.is_available_kiosk == null ? true : Boolean(product.is_available_kiosk),
      is_available_d2c: product.is_available_d2c == null ? false : Boolean(product.is_available_d2c),
      is_available_admin: product.is_available_admin == null ? true : Boolean(product.is_available_admin),
      image_url: product.image_url || '',
      recipe_id: product.recipe_id || '',
      concentrate_type_id: product.concentrate_type_id || ''
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
          category: product?.category?.name || 'Uncategorized',
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
        product_type: formData.product_type || 'beverage',
        is_active: formData.is_active,
        is_available_kiosk: formData.is_available_kiosk,
        is_available_d2c: formData.is_available_d2c,
        is_available_admin: formData.is_available_admin,
        recipe_id: formData.recipe_id ? Number(formData.recipe_id) : null,
        concentrate_type_id: formData.concentrate_type_id ? Number(formData.concentrate_type_id) : null,
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
    const newStatus = !product.is_active;
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

  console.log('productsList state:', productsList.length);
  console.log('filteredProducts state:', filteredProducts.length);

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
        <button
          className={`settings-tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
          id="menu-tab-stock"
        >
          Store Stock
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          {stockSummary.low > 0 && (
            <div className="alert-banner warning">
              ⚠️ {stockSummary.low} ingredient{stockSummary.low > 1 ? 's' : ''} low on stock.&nbsp;
              {stockSummary.out > 0 && <>{stockSummary.out} out of stock. </>}
              <a href="#" onClick={e => { e.preventDefault(); setActiveTab('stock'); }} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View Stock</a>
            </div>
          )}
          
          <div className="zenith-page-header">
            <div className="zenith-header-left">
              <div className="zenith-breadcrumb">Dashboard &gt; Products</div>
              <h1 className="zenith-title">Products</h1>
              <p className="zenith-subtitle">Browse and manage your product catalog.</p>
            </div>
            <div className="zenith-header-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button onClick={loadProductsAndCategories} variant="ghost" disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
              {userRole === 'super_admin' && (
                <button className="zenith-btn-dark" onClick={openAddModal}>
                  <Plus className="w-4 h-4" style={{ marginRight: '6px' }} /> Add Product
                </button>
              )}
            </div>
          </div>

          <div className="zenith-control-bar">
            <div className="zenith-filters-row">
              {['all', 'active', 'draft'].map(tab => (
                <button 
                  key={tab} 
                  className={`zenith-filter-pill ${productStatusFilter === tab ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

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

              <button className="zenith-btn-outline" onClick={() => toast('Column visibility — coming soon')}>
                <Columns className="w-4 h-4" style={{ marginRight: '6px' }} /> Columns
              </button>
              
              <button className="zenith-btn-outline" onClick={() => toast('Export — coming soon')}>
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
                            product.image_url.endsWith('.mp4') ? (
                              <video src={product.image_url} autoPlay loop muted playsInline className="product-thumb" style={{ objectFit: 'cover' }} />
                            ) : (
                              <img src={product.image_url} alt={product.name} className="product-thumb" />
                            )
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
                          {product.category?.name || 'Uncategorized'}
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
                              {userRole === 'super_admin' && (
                                <>
                                  <button onClick={() => openEditModal(product)}>Edit Details</button>
                                  <button onClick={() => toggleStatus(product)}>
                                    {product.is_active ? 'Mark Inactive' : 'Mark Active'}
                                  </button>
                                  <button className="danger" onClick={() => handleDelete(product.id)}>Delete Product</button>
                                </>
                              )}
                              {userRole !== 'super_admin' && (
                                <button disabled style={{ color: 'var(--color-text-secondary)' }}>View Only</button>
                              )}
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

      {activeTab === 'recipes' && <MenuTab />}

      {activeTab === 'ingredients' && <Ingredients />}

      {activeTab === 'stock' && <Inventory />}

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
                <div className="form-group">
                  <label>Menu Recipe</label>
                  <select value={formData.recipe_id} onChange={e => setFormData({...formData, recipe_id: e.target.value})}>
                    <option value="">-- None --</option>
                    {recipesList.map(r => <option key={r._pk} value={r._pk}>{r.name} {r.recipe_code ? `(${r.recipe_code})` : ''} — ₹{r.total_cost?.toFixed(2) || '0.00'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Concentrate Type</label>
                  <select value={formData.concentrate_type_id} onChange={e => setFormData({...formData, concentrate_type_id: e.target.value})}>
                    <option value="">-- None --</option>
                    {concentrateTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
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
                  <label>Product Type</label>
                  <select value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})}>
                    <option value="beverage">Beverage</option>
                    <option value="concentrate">Concentrate</option>
                    <option value="food">Food</option>
                    <option value="addon">Add-on</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.is_active ? 1 : 0} onChange={e => setFormData({...formData, is_active: e.target.value === '1'})}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Channel Availability</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.is_available_kiosk}
                        onChange={e => setFormData({...formData, is_available_kiosk: e.target.checked})} />
                      Kiosk
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.is_available_d2c}
                        onChange={e => setFormData({...formData, is_available_d2c: e.target.checked})} />
                      D2C
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.is_available_admin}
                        onChange={e => setFormData({...formData, is_available_admin: e.target.checked})} />
                      Admin
                    </label>
                  </div>
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

