import React, { useState } from 'react';
import './CMS.css';
import Button from '../../../components/Button/Button';

const CMS = () => {
  const [banners, setBanners] = useState([
    { id: 1, title: 'Summer Special', subtitle: 'Get 20% off on all cold brews', active: true },
    { id: 2, title: 'New Arrival', subtitle: 'Try our new Hazelnut Dream', active: false }
  ]);

  const [products, setProducts] = useState([
    { id: 1, title: 'Dark Roast Concentrate', price: '$12.99', stock: 50 },
    { id: 2, title: 'Vanilla Infused Cold Brew', price: '$14.99', stock: 30 },
    { id: 3, title: 'Hazelnut Dream', price: '$13.99', stock: 20 }
  ]);

  const toggleBanner = (id) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, active: !banner.active } : banner
    ));
  };

  return (
    <div className="cms-page">
      <div className="cms-header">
        <h1 className="cms-title">Website <span className="text-gradient">CMS</span></h1>
        <p className="cms-subtitle">Manage your website content here.</p>
      </div>

      {/* Banner Management */}
      <section className="cms-section">
        <div className="section-header">
          <h2 className="section-title">Hero Banners</h2>
          <Button variant="primary" size="small">Add New Banner</Button>
        </div>
        <div className="cms-table-container glass">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subtitle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(banner => (
                <tr key={banner.id}>
                  <td>{banner.title}</td>
                  <td>{banner.subtitle}</td>
                  <td>
                    <span className={`status-chip ${banner.active ? 'active' : 'inactive'}`}>
                      {banner.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => toggleBanner(banner.id)}>
                      {banner.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="action-btn edit">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Content Management */}
      <section className="cms-section">
        <div className="section-header">
          <h2 className="section-title">Products</h2>
          <Button variant="primary" size="small">Add New Product</Button>
        </div>
        <div className="cms-table-container glass">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>
                    <button className="action-btn edit">Edit</button>
                    <button className="action-btn delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CMS;
