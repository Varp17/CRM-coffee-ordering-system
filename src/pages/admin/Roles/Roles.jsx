import React, { useState } from 'react';
import './Roles.css';
import Button from '../../../components/Button/Button';

const Roles = () => {
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', users: 2, permissions: ['All Access'] },
    { id: 2, name: 'Barista', users: 5, permissions: ['View Orders', 'Update Order Status'] },
    { id: 3, name: 'Inventory Manager', users: 1, permissions: ['View Inventory', 'Update Stock'] }
  ]);

  return (
    <div className="roles-view">
      <div className="view-header">
        <h2 className="section-title">Role & Access Management</h2>
        <Button variant="primary" size="small">Add New Role</Button>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Active Users</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td>{role.users}</td>
                <td>
                  <div className="permissions-list">
                    {role.permissions.map((perm, index) => (
                      <span key={index} className="permission-tag">{perm}</span>
                    ))}
                  </div>
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

export default Roles;
