import React, { useState } from 'react';
import './Inventory.css';
import Button from '../../../components/Button/Button';

const Inventory = () => {
  const [currentTab, setCurrentTab] = useState('store');
  
  const [storeItems, setStoreItems] = useState([
    { id: 1, name: 'Coffee Concentrate', stock: 5000, unit: 'ml', threshold: 1000 },
    { id: 2, name: 'Vanilla Syrup', stock: 2000, unit: 'ml', threshold: 500 },
    { id: 3, name: 'Oat Milk', stock: 10000, unit: 'ml', threshold: 2000 },
    { id: 4, name: 'Coffee Beans', stock: 5000, unit: 'g', threshold: 1000 }
  ]);

  const [centralItems, setCentralItems] = useState([
    { id: 1, name: 'Raw Coffee Beans', stock: 500, unit: 'kg', threshold: 100 },
    { id: 2, name: 'Concentrate Batch A', stock: 100, unit: 'liters', threshold: 20 },
    { id: 3, name: 'Packaging Boxes', stock: 1000, unit: 'pcs', threshold: 200 }
  ]);

  const updateStock = (id, amount, isCentral) => {
    const items = isCentral ? centralItems : storeItems;
    const setItems = isCentral ? setCentralItems : setStoreItems;
    
    setItems(items.map(item =>
      item.id === id ? { ...item, stock: Math.max(0, item.stock + amount) } : item
    ));
  };

  const activeItems = currentTab === 'store' ? storeItems : centralItems;

  return (
    <div className="inventory-view">
      <div className="view-header">
        <h2 className="section-title">Inventory Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: currentTab === 'store' ? 'var(--color-primary)' : 'transparent', color: currentTab === 'store' ? '#1c0e08' : 'var(--color-text)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCurrentTab('store')}>Store Stock</button>
          <button style={{ background: currentTab === 'central' ? 'var(--color-primary)' : 'transparent', color: currentTab === 'central' ? '#1c0e08' : 'var(--color-text)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCurrentTab('central')}>Central Facility</button>
          <Button variant="primary" size="small">Add New Item</Button>
        </div>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Alert Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.stock}</td>
                <td>{item.unit}</td>
                <td>{item.threshold}</td>
                <td>
                  <span className={`status-chip ${item.stock <= item.threshold ? 'inactive' : 'active'}`}>
                    {item.stock <= item.threshold ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => updateStock(item.id, currentTab === 'store' ? 500 : 5, currentTab === 'central')}>+{currentTab === 'store' ? 500 : 5}</button>
                  <button className="action-btn delete" onClick={() => updateStock(item.id, currentTab === 'store' ? -500 : -5, currentTab === 'central')}>-{currentTab === 'store' ? 500 : 5}</button>
                  <button className="action-btn edit">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentTab === 'central' && (
        <div className="distribution-section glass" style={{ marginTop: '20px', padding: '20px', borderRadius: 'var(--border-radius-l)' }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '10px' }}>Distribution Tracking</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Track raw materials and WIP distribution across channels.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
            <div><strong>D2C Channel:</strong> 20 Liters sent</div>
            <div><strong>Kiosk Channel:</strong> 50 Liters sent</div>
            <div><strong>B2B Channel:</strong> 30 Liters sent</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
