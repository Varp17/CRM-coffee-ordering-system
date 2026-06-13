import React, { useState, useEffect, useMemo } from 'react';
import './Categories.css';
import { DataTable } from '../../../components/ui/DataTable';
import Button from '../../../components/Button/Button';
import { productService } from '../../../services/products';
import { rawMaterialService } from '../../../services/rawMaterials';
import { recipeService } from '../../../services/recipes';
import { api } from '../../../services/api';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Folder } from 'lucide-react';

const RAW_MATERIAL_CATEGORIES = [
  { key: 'coffee_beans', name: 'Coffee Beans', description: 'Freshly roasted whole coffee beans' },
  { key: 'additives', name: 'Additives & Powders', description: 'Powders and flavor enhancers' },
  { key: 'tea', name: 'Tea & Fruit', description: 'Tea leaves, fruits, and infusions' },
  { key: 'sweeteners', name: 'Syrups & Sweeteners', description: 'Liquid sweeteners and gourmet syrups' },
  { key: 'dairy', name: 'Dairy', description: 'Fresh cow milk and dairy products' },
  { key: 'dairy_alt', name: 'Alternative Dairy', description: 'Vegan milks (Almond, Oat, Soy, etc.)' },
  { key: 'liquids', name: 'Liquids & Soda', description: 'Liquid bases, carbonated waters, and sodas' },
  { key: 'juices', name: 'Juices & Produce', description: 'Fresh fruit juices and concentrates' },
  { key: 'produce', name: 'Fresh Produce', description: 'Garnishes and fresh fruit additions' },
  { key: 'toppings', name: 'Toppings', description: 'Whipped creams, sprinkles, and toppings' },
  { key: 'packaging', name: 'Packaging', description: 'Cups, lids, straws, and sleeves' },
  { key: 'other', name: 'Other', description: 'Miscellaneous items' },
];

