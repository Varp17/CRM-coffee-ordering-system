import React, { useState, useEffect } from 'react';
import './Roles.css';
import Button from '../../../components/Button/Button';
import { roleService } from '../../../services/roles';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const ALL_PERMISSIONS = [
  { module: 'Dashboard', actions: ['View', 'Export'] },
  { module: 'Orders', actions: ['View', 'Edit', 'Refund', 'Delete'] },
  { module: 'Menu', actions: ['View', 'Edit', 'Create', 'Delete'] },
  { module: 'Inventory', actions: ['View', 'Edit', 'Adjust', 'Transfer'] },
  { module: 'Customers', actions: ['View', 'Edit', 'Contact'] },
  { module: 'Roles', actions: ['View', 'Edit', 'Assign'] },
  { module: 'Financials', actions: ['View', 'Export'] },
  { module: 'CMS', actions: ['View', 'Edit', 'Publish'] },
];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const res = await roleService.getAll();
      setRoles(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load roles: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({ 
      name: role.name, 
      description: role.description || '', 
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : [] 
    });
    setShowModal(true);
  };

  const handlePermissionToggle = (permissionName) => {
    setFormData(prev => {
      const perms = [...prev.permissions];
      if (permissionName === 'All Access') {
        return { ...prev, permissions: perms.includes('All Access') ? [] : ['All Access'] };
      }
      
      const newPerms = perms.filter(p => p !== 'All Access');
      if (newPerms.includes(permissionName)) {
        return { ...prev, permissions: newPerms.filter(p => p !== permissionName) };
      } else {
        return { ...prev, permissions: [...newPerms, permissionName] };
      }
    });
  };

  const handleDelete = async (id) => {
    const roleToDelete = roles.find(r => r.id === id);
    if (roleToDelete?.name === 'Super Admin' || roleToDelete?.name === 'Admin') {
      toast.error('Cannot delete system default roles');
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await roleService.delete(id);
        toast.success('Role deleted successfully');
        loadRoles();
      } catch (err) {
        toast.error('Failed to delete role: ' + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingRole && editingRole.name === 'Super Admin') {
      toast.error('Cannot modify Super Admin role');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      };

      if (editingRole) {
        await roleService.update(editingRole.id, payload);
        toast.success('Role updated successfully');
      } else {
        await roleService.create(payload);
        toast.success('Role created successfully');
      }
      setShowModal(false);
      loadRoles();
    } catch (err) {
      toast.error('Failed to save role: ' + err.message);
    }
  };

  if (isLoading && roles.length === 0) {
    return (
      <div className="roles-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="roles-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">Roles & Access Management (RBAC)</h2>
          <p className="section-subtitle">Define permission sets and assign operational roles</p>
        </div>
        <Button variant="primary" onClick={openAddModal}>+ Create Custom Role</Button>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-card-header">
              <div className="role-title-group">
                <h3>{role.name}</h3>
                <span className={`user-count ${role.users > 0 ? 'active' : ''}`}>
                  👥 {role.users} {role.users === 1 ? 'User' : 'Users'}
                </span>
              </div>
              <div className="role-actions">
                <button className="icon-btn" onClick={() => openEditModal(role)}>✏️</button>
                {role.name !== 'Super Admin' && role.name !== 'Admin' && (
                  <button className="icon-btn danger" onClick={() => handleDelete(role.id)}>🗑️</button>
                )}
              </div>
            </div>
            
            <p className="role-desc">{role.description}</p>
            
            <div className="role-permissions">
              <h4>Assigned Permissions:</h4>
              <div className="perm-tags">
                {Array.isArray(role.permissions) && role.permissions.includes('All Access') ? (
                  <span className="perm-tag all-access">🌟 Full System Access (All Modules)</span>
                ) : (
                  Array.isArray(role.permissions) && role.permissions.map((perm, i) => (
                    <span key={i} className="perm-tag">{perm}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content roles-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="roles-form">
              <div className="form-group">
                <label>Role Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Regional Manager" 
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of responsibilities" 
                />
              </div>

              <div className="permissions-matrix-section">
                <div className="matrix-header">
                  <h3>Permission Matrix</h3>
                  <label className="all-access-toggle">
                    <input 
                      type="checkbox" 
                      checked={formData.permissions.includes('All Access')}
                      onChange={() => handlePermissionToggle('All Access')}
                    />
                    <span>Grant Full "All Access" (Super User)</span>
                  </label>
                </div>

                {!formData.permissions.includes('All Access') && (
                  <div className="matrix-grid">
                    {ALL_PERMISSIONS.map(module => {
                      const isModuleChecked = formData.permissions.includes(module.module);
                      
                      return (
                        <div key={module.module} className="matrix-module-card">
                          <label className="module-header-toggle">
                            <input 
                              type="checkbox" 
                              checked={isModuleChecked}
                              onChange={() => handlePermissionToggle(module.module)}
                            />
                            <strong>{module.module}</strong>
                          </label>
                          <div className="module-actions-list">
                            {module.actions.map(action => (
                              <label key={action} className="action-toggle">
                                <input 
                                  type="checkbox" 
                                  checked={isModuleChecked}
                                  onChange={() => !isModuleChecked && handlePermissionToggle(module.module)}
                                />
                                <span>{action}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button variant="primary" type="submit">{editingRole ? 'Update Role' : 'Create Role'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
