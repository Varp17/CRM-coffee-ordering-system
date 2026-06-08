import React, { useState, useEffect } from 'react';
import './CMS.css';
import Button from '../../../components/Button/Button';
import { cmsService } from '../../../services/cms';
import { productService } from '../../../services/products';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import Notifications from '../Notifications/Notifications';

const CMS = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [bannersList, setBannersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    active: true,
    position: 'hero',
    ctaText: '',
    ctaLink: ''
  });

  const [seoForm, setSeoForm] = useState({
    title: 'Digital Coffee | Premium Brews & Subscriptions',
    description: 'Experience cafe-quality cold brews and concentrates delivered to your door. Subscribe and save.',
    keywords: 'coffee, cold brew, concentrates, subscription, digital coffee'
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const bannerRes = await cmsService.getBanners();
      setBannersList(unwrapList(bannerRes));

      const productRes = await productService.getAll();
      setProductsList(unwrapList(productRes));
    } catch (err) {
      toast.error('Failed to load CMS data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleBanner = async (banner) => {
    try {
      const currentActive = banner.is_active === 1 || banner.is_active === true;
      const newActive = currentActive ? 0 : 1;
      await cmsService.updateBanner(banner.uuid || banner.id, { is_active: newActive });
      toast.success(`Banner ${newActive ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update banner status: ' + err.message);
    }
  };

  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({ title: '', subtitle: '', active: true, position: 'hero', ctaText: '', ctaLink: '' });
    setShowBannerModal(true);
  };

  const openEditBanner = (banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      active: banner.is_active === 1 || banner.is_active === true,
      position: banner.position || 'hero',
      ctaText: banner.cta_text || '',
      ctaLink: banner.cta_link || ''
    });
    setShowBannerModal(true);
  };

  const handleBannerSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        position: bannerForm.position,
        is_active: bannerForm.active ? 1 : 0,
        cta_text: bannerForm.ctaText,
        cta_link: bannerForm.ctaLink
      };

      if (editingBanner) {
        await cmsService.updateBanner(editingBanner.uuid || editingBanner.id, payload);
        toast.success('Banner updated successfully');
      } else {
        await cmsService.createBanner(payload);
        toast.success('Banner created successfully');
      }
      setShowBannerModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save banner: ' + err.message);
    }
  };

  const handleBannerDelete = async (bannerId) => {
    if (window.confirm('Delete this banner permanently?')) {
      try {
        await cmsService.deleteBanner(bannerId);
        toast.success('Banner deleted');
        loadData();
      } catch (err) {
        toast.error('Failed to delete banner: ' + err.message);
      }
    }
  };

  const handleSeoSave = (e) => {
    e.preventDefault();
    toast.success('Global SEO metadata updated');
  };

  if (isLoading && bannersList.length === 0) {
    return (
      <div className="cms-page flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading storefront CMS...</p>
      </div>
    );
  }

  return (
    <div className="cms-page animate-fade-in">
      {/* Tab Navigation */}
      <div className="settings-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`settings-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
          id="marketing-tab-campaigns"
        >
          Campaigns & SEO
        </button>
        <button
          className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
          id="marketing-tab-notifications"
        >
          Notifications
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <>
          <div className="cms-header">
            <div>
              <h1 className="cms-title">Storefront <span className="text-gradient">CMS</span></h1>
              <p className="cms-subtitle">Manage hero banners, SEO metadata, and featured content</p>
            </div>
            <Button variant="primary" onClick={() => toast.success('Publishing changes to edge network...')}>
              🚀 Publish Live
            </Button>
          </div>

          <div className="cms-grid">
            {/* Banner Management */}
            <section className="cms-section span-2">
              <div className="section-header">
                <h2 className="section-title">Hero & Promo Banners</h2>
                <Button variant="outline" size="small" onClick={openAddBanner}>+ Create Banner</Button>
              </div>
              <div className="cms-table-container ">
                <table className="cms-table">
                  <thead>
                    <tr>
                      <th>Content</th>
                      <th>Position</th>
                      <th>Call to Action</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannersList.length === 0 ? (
                      <tr><td colSpan="5" className="empty-row">No banners configured.</td></tr>
                    ) : (
                      bannersList.map(banner => {
                        const isActive = banner.is_active === 1 || banner.is_active === true;
                        return (
                          <tr key={banner.uuid || banner.id}>
                            <td>
                              <div className="banner-content-cell">
                                <strong>{banner.title}</strong>
                                <span>{banner.subtitle}</span>
                              </div>
                            </td>
                            <td><span className="cms-tag">{banner.position}</span></td>
                            <td>
                              {banner.cta_text ? (
                                <div className="cta-preview">
                                  <span className="cta-btn">{banner.cta_text}</span>
                                  <span className="cta-link">{banner.cta_link}</span>
                                </div>
                              ) : (
                                <span className="cms-tag-muted">None</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-chip ${isActive ? 'active' : 'inactive'}`}>
                                {isActive ? 'Active' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button className="action-btn-sm outline" onClick={() => toggleBanner(banner)}>
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button className="action-btn-sm outline" onClick={() => openEditBanner(banner)}>✏️</button>
                                <button className="action-btn-sm outline danger" onClick={() => handleBannerDelete(banner.uuid || banner.id)}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Global SEO Editor */}
            <section className="cms-section">
              <div className="section-header">
                <h2 className="section-title">Global SEO</h2>
              </div>
              <form className="seo-form " onSubmit={handleSeoSave}>
                <div className="form-group">
                  <label>Meta Title</label>
                  <input 
                    type="text" 
                    value={seoForm.title} 
                    onChange={e => setSeoForm({...seoForm, title: e.target.value})} 
                    required 
                  />
                  <span className="char-count">{seoForm.title.length} / 60</span>
                </div>
                <div className="form-group">
                  <label>Meta Description</label>
                  <textarea 
                    rows="4" 
                    value={seoForm.description} 
                    onChange={e => setSeoForm({...seoForm, description: e.target.value})}
                    required
                  ></textarea>
                  <span className="char-count">{seoForm.description.length} / 160</span>
                </div>
                <div className="form-group">
                  <label>Keywords (comma separated)</label>
                  <input 
                    type="text" 
                    value={seoForm.keywords} 
                    onChange={e => setSeoForm({...seoForm, keywords: e.target.value})} 
                  />
                </div>
                <Button variant="primary" type="submit" style={{ width: '100%' }}>Update SEO Data</Button>
              </form>
            </section>

            {/* Featured Products (Read-Only Preview) */}
            <section className="cms-section span-3">
              <div className="section-header">
                <h2 className="section-title">Catalog Preview (Manage in Menu Module)</h2>
              </div>
              <div className="cms-table-container ">
                <table className="cms-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Base Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList.length === 0 ? (
                      <tr><td colSpan="4" className="empty-row">No products found.</td></tr>
                    ) : (
                      productsList.slice(0, 5).map(product => {
                        const isActive = product.is_active === 1 || product.is_active === true;
                        return (
                          <tr key={product.id}>
                            <td><strong>{product.name}</strong></td>
                            <td><span className="cms-tag">{product.category_name || 'Coffee'}</span></td>
                            <td>{formatCurrency(product.base_price || product.basePrice)}</td>
                            <td>
                              <span className={`status-chip ${isActive ? 'active' : 'inactive'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}

      {activeTab === 'notifications' && <Notifications />}

      {/* Banner Modal */}
      {showBannerModal && activeTab === 'campaigns' && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-content cms-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Edit Banner' : 'Create Banner'}</h2>
              <button className="modal-close" onClick={() => setShowBannerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBannerSave} className="cms-modal-form">
              <div className="form-group">
                <label>Banner Title</label>
                <input type="text" required value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Subtitle / Copy</label>
                <textarea rows="2" required value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})}></textarea>
              </div>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Position</label>
                  <select value={bannerForm.position} onChange={e => setBannerForm({...bannerForm, position: e.target.value})}>
                    <option value="hero">Hero (Top of page)</option>
                    <option value="promo">Promo Strip (Middle)</option>
                    <option value="footer">Footer Banner</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={bannerForm.active ? 'true' : 'false'} onChange={e => setBannerForm({...bannerForm, active: e.target.value === 'true'})}>
                    <option value="true">Active (Published)</option>
                    <option value="false">Inactive (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="form-section-header">Call to Action (Optional)</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Button Text</label>
                  <input type="text" placeholder="e.g. Shop Now" value={bannerForm.ctaText} onChange={e => setBannerForm({...bannerForm, ctaText: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Destination Link</label>
                  <input type="text" placeholder="e.g. /catalog" value={bannerForm.ctaLink} onChange={e => setBannerForm({...bannerForm, ctaLink: e.target.value})} />
                </div>
              </div>

              <div className="modal-footer">
                <Button variant="ghost" type="button" onClick={() => setShowBannerModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">{editingBanner ? 'Save Changes' : 'Create Banner'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMS;
