import React, { useState, useEffect } from 'react';
import { Users, Store, ChevronRight, Plus, Trash2, Edit2, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { roleService } from '../../../services/roles';
import { storeService } from '../../../services/stores';
import { unwrapList } from '../../../utils/apiResponse';
import { useAuthStore } from '../../../store/useAuthStore';
import Button from '../../../components/Button/Button';
import toast from 'react-hot-toast';
import './Settings.css';

const TABS = [
  { id: 'roles',  label: 'Roles',  icon: Shield },
  { id: 'stores', label: 'Stores', icon: Store },
];

const PERMISSIONS = [
  { key: 'orders',    label: 'Order Management' },
  { key: 'inventory', label: 'Inventory & Stock' },
  { key: 'shifts',    label: 'Staff Shifts & Time' },
  { key: 'cash',      label: 'Cash Register & Register Logs' },
  { key: 'kot',       label: 'Kitchen Orders (KOT)' },
  { key: 'barista',   label: 'Barista Display' },
  { key: 'all',       label: 'Super Admin - All Access' },
];

const DEFAULT_ROLE_COLORS = {
  super_admin: '#DC2626',
  admin: '#D97706',
  store_manager: '#2563EB',
  barista: '#16A34A',
  customer: '#6B7280',
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auth Store
  const userRole = useAuthStore((state) => state.role);
  const isSuperAdmin = userRole === 'super_admin';
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';

  // Modals
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    timezone: 'Asia/Kolkata',
    is_active: true,
  });

  // ── LOAD ROLES ──
  const loadRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await roleService.getAll();
      setRoles(unwrapList(res));
    } catch (err) {
      setError('Failed to load roles: ' + err.message);
      toast.error('Failed to load roles.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── LOAD STORES ──
  const loadStores = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await storeService.getAll();
      setStores(unwrapList(res));
    } catch (err) {
      setError('Failed to load stores: ' + err.message);
      toast.error('Failed to load stores.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load active tab data
  useEffect(() => {
    if (activeTab === 'roles') {
      loadRoles();
    } else if (activeTab === 'stores') {
      loadStores();
    }
  }, [activeTab]);

  // ── ROLE ACTIONS ──
  const openAddRole = () => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can configure roles.');
      return;
    }
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  const openEditRole = (role) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can modify roles.');
      return;
    }
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error('Role name is required.');
      return;
    }
    try {
      if (editingRole) {
        await roleService.update(editingRole.id, roleForm);
        toast.success(`Role "${roleForm.name}" updated successfully!`);
      } else {
        await roleService.create(roleForm);
        toast.success(`Role "${roleForm.name}" configured successfully!`);
      }
      setShowRoleModal(false);
      loadRoles();
    } catch (err) {
      toast.error('Failed to save role: ' + err.message);
    }
  };

  const handleRoleDelete = async (role) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can delete roles.');
      return;
    }
    const nameLower = role.name.toLowerCase().replace(/ /g, '_');
    const defaults = ['super_admin', 'admin', 'store_manager', 'barista', 'customer'];
    if (defaults.includes(nameLower)) {
      toast.error('Default system roles cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        await roleService.delete(role.id);
        toast.success(`Role "${role.name}" deleted successfully.`);
        loadRoles();
      } catch (err) {
        toast.error('Failed to delete role: ' + err.message);
      }
    }
  };

  const handlePermissionToggle = (key) => {
    setRoleForm((prev) => {
      const alreadyChecked = prev.permissions.includes(key);
      let nextPerms = [];
      if (alreadyChecked) {
        nextPerms = prev.permissions.filter((p) => p !== key);
      } else {
        nextPerms = [...prev.permissions, key];
      }
      return { ...prev, permissions: nextPerms };
    });
  };

  // ── STORE ACTIONS ──
  const openAddStore = () => {
    if (!isAdminUser) {
      toast.error('Only Admins or Super Admins can configure stores.');
      return;
    }
    setEditingStore(null);
    setStoreForm({
      name: '',
      address: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560008',
      phone: '+91 98765 43210',
      email: '',
      timezone: 'Asia/Kolkata',
      is_active: true,
    });
    setShowStoreModal(true);
  };

  const openEditStore = (store) => {
    if (!isAdminUser) {
      toast.error('Only Admins or Super Admins can modify store settings.');
      return;
    }
    setEditingStore(store);
    setStoreForm({
      name: store.name,
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      phone: store.phone || '',
      email: store.email || '',
      timezone: store.timezone || 'Asia/Kolkata',
      is_active: store.is_active,
    });
    setShowStoreModal(true);
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) {
      toast.error('Store name is required.');
      return;
    }
    try {
      const payload = {
        ...storeForm,
        email: storeForm.email || `${storeForm.name.toLowerCase().replace(/ /g, '')}@digitalcoffee.in`,
      };
      if (editingStore) {
        await storeService.update(editingStore._pk, payload);
        toast.success(`Store "${storeForm.name}" updated successfully!`);
      } else {
        await storeService.create(payload);
        toast.success(`New Store "${storeForm.name}" deployed successfully!`);
      }
      setShowStoreModal(false);
      loadStores();
    } catch (err) {
      toast.error('Failed to save store: ' + err.message);
    }
  };

  const handleToggleStoreStatus = async (store) => {
    if (!isAdminUser) {
      toast.error('Only Admins or Super Admins can toggle store statuses.');
      return;
    }
    const nextActive = !store.is_active;
    try {
      await storeService.update(store._pk, { is_active: nextActive });
      toast.success(`Store status updated successfully.`);
      loadStores();
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="settings-view animate-fade-in">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">System Settings</h1>
          <p className="settings-sub">Roles, physical store locations, and system audit logs</p>
        </div>
        <button
          className="btn-sm-ghost refresh-btn"
          onClick={() => activeTab === 'roles' ? loadRoles() : loadStores()}
          aria-label="Refresh settings data"
          id="btn-settings-refresh"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setError(null); }}
            id={`settings-tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            role="tab"
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button className="error-retry" onClick={() => activeTab === 'roles' ? loadRoles() : loadStores()}>Retry</button>
        </div>
      )}

      {/* Tab Panels */}
      <div className="settings-panel" id={`panel-${activeTab}`} role="tabpanel">

        {/* ── LOADING SPINNER ── */}
        {isLoading && (
          <div className="loading-spinner-wrap">
            <div className="loading-spinner"></div>
            <p>Fetching settings configurations...</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── ROLES & ACCESS ── */}
            {activeTab === 'roles' && (
              <div className="settings-roles">
                <div className="panel-header-row">
                  <div>
                    <h2>Roles & Access Control</h2>
                    <p>Configure permissions and privileges mapping for staff roles.</p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      className="btn-sm-primary"
                      onClick={openAddRole}
                      id="btn-add-role"
                    >
                      <Plus size={13} /> Add Role
                    </button>
                  )}
                </div>

                <div className="roles-list">
                  {roles.map((role) => {
                    const nameLower = role.name.toLowerCase().replace(/ /g, '_');
                    const color = DEFAULT_ROLE_COLORS[nameLower] || '#6B7280';
                    const isDefault = ['super_admin', 'admin', 'store_manager', 'barista', 'customer'].includes(nameLower);

                    return (
                      <div className="role-card" key={role.id || role.name}>
                        <div className="role-color" style={{ background: color }} />
                        <div className="role-info">
                          <strong>{role.name}</strong>
                          <span className="role-desc">{role.description || 'No description provided.'}</span>
                          <div className="role-permission-badges">
                            {role.permissions && role.permissions.length > 0 ? (
                              role.permissions.map((p) => (
                                <span key={p} className="permission-badge">{p}</span>
                              ))
                            ) : (
                              <span className="permission-badge none">no permissions</span>
                            )}
                          </div>
                        </div>
                        <div className="role-users">
                          <Users size={12} />
                          <span>{role.users} active {role.users === 1 ? 'user' : 'users'}</span>
                        </div>
                        <div className="role-actions">
                          {isSuperAdmin && (
                            <>
                              <button
                                className="icon-btn"
                                aria-label={`Edit ${role.name}`}
                                onClick={() => openEditRole(role)}
                                id={`edit-role-${role.id}`}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                className="icon-btn danger"
                                aria-label={`Delete ${role.name}`}
                                onClick={() => handleRoleDelete(role)}
                                disabled={isDefault}
                                id={`delete-role-${role.id}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {roles.length === 0 && <p className="empty-message">No roles configured in system.</p>}
                </div>
              </div>
            )}

            {/* ── STORES ── */}
            {activeTab === 'stores' && (
              <div className="settings-stores">
                <div className="panel-header-row">
                  <div>
                    <h2>Physical Store Locations</h2>
                    <p>Add and manage geographic outlets, timezone bounds, and operating status.</p>
                  </div>
                  {isAdminUser && (
                    <button
                      className="btn-sm-primary"
                      onClick={openAddStore}
                      id="btn-add-store"
                    >
                      <Plus size={13} /> Add Store
                    </button>
                  )}
                </div>

                <div className="stores-grid">
                  {stores.map((store) => {
                    const statusText = store.is_active ? 'Open' : 'Closed';
                    const isCentral = store.config?.is_central_kitchen === true;
                    return (
                      <div className="store-card" key={store.id}>
                        <div className="store-card-top">
                          <div className="store-icon">
                            <Store size={18} />
                          </div>
                          <span className={`store-status ${statusText.toLowerCase()}`}>
                            {statusText}
                          </span>
                        </div>
                        <strong className="store-name">{store.name}</strong>
                        <span className="store-type">{isCentral ? 'Central Kitchen' : 'Physical Store'}</span>
                        <span className="store-address">{store.address}, {store.city}</span>
                        <span className="store-contact">{store.phone}</span>
                        
                        <div className="store-card-actions">
                          {isAdminUser && (
                            <>
                              <button
                                className="store-edit-btn"
                                onClick={() => openEditStore(store)}
                                id={`edit-store-${store.id}`}
                              >
                                Edit Settings <ChevronRight size={12} />
                              </button>
                              <button
                                className={`store-toggle-btn ${store.is_active ? 'danger' : 'success'}`}
                                onClick={() => handleToggleStoreStatus(store)}
                                id={`toggle-store-${store.id}`}
                              >
                                {store.is_active ? 'Close' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {stores.length === 0 && <p className="empty-message">No stores configured.</p>}
                </div>
              </div>
            )}


          </>
        )}
      </div>

      {/* ── ROLE ADD/EDIT MODAL ── */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRole ? 'Edit Privilege Role' : 'Configure New Role'}</h3>
            <form onSubmit={handleRoleSubmit} id="role-modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="role-name">Role Name *</label>
                  <input
                    id="role-name"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    required
                    placeholder="e.g. Lead Barista"
                    disabled={editingRole && ['super admin', 'admin', 'store manager', 'barista', 'customer'].includes(editingRole.name.toLowerCase())}
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="role-desc">Description</label>
                  <input
                    id="role-desc"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Short summary of role permissions..."
                  />
                </div>

                {/* Permissions checklist */}
                <div className="form-group full-width">
                  <label className="checkbox-section-label">Permissions Scope Mapping *</label>
                  <div className="permissions-grid">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="checkbox-label" id={`label-perm-${perm.key}`}>
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(perm.key)}
                          onChange={() => handlePermissionToggle(perm.key)}
                          id={`chk-perm-${perm.key}`}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowRoleModal(false)} id="btn-role-cancel">Cancel</Button>
                <Button type="submit" variant="primary" id="btn-role-submit">
                  {editingRole ? 'Update Role' : 'Deploy Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STORE ADD/EDIT MODAL ── */}
      {showStoreModal && (
        <div className="modal-overlay" onClick={() => setShowStoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingStore ? 'Edit Branch Configurations' : 'Configure New Franchise'}</h3>
            <form onSubmit={handleStoreSubmit} id="store-modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="store-name">Franchise Name *</label>
                  <input
                    id="store-name"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    required
                    placeholder="e.g. Digital Coffee Indiranagar"
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="store-address">Street Address *</label>
                  <input
                    id="store-address"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    required
                    placeholder="e.g. 100ft Road, Indiranagar"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="store-city">City *</label>
                  <input
                    id="store-city"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="store-state">State *</label>
                  <input
                    id="store-state"
                    value={storeForm.state}
                    onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="store-pincode">Pincode *</label>
                  <input
                    id="store-pincode"
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="store-phone">Phone Number *</label>
                  <input
                    id="store-phone"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="store-email">Branch Email Contact</label>
                  <input
                    id="store-email"
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    placeholder="indiranagar@digitalcoffee.in"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowStoreModal(false)} id="btn-store-cancel">Cancel</Button>
                <Button type="submit" variant="primary" id="btn-store-submit">
                  {editingStore ? 'Save Branch' : 'Deploy Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
