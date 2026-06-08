import React, { useState, useEffect } from 'react';
import './CentralInventory.css';
import Button from '../../../components/Button/Button';
import { api } from '../../../services/api';
import { unwrapList, unwrapData } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Archive, Package, Activity } from 'lucide-react';
import InventoryCard from './components/InventoryCard';
import InventoryTimeline from './components/InventoryTimeline';
import MovementModal from './components/MovementModal';

const CentralInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, logsRes] = await Promise.all([
        api.get('/production/central-inventory'),
        api.get('/production/distribution')
      ]);
      setInventory(unwrapData(invRes));
      setLogs(unwrapList(logsRes));
    } catch (err) {
      toast.error('Failed to load central inventory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAvailable = inventory.reduce((acc, item) => acc + (item.available_qty || 0), 0);
  const totalReserved = inventory.reduce((acc, item) => acc + (item.reserved_qty || 0), 0);
  const totalCapacity = 10000; // Simulated total capacity in L for demonstration

  return (
    <div className="crm-dashboard">
      <div className="crm-header">
        <div className="crm-header-left">
          <h2>Central Warehouse</h2>
          <p>Real-time visibility into central stock availability and distribution commitments.</p>
        </div>
        <div className="crm-header-actions">
          <Button variant="ghost" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Record Movement
          </Button>
        </div>
      </div>

      <div className="crm-content">
        <div className="ci-top-metrics">
          <div className="crm-card metric-card">
            <span className="metric-icon"><Archive size={20} /></span>
            <div>
              <p className="metric-label">Total Available</p>
              <h3 className="metric-value">{(totalAvailable / 1000).toFixed(2)} L</h3>
            </div>
          </div>
          <div className="crm-card metric-card">
            <span className="metric-icon warning"><Package size={20} /></span>
            <div>
              <p className="metric-label">Total Reserved</p>
              <h3 className="metric-value">{(totalReserved / 1000).toFixed(2)} L</h3>
            </div>
          </div>
          <div className="crm-card metric-card">
            <span className="metric-icon info"><Activity size={20} /></span>
            <div>
              <p className="metric-label">Warehouse Capacity</p>
              <h3 className="metric-value">{(((totalAvailable + totalReserved) / totalCapacity) * 100).toFixed(1)}%</h3>
            </div>
          </div>
        </div>

        <div className="ci-grid">
          <div className="ci-main-col">
            <div className="crm-section-title">Stock Levels</div>
            <div className="ci-cards-list">
              {loading ? (
                <p>Loading inventory...</p>
              ) : inventory.length > 0 ? (
                inventory.map((item) => (
                  <InventoryCard key={item.product.id} item={item} />
                ))
              ) : (
                <p>No inventory found.</p>
              )}
            </div>
          </div>
          <div className="ci-side-col">
            <div className="crm-section-title">Recent Distribution</div>
            <div className="crm-card ci-timeline-card">
              {loading ? <p>Loading logs...</p> : <InventoryTimeline logs={logs} />}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <MovementModal
          onClose={() => setShowModal(false)}
          onSuccess={loadData}
          products={inventory.map(i => i.product)}
        />
      )}
    </div>
  );
};

export default CentralInventory;
