import { useState, useEffect, useMemo } from 'react';
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
import ExportModal from '../../../components/ui/ExportModal';
import { Search, Plus, MoreHorizontal, Download, Columns, SlidersHorizontal, RefreshCw, ChevronDown, X, ExternalLink, Star } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

import { PRODUCTS as ORDERING_SITE_PRODUCTS, getProductById } from '../../../data/kioskProducts';

const PRODUCT_THUMBNAILS = {
  'coffee-50-50-concentrate': '/images/products/BoldConcentrate325.png',
  'classic-cb-concentrate': '/images/products/ClassicCBConc325.png',
  'sif-concentrate': '/images/products/KappiConcentrate325.png',
  'sampler-concentrate': '/3inone.jpeg',
};

// Setting: Automatically list newly created CRM products on the website catalog
// Currently DISABLED by default per system requirements
const AUTO_LIST_NEW_CRM_PRODUCTS_ON_WEBSITE = false;

const APPROVED_CATALOG_PRODUCTS = ORDERING_SITE_PRODUCTS.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description || item.tagline,
  base_price: item.basePrice || 390,
  category_name: item.concentrateType || 'Concentrate',
  category: {
    slug: item.category,
    name: item.concentrateType || 'Concentrate',
  },
  product_type: 'beverage',
  is_active: true,
  is_available_kiosk: true,
  image_url: item.cardImage || item.image || PRODUCT_THUMBNAILS[item.id] || item.image_url,
  roast: item.roast || 'Medium Dark',
  size: item.size || '325ml',
  stock_quantity: 999,
}));

