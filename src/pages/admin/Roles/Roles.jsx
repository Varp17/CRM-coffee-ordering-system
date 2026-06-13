import React, { useState, useEffect, useMemo } from 'react';
import './Roles.css';
import Button from '../../../components/Button/Button';
import { roleService } from '../../../services/roles';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Save, 
  Trash2,
  Lock,
  Globe,
  AlertCircle,
  Search,
  BookOpen,
  Info
} from 'lucide-react';

const ALL_MODULES = [
  { key: 'Dashboard', label: 'Dashboard', desc: 'Analytics, overview metrics, and sales charts' },
  { key: 'Orders', label: 'Orders Management', desc: 'View, edit, cancel, and refund customer orders' },
  { key: 'Menu', label: 'Menu & Recipes (R&D)', desc: 'Manage products, ingredients, recipes, and rules' },
  { key: 'Inventory', label: 'Stock & Inventory', desc: 'Central inventory, transfers, and wastage logs' },
  { key: 'Customers', label: 'Customer Management', desc: 'Customer profiles, support queries, and tickets' },
  { key: 'Roles', label: 'Roles & Staffing', desc: 'Define access sets, staff profiles, and shifts' },
  { key: 'Financials', label: 'Financials & Reports', desc: 'Daily operations reporting and performance audits' },
  { key: 'CMS', label: 'Settings & CMS', desc: 'Modify stores, banners, coupons, and configurations' }
];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const res = await roleService.getAll();
      const loadedRoles = unwrapList(res);
      setRoles(loadedRoles);
      
      // Auto-select first role or preserve selected one
      if (loadedRoles.length > 0) {
        if (selectedRole) {
          const current = loadedRoles.find(r => r.id === selectedRole.id);
          if (current) {
            handleSelectRole(current);
            return;
          }
        }
        handleSelectRole(loadedRoles[0]);
      }
    } catch (err) {
      toast.error('Failed to load roles: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setSelectedPermissions(Array.isArray(role.permissions) ? [...role.permissions] : []);
  };

  const handleNewRole = () => {
    setSelectedRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPermissions([]);
  };

  const togglePermission = (permKey) => {
    if (selectedRole?.name === 'Super Admin') {
      toast.error('Cannot modify Super Admin system permissions');
      return;
    }
    setSelectedPermissions(prev => {
      if (permKey === 'All Access') {
        return prev.includes('All Access') ? [] : ['All Access', ...ALL_MODULES.map(m => m.key)];
      }
      const newPerms = prev.filter(p => p !== 'All Access');
      if (newPerms.includes(permKey)) {
        return newPerms.filter(p => p !== permKey);
      } else {
        return [...newPerms, permKey];
      }
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (selectedRole && selectedRole.name === 'Super Admin') {
      toast.error('Cannot modify system Super Admin role');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: roleName,
        description: roleDesc,
        permissions: selectedPermissions
      };

      if (selectedRole) {
        await roleService.update(selectedRole.id, payload);
        toast.success('Role updated successfully');
      } else {
        await roleService.create(payload);
        toast.success('Role created successfully');
      }
      await loadRoles();
    } catch (err) {
      toast.error('Failed to save role: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    
    if (selectedRole.name === 'Super Admin' || selectedRole.name === 'Store Admin' || selectedRole.name === 'Admin') {
      toast.error('Cannot delete system default roles');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
      try {
        await roleService.delete(selectedRole.id);
        toast.success('Role deleted successfully');
        setSelectedRole(null);
        await loadRoles();
      } catch (err) {
        toast.error('Failed to delete role: ' + err.message);
      }
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [roles, searchQuery]);

  if (isLoading && roles.length === 0) {
    return (
      <div className="roles-loading flex-center">
        <div className="spinner"></div>
        <p>Loading roles and security matrix...</p>
      </div>
    );
  }

  const isSuperAdminRole = selectedRole?.name === 'Super Admin';

  return (
    <div className="roles-view-container animate-fade-in">
      {/* Header Banner */}
      <div className="roles-header-banner">
        <div className="banner-content">
          <div className="banner-icon-wrapper">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1>Roles & Access Management (RBAC)</h1>
            <p>Define dynamic access levels, operational permissions, and functional scopes for all staff members</p>
          </div>
        </div>
        <Button variant="primary" onClick={handleNewRole} className="new-role-btn">
          <Plus className="w-4 h-4" /> Create Custom Role
        </Button>
      </div>

      {/* Main 3-Column Grid */}
      <div className="roles-matrix-layout">
        
        {/* Column 1: Roles List */}
        <div className="matrix-column roles-list-card">
          <div className="column-header">
            <h3>System Roles</h3>
            <span className="badge">{roles.length} Roles</span>
          </div>
          
          <div className="search-box-wrapper">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="roles-items-list">
            {filteredRoles.map(role => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`role-item-btn ${isSelected ? 'active' : ''}`}
                >
                  <div className="role-item-info">
                    <div className="role-item-title">
                      <h4>{role.name}</h4>
                      {role.name === 'Super Admin' && <span className="sys-badge">System</span>}
                    </div>
                    <p className="role-item-desc">{role.description || 'No description provided.'}</p>
                    <span className="role-item-users-count">
                      👥 {role.users || 0} {role.users === 1 ? 'staff member' : 'staff members'}
                    </span>
                  </div>
                  <ChevronRight className="chevron-icon" />
                </button>
              );
            })}
            {filteredRoles.length === 0 && (
              <div className="empty-state">
                <Info className="w-8 h-8 text-[#94a3b8] mb-2" />
                <p>No roles match your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Permission Matrix */}
        <div className="matrix-column permission-matrix-card">
          <div className="column-header">
            <h3>Permission Matrix</h3>
            <p className="column-subtitle">Select accessible modules for this operational role</p>
          </div>

          <div className="matrix-control-group">
            <div className="all-access-banner">
              <div className="all-access-info">
                <strong>Grant Full Administrative Access</strong>
                <p>Bypasses all module filters to authorize access to every dashboard and configuration option.</p>
              </div>
              <label className="switch-toggle">
                <input 
                  type="checkbox" 
                  checked={selectedPermissions.includes('All Access') || isSuperAdminRole}
                  onChange={() => togglePermission('All Access')}
                  disabled={isSuperAdminRole}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          <div className="modules-list">
            {ALL_MODULES.map(module => {
              const hasAccess = selectedPermissions.includes('All Access') || selectedPermissions.includes(module.key) || isSuperAdminRole;
              return (
                <div 
                  key={module.key} 
                  className={`module-permission-row ${hasAccess ? 'authorized' : ''} ${isSuperAdminRole ? 'disabled' : ''}`}
                  onClick={() => !isSuperAdminRole && togglePermission(module.key)}
                >
                  <div className="module-info-cell">
                    <div className="module-title-group">
                      <h4>{module.label}</h4>
                      <span className="module-key-badge">{module.key}</span>
                    </div>
                    <p>{module.desc}</p>
                  </div>
                  <div className="module-checkbox-cell">
                    <div className={`matrix-checkbox ${hasAccess ? 'checked' : ''}`}>
                      {hasAccess && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Identity & Configuration Details */}
        <div className="matrix-column role-details-card">
          <div className="column-header border-bottom">
            <h3>Role Properties</h3>
          </div>

          <form onSubmit={handleSave} className="role-properties-form">
            <div className="form-field">
              <label>Role Identifier Name</label>
              <input 
                type="text" 
                required 
                value={roleName} 
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g., Regional Lead"
                disabled={isSuperAdminRole}
                className="prop-input"
              />
            </div>
            
            <div className="form-field">
              <label>Functional Scope Description</label>
              <textarea 
                rows={4}
                value={roleDesc} 
                onChange={e => setRoleDesc(e.target.value)}
                placeholder="e.g., Manages inventories and raw materials across store clusters"
                disabled={isSuperAdminRole}
                className="prop-textarea"
              />
            </div>

            {isSuperAdminRole && (
              <div className="sys-lock-warning">
                <Lock className="w-4 h-4" />
                <span>System role properties are locked for core security integrity.</span>
              </div>
            )}

            <div className="properties-actions">
              {!isSuperAdminRole && (
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={saving} 
                  className="save-matrix-btn"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              )}
              
              {selectedRole && !isSuperAdminRole && selectedRole.name !== 'Store Admin' && selectedRole.name !== 'Admin' && (
                <Button 
                  variant="danger" 
                  type="button" 
                  onClick={handleDelete}
                  className="delete-role-btn"
                >
                  <Trash2 className="w-4 h-4" /> Delete Role
                </Button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Roles;
