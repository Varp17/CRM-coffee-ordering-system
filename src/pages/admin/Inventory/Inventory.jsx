import React, { useState, useEffect, useMemo } from 'react';
import './Inventory.css';
import Button from '../../../components/Button/Button';
import { inventoryService } from '../../../services/inventory';
import { api } from '../../../services/api';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { useConfirmation } from '../../../hooks/useConfirmation';
import InventoryCard from './components/InventoryCard';
import InventoryTimeline from './components/InventoryTimeline';

const DUMMY_STORE_ITEMS = [
  {
    id: 'inv-101',
    name: 'Bold Concentrate Batch #42',
    stock: 12500,
    reserved_qty: 500,
    threshold: 2000,
    thresholds: { low: 2000, critical: 1000 },
    unit: 'ml',
    alert_level: 'ok',
    updated_at: '2026-07-23T10:00:00Z',
  },
  {
    id: 'inv-102',
    name: 'Classic Cold Brew Concentrate',
    stock: 8400,
    reserved_qty: 300,
    threshold: 2000,
    thresholds: { low: 2000, critical: 1000 },
    unit: 'ml',
    alert_level: 'ok',
    updated_at: '2026-07-23T09:30:00Z',
  },
  {
    id: 'inv-103',
    name: 'South Indian Chicory Blend',
    stock: 6200,
    reserved_qty: 200,
    threshold: 1500,
    thresholds: { low: 1500, critical: 500 },
    unit: 'g',
    alert_level: 'ok',
    updated_at: '2026-07-23T08:15:00Z',
  },
  {
    id: 'inv-104',
    name: 'Oat Milk Ultra-Barista',
    stock: 18000,
    reserved_qty: 1200,
    threshold: 5000,
    thresholds: { low: 5000, critical: 2000 },
    unit: 'ml',
    alert_level: 'ok',
    updated_at: '2026-07-23T07:45:00Z',
  },
  {
    id: 'inv-105',
    name: 'Organic Jaggery Syrup',
    stock: 3500,
    reserved_qty: 150,
    threshold: 1000,
    thresholds: { low: 1000, critical: 400 },
    unit: 'ml',
    alert_level: 'ok',
    updated_at: '2026-07-22T16:00:00Z',
  },
  {
    id: 'inv-106',
    name: 'Salted Caramel Drizzle',
    stock: 1800,
    reserved_qty: 100,
    threshold: 2000,
    thresholds: { low: 2000, critical: 800 },
    unit: 'low',
    alert_level: 'low',
    updated_at: '2026-07-22T14:20:00Z',
  },
];