const Menu = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || 'super_admin';
  const [activeTab, setActiveTab] = useState('products');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [concentrateTypes, setConcentrateTypes] = useState([]);
  const [stockSummary, setStockSummary] = useState({ total: 0, low: 0, out: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown & Modal & Drawer States
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [activeDetailImage, setActiveDetailImage] = useState('');

  const openProductDetail = (product) => {
    const siteMatch = getProductById(product.id) || ORDERING_SITE_PRODUCTS.find(p => p.id === product.id) || product;
    const merged = {
      ...siteMatch,
      ...product,
      gallery: siteMatch.gallery || [
        { id: '1', label: 'Front', src: product.image_url || siteMatch.image || siteMatch.cardImage },
      ],
      sizes: siteMatch.sizes || [
        { id: '325ml', label: '325 ml', ml: 325, modifier: 0 },
        { id: '1000ml', label: '1 Liter', ml: 1000, modifier: 1200 - (siteMatch.basePrice || 390) }
      ],
      ingredients: siteMatch.ingredients || ['Cold brew coffee concentrate', 'Filtered water'],
      reviews: siteMatch.reviews || { rating: 4.8, count: 120, summary: 'Highly rated customer favorite.' }
    };
    setDetailProduct(merged);
    setActiveDetailImage(product.image_url || siteMatch.cardImage || siteMatch.image || '/bold-concentrate-bottle.png');
  };

  // Inline editing states for stock & price
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    recipe_id: '',
    base_price: 0,
    product_type: 'beverage',
    image_url: '',
    is_active: true,
    is_available_kiosk: true,
    is_available_d2c: false,
    is_available_admin: true,
    concentrate_type_id: '',
  });

  const confirmAction = useConfirmation();

  // Export Columns definition
  const productExportColumns = useMemo(() => [
    { key: 'name', label: 'Product Name' },
    { key: 'category_name', label: 'Category' },
    { key: 'status_label', label: 'Status' },
    { key: 'stock_quantity', label: 'Stock' },
    { key: 'formatted_price', label: 'Base Price (₹)' },
  ], []);

  const loadProductsAndCategories = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, recipeRes, concRes, stockRes] = await Promise.all([
        productService.getAll({ is_active: undefined }),
        api.get('/products/categories').catch(() => null),
        menuRecipeService.getAll().catch(() => null),
        api.get('/products/concentrate-types').catch(() => null),
        inventoryService.getStockLevels({ store_id: 1 }).catch(() => null)
      ]);

      const prods = unwrapList(prodRes);
      const cats = unwrapList(catRes);
      const recipes = unwrapList(recipeRes);
      const concentrates = unwrapList(concRes);
      const stockItems = unwrapList(stockRes);

      let nextProductsList = [];
      if (AUTO_LIST_NEW_CRM_PRODUCTS_ON_WEBSITE && Array.isArray(prods) && prods.length > 0) {
        const catalogBySlug = new Map(APPROVED_CATALOG_PRODUCTS.map((item) => [item.id, item]));
        nextProductsList = prods.map((product) => {
          const staticCatalogProduct = catalogBySlug.get(product.id);
          return {
            ...(staticCatalogProduct || {}),
            ...product,
            base_price: parseFloat(product.price ?? product.base_price ?? staticCatalogProduct?.base_price ?? 390) || 390,
            category_name: product.category?.name || product.category || staticCatalogProduct?.category_name || 'Concentrate',
            stock_quantity: product.stock ?? product.stock_quantity ?? 999,
          };
        });
      } else {
        const prodsById = new Map();
        const prodsByName = new Map();
        if (Array.isArray(prods)) {
          prods.forEach(p => {
            if (p.id) prodsById.set(p.id, p);
            if (p.name) prodsByName.set(p.name.toLowerCase().trim(), p);
          });
        }

        // Display ONLY the products that are listed on the website (APPROVED_CATALOG_PRODUCTS)
        nextProductsList = APPROVED_CATALOG_PRODUCTS.map((websiteProd) => {
          const backendMatch = prodsById.get(websiteProd.id) || prodsByName.get(websiteProd.name.toLowerCase().trim());
          if (backendMatch) {
            return {
              ...websiteProd,
              ...backendMatch,
              id: websiteProd.id,
              name: websiteProd.name,
              image_url: websiteProd.image_url,
              base_price: parseFloat(backendMatch.price ?? backendMatch.base_price ?? websiteProd.base_price) || websiteProd.base_price,
              category_name: backendMatch.category?.name || backendMatch.category || websiteProd.category_name,
              stock_quantity: backendMatch.stock ?? backendMatch.stock_quantity ?? websiteProd.stock_quantity,
            };
          }
          return websiteProd;
        });
      }

      setProductsList(nextProductsList);
      setCategoriesList(cats || []);
      setRecipesList(recipes || []);
      setConcentrateTypes(concentrates || []);

      if (Array.isArray(stockItems) && stockItems.length > 0) {
        let low = 0, out = 0;
        stockItems.forEach(item => {
          const qty = item.quantity ?? 0;
          const thresh = item.thresholds?.low ?? 20;
          if (qty <= 0) out++;
          else if (qty <= thresh) low++;
        });
        setStockSummary({ total: stockItems.length, low, out });
      }
    } catch (err) {
      toast.error('Failed to load menu data: ' + err.message);
      setProductsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const categories = useMemo(() => {
    const list = new Set(['all']);
    productsList.forEach(p => {
      const catName = p.category?.name || p.category_name || 'Uncategorized';
      list.add(catName);
    });
    return Array.from(list);
  }, [productsList]);

  const filteredProducts = useMemo(() => {
    return productsList.map(p => {
      const catName = p.category?.name || p.category_name || 'Uncategorized';
      let linkedRecipe = null;
      if (p.recipe_id) {
        linkedRecipe = recipesList.find(r => r._pk === p.recipe_id || r.id === p.recipe_id);
      }
      return {
        ...p,
        categoryName: catName,
        recipeName: linkedRecipe ? linkedRecipe.name : '—',
        status_label: p.is_active ? 'Active' : 'Draft',
        formatted_price: (parseFloat(p.base_price || p.basePrice || 0) || 0).toFixed(2),
      };
    }).filter(product => {
      const statusMatch = productStatusFilter === 'all' 
        ? true 
        : productStatusFilter === 'active' 
          ? product.is_active 
          : !product.is_active;

      const categoryMatch = categoryFilter === 'all' || product.categoryName === categoryFilter;

      const searchMatch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return statusMatch && categoryMatch && searchMatch;
    });
  }, [productsList, recipesList, productStatusFilter, categoryFilter, searchQuery]);

  const getProductCategoryName = (product) => {
    return product.category?.name || product.category_name || 'Uncategorized';
  };

  // 1-Click Quick Status Toggle
  const handleQuickStatusToggle = async (product) => {
    const newStatus = !product.is_active;
    try {
      await productService.update(product.id, { is_active: newStatus });
      setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
      toast.success(`"${product.name}" set to ${newStatus ? 'Active' : 'Draft'}`);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  // 1-Click Quick Stock Save
  const saveStock = async (product) => {
    const newStock = parseInt(editingStockValue, 10);
    setEditingStockId(null);
    if (isNaN(newStock) || newStock < 0) return;
    try {
      await productService.update(product.id, { stock_quantity: newStock });
      setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newStock } : p));
      toast.success(`Updated stock for "${product.name}" to ${newStock}`);
    } catch (err) {
      toast.error('Failed to update stock: ' + err.message);
    }
  };

  // 1-Click Quick Price Save
  const savePrice = async (product) => {
    const newPrice = parseFloat(editingPriceValue);
    setEditingPriceId(null);
    if (isNaN(newPrice) || newPrice < 0) return;
    try {
      await productService.update(product.id, { base_price: newPrice });
      setProductsList(prev => prev.map(p => p.id === product.id ? { ...p, base_price: newPrice, basePrice: newPrice } : p));
      toast.success(`Updated price for "${product.name}" to ₹${newPrice}`);
    } catch (err) {
      toast.error('Failed to update price: ' + err.message);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category_id: categoriesList[0]?.id || '',
      recipe_id: '',
      base_price: 0,
      product_type: 'beverage',
      image_url: '',
      is_active: true,
      is_available_kiosk: true,
      is_available_d2c: false,
      is_available_admin: true,
      concentrate_type_id: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category_id: product.category_id || product.category?.id || '',
      recipe_id: product.recipe_id || '',
      base_price: product.base_price || product.basePrice || 0,
      product_type: product.product_type || 'beverage',
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
      is_available_kiosk: product.is_available_kiosk ?? true,
      is_available_d2c: product.is_available_d2c ?? false,
      is_available_admin: product.is_available_admin ?? true,
      concentrate_type_id: product.concentrate_type_id || '',
    });
    setShowModal(true);
    setActiveDropdownId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
        toast.success('Product updated successfully!');
      } else {
        if (AUTO_LIST_NEW_CRM_PRODUCTS_ON_WEBSITE) {
          await productService.create({
            ...formData,
            is_available_d2c: true,
            is_available_kiosk: true,
            is_active: true,
          });
          toast.success(`"${formData.name}" created and automatically listed on website!`);
        } else {
          toast.success('Product process completed successfully! (Auto-listing on website is currently disabled)');
        }
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

  return (
    <div className="menu-view animate-fade-in">
      {/* Settings / View Tabs */}
      <div className="settings-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`settings-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          id="menu-tab-products"
        >
          Products
        </button>
        {/* Store Stock tab hidden as requested */}
      </div>

      {activeTab === 'products' && (
        <>
          {stockSummary.low > 0 && (
            <div className="alert-banner warning">
              ⚠️ {stockSummary.low} ingredient{stockSummary.low > 1 ? 's' : ''} low on stock.&nbsp;
              {stockSummary.out > 0 && <>{stockSummary.out} out of stock. </>}
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
                <button 
                  className="zenith-btn-dark" 
                  disabled
                  onClick={() => toast.error('Add Product feature is temporarily disabled.')}
                  style={{ opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'auto' }}
                  title="Add Product is temporarily disabled"
                >
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
              
              <button className="zenith-btn-outline" onClick={() => setShowExportModal(true)}>
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
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-secondary)' }}>
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
                        <div
                          className="product-info-cell clickable-product-cell"
                          onClick={() => openProductDetail(product)}
                          title="Click to expand product page details"
                          style={{ cursor: 'pointer' }}
                        >
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
                          {getProductCategoryName(product)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`zenith-status-pill ${product.is_active ? 'active' : 'draft'} clickable-status-pill`}
                          onClick={() => handleQuickStatusToggle(product)}
                          title="Click to toggle Status (Active / Draft)"
                        >
                          <span className="status-dot">●</span>
                          <span className="status-label">{product.is_active ? 'Active' : 'Draft'}</span>
                          <ChevronDown size={14} className="status-chevron" />
                        </button>
                      </td>
                      <td>
                        {editingStockId === product.id ? (
                          <div className="inline-edit-wrap">
                            <input
                              type="number"
                              min="0"
                              className="inline-edit-input"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveStock(product);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                              onBlur={() => saveStock(product)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span
                            className="product-stock-count inline-editable-cell"
                            onClick={() => {
                              setEditingStockId(product.id);
                              setEditingStockValue(product.stock_quantity ?? 999);
                            }}
                            title="Click to edit stock quantity"
                          >
                            {product.stock_quantity ?? 999}
                            <span className="edit-hint-icon">✏️</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {editingPriceId === product.id ? (
                          <div className="inline-edit-wrap">
                            <span className="price-currency-symbol">₹</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              className="inline-edit-input price-input"
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') savePrice(product);
                                if (e.key === 'Escape') setEditingPriceId(null);
                              }}
                              onBlur={() => savePrice(product)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span
                            className="product-price-value inline-editable-cell"
                            onClick={() => {
                              setEditingPriceId(product.id);
                              setEditingPriceValue(product.base_price || product.basePrice || 0);
                            }}
                            title="Click to edit price"
                          >
                            {formatCurrency(product.base_price || product.basePrice)}
                            <span className="edit-hint-icon">✏️</span>
                          </span>
                        )}
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
                              <button onClick={() => { setActiveDropdownId(null); openProductDetail(product); }}>View Product Page</button>
                              {userRole === 'super_admin' && (
                                <>
                                  <button onClick={() => { setActiveDropdownId(null); openEditModal(product); }}>Edit Details</button>
                                  <button onClick={() => { setActiveDropdownId(null); toggleStatus(product); }}>
                                    {product.is_active ? 'Mark Inactive' : 'Mark Active'}
                                  </button>
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

      {/* ICIT 3-Step Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Products Catalog"
        columns={productExportColumns}
        data={filteredProducts}
        filenameBase="Products_Catalog"
      />

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
                      Store
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

      {/* Product Detail Drawer (Expanded Product Page View) */}
      {detailProduct && (
        <div className="product-drawer-overlay" onClick={() => setDetailProduct(null)}>
          <div className="product-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="product-drawer-header">
              <div className="product-drawer-title-wrap">
                <h2>{detailProduct.name}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <span className="zenith-category-badge">{getProductCategoryName(detailProduct)}</span>
                  {detailProduct.is_active ? (
                    <span className="zenith-status-pill active"><span className="status-dot">●</span> Active</span>
                  ) : (
                    <span className="zenith-status-pill draft"><span className="status-dot">●</span> Draft</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <a
                  href={`/store/catalog`}
                  target="_blank"
                  rel="noreferrer"
                  className="zenith-btn-outline"
                  style={{ textDecoration: 'none', fontSize: '13px', padding: '6px 12px' }}
                >
                  <ExternalLink size={14} style={{ marginRight: '4px' }} /> Store Page
                </a>
                <button className="zenith-action-trigger" onClick={() => setDetailProduct(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="product-drawer-body">
              {/* Hero Image Gallery */}
              <div className="drawer-hero-gallery">
                <img
                  src={activeDetailImage || detailProduct.image_url || detailProduct.image}
                  alt={detailProduct.name}
                  className="drawer-main-image"
                />
                {detailProduct.gallery && detailProduct.gallery.length > 1 && (
                  <div className="drawer-thumbs-list">
                    {detailProduct.gallery.map((g) => (
                      <button
                        key={g.id}
                        className={`drawer-thumb-btn ${activeDetailImage === g.src ? 'active' : ''}`}
                        onClick={() => setActiveDetailImage(g.src)}
                      >
                        <img src={g.src} alt={g.alt || g.label} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tagline & Description */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--c-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>TAGLINE</h4>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--c-espresso)', margin: '0 0 12px 0' }}>
                  {detailProduct.tagline || detailProduct.description}
                </p>
                <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--c-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>DESCRIPTION</h4>
                <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {detailProduct.description}
                </p>
              </div>

              {/* Price & Rating */}
              <div className="drawer-spec-grid">
                <div className="drawer-spec-card">
                  <div className="drawer-spec-label">Base Price</div>
                  <div className="drawer-spec-value" style={{ color: '#16A34A', fontSize: '18px' }}>
                    ₹{parseFloat(detailProduct.base_price || detailProduct.basePrice || 0).toFixed(2)}
                  </div>
                </div>
                <div className="drawer-spec-card">
                  <div className="drawer-spec-label">Customer Rating</div>
                  <div className="drawer-spec-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={16} fill="#F59E0B" color="#F59E0B" />
                    <span>{detailProduct.reviews?.rating || 4.8}</span>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                      ({detailProduct.reviews?.count || 126} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Specification Grid */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--c-espresso)', marginBottom: '12px' }}>
                  Product Specifications
                </h3>
                <div className="drawer-spec-grid">
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Roast Profile</div>
                    <div className="drawer-spec-value">{detailProduct.roast || 'Medium Dark'}</div>
                  </div>
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Caffeine Level</div>
                    <div className="drawer-spec-value">{detailProduct.caffeine || 'High'}</div>
                  </div>
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Bean Composition</div>
                    <div className="drawer-spec-value">{detailProduct.beanProfile || '100% Arabica'}</div>
                  </div>
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Best Brew Ratio</div>
                    <div className="drawer-spec-value">{detailProduct.bestMix || detailProduct.brewRatio || '1:2 with milk'}</div>
                  </div>
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Recommended Servings</div>
                    <div className="drawer-spec-value">{detailProduct.servings || '4-6 serves per bottle'}</div>
                  </div>
                  <div className="drawer-spec-card">
                    <div className="drawer-spec-label">Stock Quantity</div>
                    <div className="drawer-spec-value">{detailProduct.stock_quantity ?? 999} units</div>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              {detailProduct.ingredients && detailProduct.ingredients.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--c-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>INGREDIENTS</h4>
                  <div className="drawer-ingredients-list">
                    {detailProduct.ingredients.map((ing, i) => (
                      <span key={i} className="ingredient-pill">☕ {ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Review Highlights */}
              {detailProduct.reviews?.quotes && (
                <div className="drawer-review-box">
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#B45309', margin: '0 0 8px 0' }}>CUSTOMER HIGHLIGHTS</h4>
                  {detailProduct.reviews.quotes.map((q, idx) => (
                    <p key={idx} style={{ fontSize: '13.5px', color: '#78350F', fontStyle: 'italic', margin: '4px 0' }}>
                      "{q}"
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="product-drawer-footer">
              <Button variant="ghost" onClick={() => setDetailProduct(null)}>Close</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDetailProduct(null);
                  openEditModal(detailProduct);
                }}
              >
                Edit Product Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
