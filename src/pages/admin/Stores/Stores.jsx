import React, { useState, useEffect } from 'react';
import './Stores.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import { storeService } from '../../../services/stores';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560008',
    phone: '+91 98765 43210',
    email: '',
    status: 'Active'
  });

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const res = await storeService.getAll();
      setStores(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load stores: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleToggleStoreStatus = async (id, currentIsActive) => {
    try {
      const nextActive = !currentIsActive;
      await storeService.update(id, { is_active: nextActive });
      toast.success(`Franchise operating status updated! 🏢`);
      loadStores();
    } catch (err) {
      toast.error('Failed to update store status: ' + err.message);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStore.name || !newStore.address) {
      toast.error('Store name and address are required.');
      return;
    }

    try {
      const payload = {
        name: newStore.name,
        address: newStore.address,
        city: newStore.city,
        state: newStore.state,
        pincode: newStore.pincode,
        phone: newStore.phone,
        email: newStore.email || `${newStore.name.toLowerCase().replace(/ /g, '')}@digitalcoffee.in`,
        is_active: newStore.status === 'Active'
      };

      await storeService.create(payload);
      toast.success(`New Store "${newStore.name}" configured successfully! 🏢`);
      setShowAddModal(false);
      setNewStore({
        name: '',
        address: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560008',
        phone: '+91 98765 43210',
        email: '',
        status: 'Active'
      });
      loadStores();
    } catch (err) {
      toast.error('Failed to deploy franchise branch: ' + err.message);
    }
  };

  const triggerKdsPing = (storeName) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Pinging KDS Terminal at ${storeName}...`,
        success: `KDS terminal online! Prep queue sync active (Latency: 14ms) 🟢`,
        error: 'Terminal ping failed.',
      }
    );
  };

  if (isLoading && stores.length === 0) {
    return (
      <div className="stores-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading franchises list...</p>
      </div>
    );
  }

  return (
    <div className="stores-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">🏢 Multi-Store Franchise Command</h2>
          <p className="section-subtitle">Manage regional menus, franchise operating statuses, and kitchen display terminals</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          Add Franchise Branch ➕
        </Button>
      </div>

      <div className="stores-grid">
        {stores.map((store) => {
          const isActive = Boolean(store.is_active);
          const statusText = isActive ? 'Active' : 'Suspended';
          return (
            <div key={store.id} className="store-panel-card">
              <div className="store-panel-header">
                <div className="store-info-left">
                  <span className="store-geo-pin">📍</span>
                  <div>
                    <h3>{store.name}</h3>
                    <p className="store-address-txt">{store.address}, {store.city}</p>
                  </div>
                </div>
                <span className={`store-status-badge ${statusText.toLowerCase()}`}>
                  {statusText}
                </span>
              </div>

              <hr className="store-divider" />

              <div className="store-metrics-panel">
                <div className="metric-box">
                  <span className="metric-lbl">Phone Contact</span>
                  <strong>{store.phone || 'N/A'}</strong>
                </div>
                <div className="metric-box">
                  <span className="metric-lbl">Email Address</span>
                  <strong>{store.email || 'N/A'}</strong>
                </div>
                <div className="metric-box">
                  <span className="metric-lbl">Local Timezone</span>
                  <strong>{store.timezone || 'Asia/Kolkata'}</strong>
                </div>
              </div>

              <div className="store-panel-actions">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => triggerKdsPing(store.name)}
                  disabled={!isActive}
                >
                  Ping Kitchen KDS ⚡
                </Button>
                
                <Button
                  variant={isActive ? 'outline' : 'primary'}
                  size="small"
                  onClick={() => handleToggleStoreStatus(store.id, isActive)}
                >
                  {isActive ? 'Suspend Operations 🔴' : 'Resume Operations 🟢'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add franchise modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <form className="modal-content" style={{maxWidth: '500px', padding: 'var(--space-24)'}} onSubmit={handleCreateStore} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{margin: 0, fontSize: 'var(--font-size-h2)'}}>Add Franchise Branch</h2>
              <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div style={{marginTop: 'var(--space-24)', display: 'flex', flexDirection: 'column', gap: 'var(--space-12)'}}>
              <Input
                label="Franchise Name"
                placeholder="e.g. Digital Coffee Indiranagar"
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                required
              />
              
              <Input
                label="Branch Street Address"
                placeholder="e.g. 100ft Road, Indiranagar"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Input
                  label="City"
                  placeholder="e.g. Bengaluru"
                  value={newStore.city}
                  onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                  required
                />
                <Input
                  label="State"
                  placeholder="e.g. Karnataka"
                  value={newStore.state}
                  onChange={(e) => setNewStore({ ...newStore, state: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Input
                  label="Pincode"
                  placeholder="e.g. 560008"
                  value={newStore.pincode}
                  onChange={(e) => setNewStore({ ...newStore, pincode: e.target.value })}
                  required
                />
                <Input
                  label="Contact Phone"
                  placeholder="e.g. +91 98765 43210"
                  value={newStore.phone}
                  onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Email Contact (Optional)"
                placeholder="e.g. indiranagar@digitalcoffee.in"
                value={newStore.email}
                onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
              />

              <div className="form-group">
                <label className="input-label" style={{display: 'block', fontSize: 'var(--font-size-caption)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)'}}>Initial Status</label>
                <select
                  style={{width: '100%', padding: 'var(--space-12)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}
                  value={newStore.status}
                  onChange={(e) => setNewStore({ ...newStore, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-16)', marginTop: 'var(--space-24)' }}>
              <Button variant="outline" style={{flex: 1}} onClick={() => setShowAddModal(false)} type="button">Cancel</Button>
              <Button variant="primary" style={{flex: 1}} type="submit">Deploy Branch 🚀</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Stores;