const Categories = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'raw-materials'
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailCategory, setSelectedDetailCategory] = useState(null);
  const [detailProducts, setDetailProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [detailRawMaterials, setDetailRawMaterials] = useState([]);
  const [detailMappings, setDetailMappings] = useState({});
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const handleProductCategoryChange = async (productId, newCategoryId) => {
    try {
      await productService.update(productId, { category_id: Number(newCategoryId) });
      toast.success('Product category updated');
      // Refresh details
      if (selectedDetailCategory) {
        handleRowClick(selectedDetailCategory);
      }
      loadCategories();
    } catch (err) {
      toast.error('Failed to update product category: ' + err.message);
    }
  };

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', image_url: '', display_order: 0, is_active: true,
  });

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getCategories();
      setCategories(unwrapList(response));
    } catch (err) {
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : []).filter((item) => {
      const q = searchQuery.toLowerCase();
      return !q || (item.name || '').toLowerCase().includes(q) || (item.slug || '').toLowerCase().includes(q);
    });
  }, [categories, searchQuery]);

  const filteredRawMaterialCategories = useMemo(() => {
    return RAW_MATERIAL_CATEGORIES.filter((item) => {
      const q = searchQuery.toLowerCase();
      return !q || item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q);
    });
  }, [searchQuery]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', slug: '', description: '', image_url: '', display_order: 0, is_active: true });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '', slug: item.slug || '', description: item.description || '',
      image_url: item.image_url || '', display_order: item.display_order ?? 0, is_active: item.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingItem ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        image_url: formData.image_url || null,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await api.patch(`/categories/${editingItem.id || editingItem.uuid}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      toast.error('Failed to save category: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete category "${item.name}"? This cannot be undone if products are linked.`)) return;
    try {
      await api.delete(`/categories/${item.id || item.uuid}`);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.patch(`/categories/${item.id || item.uuid}`, { is_active: !item.is_active });
      toast.success(`Category ${item.is_active ? 'deactivated' : 'activated'}`);
      loadCategories();
    } catch (err) {
      toast.error('Failed to toggle: ' + err.message);
    }
  };

  const handleRowClick = async (row) => {
    setSelectedDetailCategory(row);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    setDetailProducts([]);
    setDetailRawMaterials([]);
    setDetailMappings({});

    try {
      if (activeTab === 'products') {
        const pRes = await productService.getAll({ limit: 200 });
        const products = unwrapList(pRes);
        setAllProducts(products);
        const filteredProds = products.filter(
          (p) => p.category?.id === row.id || p.category_id === row.id
        );
        setDetailProducts(filteredProds);

        const mappings = {};
        await Promise.all(
          filteredProds.map(async (p) => {
            try {
              const res = await recipeService.getIngredientMappings(p.id);
              mappings[p.id] = res?.mappings || [];
            } catch (e) {
              console.error('Error fetching mappings for', p.name, e);
              mappings[p.id] = [];
            }
          })
        );
        setDetailMappings(mappings);
      } else {
        const rmRes = await rawMaterialService.getAll();
        const rawMaterials = unwrapList(rmRes);
        const filteredRMs = rawMaterials.filter(
          (rm) => rm.category === row.key
        );
        setDetailRawMaterials(filteredRMs);
      }
    } catch (err) {
      toast.error('Failed to load category details: ' + err.message);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const productColumns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Slug', accessor: 'slug', sortable: true },
    {
      header: 'Order', accessor: 'display_order', sortable: true,
      render: (row) => <span>{row.display_order}</span>,
    },
    {
      header: 'Status', accessor: 'is_active', sortable: true,
      render: (row) => (
        <span className={`badge ${row.is_active ? 'badge-success' : 'badge-secondary'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="table-actions">
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); toggleActive(row); }} title={row.is_active ? 'Deactivate' : 'Activate'}>
            {row.is_active ? '🚫' : '✅'}
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEditModal(row); }} title="Edit">✏️</button>
          <button className="btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">🗑️</button>
        </div>
      ),
    }
  ];

  const rawMaterialColumns = [
    { header: 'Category Name', accessor: 'name', sortable: true },
    { header: 'Category Key', accessor: 'key', sortable: true },
    { header: 'Description', accessor: 'description' },
  ];

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p className="page-subtitle">Manage product and ingredient categories for system organization</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={loadCategories} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          {activeTab === 'products' && (
            <Button onClick={openAddModal}><Plus size={16} /> New Category</Button>
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="categories-tabs">
        <button
          className={`categories-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
        >
          Product Categories
        </button>
        <button
          className={`categories-tab ${activeTab === 'raw-materials' ? 'active' : ''}`}
          onClick={() => { setActiveTab('raw-materials'); setSearchQuery(''); }}
        >
          Raw Material Categories
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="table-toolbar">
        <input
          type="text" className="search-input" 
          placeholder={activeTab === 'products' ? 'Search product categories...' : 'Search raw material categories...'}
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Data Tables ── */}
      {activeTab === 'products' ? (
        <DataTable
          columns={productColumns} data={filteredCategories} isLoading={isLoading}
          onRowClick={handleRowClick} emptyMessage="No product categories found"
        />
      ) : (
        <DataTable
          columns={rawMaterialColumns} data={filteredRawMaterialCategories} isLoading={false}
          onRowClick={handleRowClick} emptyMessage="No raw material categories found"
        />
      )}

      {/* ── Add/Edit Modal (Product Categories Only) ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Category' : 'New Category'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleNameChange} required />
                  </div>
                  <div className="form-group">
                    <label>Slug</label>
                    <input type="text" name="slug" value={formData.slug} onChange={handleFormChange} placeholder="auto-generated" />
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input type="text" name="image_url" value={formData.image_url} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input type="number" name="display_order" value={formData.display_order} onChange={handleFormChange} min="0" />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} />
                  </div>
                  <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleFormChange} style={{ width: 'auto' }} />
                      Active
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Category Detail Modal ── */}
      {showDetailModal && selectedDetailCategory && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div>
                <span className="detail-tag">
                  {activeTab === 'products' ? 'Product Category' : 'Raw Material Category'}
                </span>
                <h3 style={{ marginTop: '4px', fontSize: '20px', fontWeight: '700', color: '#2C1A0E' }}>
                  {selectedDetailCategory.name}
                </h3>
              </div>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {selectedDetailCategory.description && (
                <p className="detail-desc" style={{ color: '#666', fontSize: '14px', marginBottom: '20px', fontStyle: 'italic' }}>
                  "{selectedDetailCategory.description}"
                </p>
              )}

              {isDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#C8853E' }} />
                  <div>Loading details...</div>
                </div>
              ) : activeTab === 'products' ? (
                <div>
                  {/* Assign Product Box */}
                  <div style={{ background: '#FAF6F0', border: '1px solid var(--c-cream-border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--c-text-secondary)', marginBottom: '4px' }}>Assign Product to this Category:</div>
                      <select 
                        id="assign-product-select"
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid var(--c-cream-border)', borderRadius: '6px', background: '#fff', height: '36px' }}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Select a Product --</option>
                        {allProducts
                          .filter(p => p.category_id !== selectedDetailCategory.id && p.category?.id !== selectedDetailCategory.id)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.category_name || 'Uncategorized'})</option>
                          ))}
                      </select>
                    </div>
                    <Button 
                      variant="primary" 
                      style={{ marginTop: '18px', height: '36px', padding: '0 16px', fontSize: '13px' }}
                      onClick={async () => {
                        const selectEl = document.getElementById('assign-product-select');
                        const prodId = selectEl.value;
                        if (!prodId) {
                          toast.error('Please select a product first');
                          return;
                        }
                        await handleProductCategoryChange(prodId, selectedDetailCategory.id);
                        selectEl.value = "";
                      }}
                    >
                      Assign
                    </Button>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#2C1A0E', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
                    Linked Products ({detailProducts.length})
                  </h4>
                  {detailProducts.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '13px' }}>No products found in this category.</p>
                  ) : (
                    <div className="detail-products-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {detailProducts.map(product => {
                        const mappings = detailMappings[product.id] || [];
                        return (
                          <div key={product.id} className="detail-product-card" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', background: '#FAF6F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <span style={{ fontWeight: '700', color: '#2C1A0E', fontSize: '14px' }}>{product.name}</span>
                                <span style={{ marginLeft: '10px', fontSize: '11px', background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: '600', color: '#4b5563' }}>
                                  {product.product_type}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <select 
                                  value={product.category_id || selectedDetailCategory.id}
                                  onChange={(e) => handleProductCategoryChange(product.id, e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', height: '28px' }}
                                >
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                                <span style={{ fontWeight: '700', color: '#C8853E', fontSize: '14px' }}>
                                  {formatCurrency(product.base_price || product.basePrice)}
                                </span>
                              </div>
                            </div>
                            
                            {mappings.length > 0 ? (
                              <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #C8853E' }}>
                                <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#888', marginBottom: '4px', letterSpacing: '0.05em' }}>
                                  Ingredients & Proportions:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {mappings.map(m => (
                                    <span key={m.id} style={{ fontSize: '12px', background: '#fff', border: '1px solid #e5e7eb', padding: '3px 8px', borderRadius: '4px', color: '#4b5563' }}>
                                      {m.ingredient_name}: <strong>{m.quantity} {m.unit}</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
                                No ingredient recipe linked.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#2C1A0E', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>
                    Raw Materials in Category ({detailRawMaterials.length})
                  </h4>
                  {detailRawMaterials.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '13px' }}>No raw materials found in this category.</p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                      <table className="detail-rm-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#FAF6F0', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '10px', color: '#2C1A0E', fontWeight: '600' }}>Name</th>
                            <th style={{ padding: '10px', color: '#2C1A0E', fontWeight: '600' }}>Supplier</th>
                            <th style={{ padding: '10px', color: '#2C1A0E', fontWeight: '600' }}>Cost/Unit</th>
                            <th style={{ padding: '10px', textAlign: 'right', color: '#2C1A0E', fontWeight: '600' }}>Stock Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailRawMaterials.map(rm => (
                            <tr key={rm.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px', fontWeight: '500', color: '#2C1A0E' }}>{rm.name}</td>
                              <td style={{ padding: '10px', color: '#666' }}>{rm.supplier_name || '-'}</td>
                              <td style={{ padding: '10px', color: '#4b5563' }}>{formatCurrency(rm.cost_per_unit)} / {rm.unit}</td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: rm.current_stock <= rm.low_stock_threshold ? '#dc2626' : '#065f46' }}>
                                {rm.current_stock} {rm.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
