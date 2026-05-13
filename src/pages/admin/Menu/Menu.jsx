import React, { useState } from 'react';
import './Menu.css';
import Button from '../../../components/Button/Button';

const Menu = () => {
  const [products, setProducts] = useState([
    { id: 1, title: 'Dark Roast Concentrate', price: 999, category: 'Concentrates', status: 'Active' },
    { id: 2, title: 'Vanilla Infused Cold Brew', price: 1199, category: 'Ready to Drink', status: 'Active' },
    { id: 3, title: 'Hazelnut Dream', price: 1299, category: 'Specialty', status: 'Inactive' }
  ]);

  return (
    <div className="menu-view">
      <div className="view-header">
        <h2 className="section-title">Product & Menu Management</h2>
        <Button variant="primary" size="small">Add New Product</Button>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.title}</td>
                <td>{product.category}</td>
                <td>₹{product.price}</td>
                <td>
                  <span className={`status-chip ${product.status.toLowerCase()}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn edit">Edit</button>
                  <button className="action-btn delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Menu;
