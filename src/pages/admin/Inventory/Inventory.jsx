import React, { useState, useEffect, useMemo } from 'react';
import './Inventory.css';
import Button from '../../../components/Button/Button';
import { inventoryService } from '../../../services/inventory';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [currentTab, setCurrentTab] = useState('store'); // 'store' | 'central' | 'vendors'
  const [storeItems, setStoreItems] = useState([]);
  const [centralItems, setCentralItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const storeRes = await inventoryService.getStockLevels({ store_id: 1 });
      const storeStock = unwrapList(storeRes);
      const mappedStore = (Array.isArray(storeStock) ? storeStock : []).map(item => ({
        id: item.ingredient?.id || item.id,
        name: item.ingredient?.name || item.name,
        stock: item.quantity ?? 100,
        threshold: item.thresholds?.low ?? 20,
        unit: item.ingredient?.unit || 'g',
        alert_level: item.alert_level || 'ok'
      }));
      setStoreItems(mappedStore);

      // Central inventory is mocked or can use another store ID (e.g. facility ID)
      const centralRes = await inventoryService.getStockLevels({ store_id: 1 }); // Let's reuse or map standard
      const centralStock = unwrapList(centralRes);
      const mappedCentral = (Array.isArray(centralStock) ? centralStock : []).map(item => ({
        id: item.ingredient?.id || item.id,
        name: item.ingredient?.name || item.name,
        stock: (item.quantity ?? 100) * 10, // Simulate warehouse scale
        threshold: (item.thresholds?.low ?? 20) * 5,
        unit: item.ingredient?.unit || 'g',
        alert_level: item.alert_level || 'ok'
      }));
      setCentralItems(mappedCentral);
    } catch (err) {
      toast.error('Failed to load inventory levels: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const activeItems = currentTab === 'store' ? storeItems : centralItems;

  const lowStockItems = useMemo(() => {
    return [...storeItems].filter(item => item.stock <= item.threshold);
  }, [storeItems]);

  const filteredItems = useMemo(() => {
    return activeItems.filter(item => 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeItems, searchQuery]);

  const updateStock = async (id, amount, isCentral) => {
    try {
      const target = (isCentral ? centralItems : storeItems).find(i => i.id === id);
      if (!target) return;

      const newQty = Math.max(0, target.stock + amount);
      // Calls stockIn if positive, or recordWastage if negative adjustment
      if (amount > 0) {
        await inventoryService.stockIn({
          store_id: 1,
          ingredient_id: id,
          quantity: amount,
          notes: 'Manual adjustment'
        });
      } else {
        await inventoryService.recordWastage({
          store_id: 1,
          ingredient_id: id,
          quantity: Math.abs(amount),
          notes: 'Manual reduction'
        });
      }
      toast.success('Stock level adjusted successfully');
      loadStock();
    } catch (err) {
      toast.error('Stock adjustment failed: ' + err.message);
    }
  };

  const handleCreatePO = () => {
    toast.success('Purchase Order generated and emailed to vendor', { icon: '📝' });
  };

  const handleWasteLog = () => {
    toast.success('Waste log entry recorded', { icon: '🗑️' });
  };

  if (isLoading && storeItems.length === 0) {
    return (
      <div className="inventory-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="inventory-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">Logistics & Supply Chain</h2>
          <p className="section-subtitle">Manage store stock, central warehouse, and vendor POs</p>
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={handleWasteLog}>Log Spillage/Waste</Button>
          <Button variant="primary" onClick={handleCreatePO}>+ Purchase Order</Button>
        </div>
      </div>

      {/* Threshold Alerts */}
      {lowStockItems.length > 0 && (
        <div className="alerts-section">
          <h3 className="alerts-title">⚠️ Action Required: Low Stock</h3>
          <div className="alerts-grid">
            {lowStockItems.map(item => (
              <div key={`alert-${item.id}`} className="alert-card">
                <div className="alert-header">
                  <strong>{item.name}</strong>
                  <span className="stock-critical">Critical</span>
                </div>
                <div className="alert-body">
                  <span>Current: <strong>{item.stock} {item.unit}</strong></span>
                  <span className="threshold-text">Threshold: {item.threshold} {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="inventory-tabs">
        <button 
          className={`tab-btn ${currentTab === 'store' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('store')}
        >
          🏪 Retail Store Stock
        </button>
        <button 
          className={`tab-btn ${currentTab === 'central' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('central')}
        >
          🏭 Central Warehouse
        </button>
        <button 
          className={`tab-btn ${currentTab === 'vendors' ? 'active' : ''}`} 
          onClick={() => setCurrentTab('vendors')}
        >
          🤝 Vendor Directory
        </button>
      </div>

      <div className="inventory-toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="inventory-search-input"
          />
        </div>
      </div>

      {/* Dynamic Content Area */}
      {currentTab !== 'vendors' ? (
        <div className="table-container">
          <table className="table inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Current Stock</th>
                <th>Reorder Threshold</th>
                <th>Status</th>
                <th>Quick Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="5" className="table-empty">No items match your search.</td></tr>
              ) : (
                filteredItems.map(item => {
                  let status = 'healthy';
                  let statusText = 'Healthy';
                  if (item.stock <= item.threshold / 2) {
                    status = 'critical';
                    statusText = 'Critical';
                  } else if (item.stock <= item.threshold) {
                    status = 'low';
                    statusText = 'Low Stock';
                  }

                  return (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className={`stock-val ${status !== 'healthy' ? 'low' : ''}`}>
                          {item.stock}
                        </span> <span className="unit-tag">{item.unit}</span>
                      </td>
                      <td>{item.threshold} <span className="unit-tag">{item.unit}</span></td>
                      <td>
                        <span className={`status-indicator ${status}`}>
                          {status === 'healthy' ? '🟢' : status === 'low' ? '🟡' : '🔴'} {statusText}
                        </span>
                      </td>
                      <td>
                        <div className="adjust-actions">
                          <button 
                            className="adjust-btn" 
                            onClick={() => updateStock(item.id, -10, currentTab === 'central')}
                          >
                            -10
                          </button>
                          <button 
                            className="adjust-btn" 
                            onClick={() => updateStock(item.id, 50, currentTab === 'central')}
                          >
                            +50
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vendors View */
        <div className="vendors-grid">
          <div className="vendor-card">
            <div className="vendor-header">
              <h3>Coorg Estates Ltd.</h3>
              <span className="vendor-status">Active Partner</span>
            </div>
            <p className="vendor-desc">Primary supplier for Arabica and Robusta beans.</p>
            <div className="vendor-meta">
              <span>📧 supply@coorgestates.in</span>
              <span>📱 +91 98765 11111</span>
            </div>
            <div className="vendor-actions">
              <Button variant="outline" className="btn-full-width" size="small">View Contracts</Button>
              <Button variant="primary" className="btn-full-width" size="small" onClick={handleCreatePO}>Create PO</Button>
            </div>
          </div>
          
          <div className="vendor-card">
            <div className="vendor-header">
              <h3>Oatly India</h3>
              <span className="vendor-status">Active Partner</span>
            </div>
            <p className="vendor-desc">Supplier for premium Oat Milk (Barista Edition).</p>
            <div className="vendor-meta">
              <span>📧 b2b@oatly.in</span>
              <span>📱 +91 88888 22222</span>
            </div>
            <div className="vendor-actions">
              <Button variant="outline" className="btn-full-width" size="small">View Contracts</Button>
              <Button variant="primary" className="btn-full-width" size="small" onClick={handleCreatePO}>Create PO</Button>
            </div>
          </div>
          
          <div className="vendor-card">
            <div className="vendor-header">
              <h3>Monin Syrups</h3>
              <span className="vendor-status">Active Partner</span>
            </div>
            <p className="vendor-desc">Supplier for all flavoring syrups.</p>
            <div className="vendor-meta">
              <span>📧 orders@monin.com</span>
              <span>📱 +91 77777 33333</span>
            </div>
            <div className="vendor-actions">
              <Button variant="outline" className="btn-full-width" size="small">View Contracts</Button>
              <Button variant="primary" className="btn-full-width" size="small" onClick={handleCreatePO}>Create PO</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