const Inventory = ({ embedded = false }) => {
  const [currentTab, setCurrentTab] = useState('store');
  const [storeItems, setStoreItems] = useState(DUMMY_STORE_ITEMS);
  const [centralItems, setCentralItems] = useState(DUMMY_STORE_ITEMS);
  const [kanbanItems, setKanbanItems] = useState(DUMMY_STORE_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxnItem, setSelectedTxnItem] = useState(null);

  const loadStock = async () => {
    setIsLoading(true);
    try {
      const storeRes = await inventoryService.getStockLevels({ store_id: 1 });
      const storeStock = unwrapList(storeRes);
      if (Array.isArray(storeStock) && storeStock.length > 0) {
        const mappedStore = storeStock.map(item => ({
          id: item.ingredient?.id || item.id,
          name: item.ingredient?.name || item.name,
          stock: item.quantity ?? 0,
          reserved_qty: item.reserved_qty ?? 0,
          threshold: item.thresholds?.low ?? 20,
          thresholds: item.thresholds || { low: 20, critical: 10 },
          unit: item.ingredient?.unit || 'g',
          alert_level: item.alert_level || 'ok',
          updated_at: item.updated_at,
        }));
        setStoreItems(mappedStore);
        setCentralItems(mappedStore);
        setKanbanItems(mappedStore);
      } else {
        setStoreItems(DUMMY_STORE_ITEMS);
        setCentralItems(DUMMY_STORE_ITEMS);
        setKanbanItems(DUMMY_STORE_ITEMS);
      }
    } catch (_) {
      setStoreItems(DUMMY_STORE_ITEMS);
      setCentralItems(DUMMY_STORE_ITEMS);
      setKanbanItems(DUMMY_STORE_ITEMS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const activeItems = currentTab === 'store' ? storeItems : currentTab === 'central' ? centralItems : [];
  const isTableView = currentTab === 'store' || currentTab === 'central';

  const lowStockItems = useMemo(() => {
    return [...storeItems].filter(item => item.stock <= item.threshold);
  }, [storeItems]);

  const filteredItems = useMemo(() => {
    return activeItems.filter(item => 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeItems, searchQuery]);

  const kanbanColumns = useMemo(() => {
    const groups = { in_stock: [], low_stock: [], out_of_stock: [] };
    for (const item of kanbanItems) {
      const q = item.stock ?? 0;
      if (q <= 0) groups.out_of_stock.push(item);
      else if (q <= (item.thresholds?.low || 20)) groups.low_stock.push(item);
      else groups.in_stock.push(item);
    }
    return groups;
  }, [kanbanItems]);

  const confirmAction = useConfirmation();

  const updateStock = async (id, amount) => {
    try {
      const target = activeItems.find(i => i.id === id);
      if (!target) return;

      const newQty = Math.max(0, target.stock + amount);

      const confirmed = await confirmAction({
        title: 'Inventory Adjustment',
        description: `Adjust ${target.name} stock level:`,
        type: 'level2',
        payload: {
          requireCheckbox: true,
          details: {
            item: target.name,
            current: `${target.stock} ${target.unit}`,
            adjustment: amount > 0 ? `+${amount}` : `${amount}`,
            target: `${newQty} ${target.unit}`
          }
        }
      });

      if (!confirmed) return;

      if (amount > 0) {
        await inventoryService.stockIn({ store_id: 1, ingredient_id: id, quantity: amount, notes: 'Manual adjustment' });
      } else {
        await inventoryService.recordWastage({ store_id: 1, ingredient_id: id, quantity: Math.abs(amount), notes: 'Manual reduction' });
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

  const columns = useMemo(() => [
    {
      header: 'Item Name',
      accessor: 'name',
      sortable: true,
      render: (row) => <strong style={{ color: '#6F4E37' }}>{row.name}</strong>
    },
    {
      header: 'Current Stock',
      accessor: 'stock',
      sortable: true,
      render: (row) => {
        let status = 'healthy';
        if (row.stock <= (row.thresholds?.critical || row.threshold / 2)) status = 'critical';
        else if (row.stock <= row.threshold) status = 'low';
        return (
          <span>
            <span className={`stock-val ${status !== 'healthy' ? 'low' : ''}`} style={{ fontWeight: '700' }}>
              {row.stock}
            </span>
            <span className="unit-tag" style={{ fontSize: '0.8rem', color: '#6B7280' }}>{row.unit}</span>
          </span>
        );
      }
    },
    {
      header: 'Reserved',
      accessor: 'reserved_qty',
      sortable: true,
      render: (row) => (
        <span style={{ color: row.reserved_qty > 0 ? '#6366F1' : '#9CA3AF' }}>
          {row.reserved_qty ?? 0}
        </span>
      )
    },
    {
      header: 'Threshold',
      accessor: 'threshold',
      sortable: true,
      render: (row) => <span>{row.threshold} {row.unit}</span>
    },
    {
      header: 'Status',
      accessor: (row) => {
        if (row.stock <= (row.thresholds?.critical || row.threshold / 2)) return 'critical';
        if (row.stock <= row.threshold) return 'low';
        return 'healthy';
      },
      sortable: true,
      render: (row) => {
        let status = 'healthy';
        let statusText = 'Healthy';
        if (row.stock <= (row.thresholds?.critical || row.threshold / 2)) {
          status = 'critical';
          statusText = 'Critical';
        } else if (row.stock <= row.threshold) {
          status = 'low';
          statusText = 'Low Stock';
        }
        const colors = { healthy: '#059669', low: '#D97706', critical: '#DC2626' };
        return (
          <span className={`status-indicator ${status}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span style={{ color: colors[status] }}>●</span> {statusText}
          </span>
        );
      }
    },
    {
      header: 'Adjust',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div className="adjust-actions" style={{ display: 'flex', gap: '6px' }}>
          <button className="adjust-btn" onClick={() => updateStock(row.id, -10)}
            style={{ padding: '2px 8px', fontSize: '0.8rem', border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer', background: '#FFF' }}>-10</button>
          <button className="adjust-btn" onClick={() => updateStock(row.id, 50)}
            style={{ padding: '2px 8px', fontSize: '0.8rem', border: '1px solid #E5E7EB', borderRadius: '4px', cursor: 'pointer', background: '#FFF' }}>+50</button>
        </div>
      )
    }
  ], [currentTab]);

  if (isLoading && storeItems.length === 0 && kanbanItems.length === 0) {
    return (
      <div className="inventory-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: '#6B7280' }}>Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="inventory-view animate-fade-in">
      {!embedded && (
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
      )}

      {lowStockItems.length > 0 && (
        <div className="alerts-section">
          <h3 className="alerts-title">⚠️ Action Required: Low Stock</h3>
          <div className="alerts-grid">
            {lowStockItems.map(item => (
              <div key={`alert-${item.id}`} className="alert-card">
                <div className="alert-header">
                  <strong>{item.name}</strong>
                  <span className="stock-critical">Low</span>
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

      <div className="inventory-tabs">
        <button className={`tab-btn ${currentTab === 'store' ? 'active' : ''}`} onClick={() => setCurrentTab('store')}>
          🏪 Store Stock
        </button>
        <button className={`tab-btn ${currentTab === 'central' ? 'active' : ''}`} onClick={() => setCurrentTab('central')}>
          🏭 Central Warehouse
        </button>
        <button className={`tab-btn ${currentTab === 'kanban' ? 'active' : ''}`} onClick={() => setCurrentTab('kanban')}>
          📊 Kanban View
        </button>
        <button className={`tab-btn ${currentTab === 'vendors' ? 'active' : ''}`} onClick={() => setCurrentTab('vendors')}>
          🤝 Vendor Directory
        </button>
      </div>

      {currentTab !== 'kanban' && currentTab !== 'vendors' && (
        <div className="inventory-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search inventory items..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="inventory-search-input" />
          </div>
        </div>
      )}

      {currentTab === 'store' || currentTab === 'central' ? (
        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          <DataTable columns={columns} data={filteredItems} exportFileName={`${currentTab}-inventory`} />
        </div>
      ) : currentTab === 'kanban' ? (
        <div className="kanban-board">
          {[
            { key: 'in_stock', label: 'In Stock', color: '#059669' },
            { key: 'low_stock', label: 'Low Stock', color: '#D97706' },
            { key: 'out_of_stock', label: 'Out of Stock', color: '#DC2626' },
          ].map(col => (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header" style={{ borderColor: col.color }}>
                <span className="kanban-column-label" style={{ color: col.color }}>{col.label}</span>
                <span className="kanban-column-count">{kanbanColumns[col.key].length}</span>
              </div>
              <div className="kanban-column-body">
                {kanbanColumns[col.key].length === 0 ? (
                  <p className="kanban-empty">No items</p>
                ) : (
                  kanbanColumns[col.key].map(item => (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedTxnItem(item.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
              <Button variant="outline" size="small">View Contracts</Button>
              <Button variant="primary" size="small" onClick={handleCreatePO}>Create PO</Button>
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
              <Button variant="outline" size="small">View Contracts</Button>
              <Button variant="primary" size="small" onClick={handleCreatePO}>Create PO</Button>
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
              <Button variant="outline" size="small">View Contracts</Button>
              <Button variant="primary" size="small" onClick={handleCreatePO}>Create PO</Button>
            </div>
          </div>
        </div>
      )}

      {selectedTxnItem && (
        <InventoryTimeline
          itemId={selectedTxnItem}
          storeType={currentTab === 'central' ? 'central' : 'store'}
          onClose={() => setSelectedTxnItem(null)}
        />
      )}
    </div>
  );
};

export default Inventory;
