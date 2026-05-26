import React, { useState, useEffect, useMemo } from 'react';
import './Menu.css';
import Button from '../../../components/Button/Button';
import { productService } from '../../../services/products';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const Menu = () => {
  const [productsList, setProductsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
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

  const loadProductsAndCategories = async () => {
    setIsLoading(true);
    try {
      const pRes = await productService.getAll();
      setProductsList(unwrapList(pRes));
      
      const cRes = await productService.getCategories();
      setCategoriesList(unwrapList(cRes));
    } catch (err) {
      toast.error('Failed to load menu products: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const categories = useMemo(() => {
    return ['all', ...categoriesList.map(c => c.name)];
  }, [categoriesList]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category_name === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productsList, searchQuery, categoryFilter]);

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
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(productId);
        toast.success('Product deleted successfully');
        loadProductsAndCategories();
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
    try {
      const newStatus = product.is_active ? 0 : 1;
      await productService.update(product.id, { is_active: newStatus });
      toast.success(`Product marked as ${newStatus ? 'Active' : 'Inactive'}`);
      loadProductsAndCategories();
    } catch (err) {
      toast.error('Failed to toggle status: ' + err.message);
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
      <div className="view-header">
        <div>
          <h2 className="section-title">Product & Menu Management</h2>
          <p className="section-subtitle">Manage catalog, categories, pricing, and variants</p>
        </div>
        <Button variant="primary" onClick={openAddModal}>+ Add New Product</Button>
      </div>

      <div className="menu-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="menu-search-input"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      <div className="cms-table-container ">
        <table className="cms-table menu-table">
          <thead>
            <tr>
              <th>Product Info</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan="5" className="empty-row">No products found.</td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-info-cell">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="product-thumb" />
                      ) : (
                        <div className="product-thumb placeholder">☕</div>
                      )}
                      <div>
                        <span className="product-name">{product.name}</span>
                        <span className="product-id">{product.uuid || product.id}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="category-tag">{product.category_name || 'Coffee'}</span></td>
                  <td><strong>{formatCurrency(product.base_price || product.basePrice)}</strong></td>
                  <td>
                    <button 
                      className={`status-toggle ${product.is_active ? 'active' : 'inactive'}`}
                      onClick={() => toggleStatus(product)}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn edit" onClick={() => openEditModal(product)}>✏️ Edit</button>
                      <button className="action-btn delete" onClick={() => handleDelete(product.id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
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

