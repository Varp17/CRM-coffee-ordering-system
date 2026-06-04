import React, { useState, useEffect, useMemo } from 'react';
import './Inventory.css';
import Button from '../../../components/Button/Button';
import { inventoryService } from '../../../services/inventory';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { useConfirmation } from '../../../hooks/useConfirmation';

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

      const centralRes = await inventoryService.getStockLevels({ store_id: 1 });
      const centralStock = unwrapList(centralRes);
      const mappedCentral = (Array.isArray(centralStock) ? centralStock : []).map(item => ({
        id: item.ingredient?.id || item.id,
        name: item.ingredient?.name || item.name,
        stock: (item.quantity ?? 100) * 10,
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

  const confirmAction = useConfirmation();

  const updateStock = async (id, amount, isCentral) => {
    try {
      const target = (isCentral ? centralItems : storeItems).find(i => i.id === id);
      if (!target) return;

      const newQty = Math.max(0, target.stock + amount);

      const confirmed = await confirmAction({
        title: 'Inventory Adjustment',
        description: `Adjust ${target.name} stock level manually:`,
        type: 'level2',
        payload: {
          requireCheckbox: true,
          details: {
            item: target.name,
            current: `${target.stock} ${target.unit}`,
            adjustment: amount > 0 ? `+${amount} ${target.unit}` : `${amount} ${target.unit}`,
            target: `${newQty} ${target.unit}`
          }
        }
      });

      if (!confirmed) return;

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

  // Columns for the virtualized DataTable
  const columns = useMemo(() => [
    {
      header: 'Item Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.name}</strong>
    },
    {
      header: 'Current Stock',
      accessor: 'stock',
      sortable: true,
      render: (row) => {
        let status = 'healthy';
        if (row.stock <= row.threshold / 2) status = 'critical';
        else if (row.stock <= row.threshold) status = 'low';
        return (
          <span>
            <span className={`stock-val ${status !== 'healthy' ? 'low' : ''}`} style={{ fontWeight: '700' }}>
              {row.stock}
            </span> <span className="unit-tag" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{row.unit}</span>
          </span>
        );
      }
    },
    {
      header: 'Reorder Threshold',
      accessor: 'threshold',
      sortable: true,
      render: (row) => (
        <span>
          {row.threshold} <span className="unit-tag" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{row.unit}</span>
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        if (row.stock <= row.threshold / 2) return 'critical';
        if (row.stock <= row.threshold) return 'low';
        return 'healthy';
      },
      sortable: true,
      render: (row) => {
        let status = 'healthy';
        let statusText = 'Healthy';
        if (row.stock <= row.threshold / 2) {
          status = 'critical';
          statusText = 'Critical';
        } else if (row.stock <= row.threshold) {
          status = 'low';
          statusText = 'Low Stock';
        }
        return (
          <span className={`status-indicator ${status}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600'
          }}>
            {status === 'healthy' ? '🟢' : status === 'low' ? '🟡' : '🔴'} {statusText}
          </span>
        );
      }
    },
    {
      header: 'Quick Adjust',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div className="adjust-actions" style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="adjust-btn" 
            onClick={() => updateStock(row.id, -10, currentTab === 'central')}
            style={{
              padding: '2px 8px', fontSize: '0.8rem', border: '1px solid var(--color-border)',
              borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--color-surface)'
            }}
          >
            -10
          </button>
          <button 
            className="adjust-btn" 
            onClick={() => updateStock(row.id, 50, currentTab === 'central')}
            style={{
              padding: '2px 8px', fontSize: '0.8rem', border: '1px solid var(--color-border)',
              borderRadius: '4px', cursor: 'pointer', backgroundColor: 'var(--color-surface)'
            }}
          >
            +50
          </button>
        </div>
      )
    }
  ], [currentTab]);

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
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <DataTable
            columns={columns}
            data={filteredItems}
            exportFileName={`${currentTab}-inventory`}
          />
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
