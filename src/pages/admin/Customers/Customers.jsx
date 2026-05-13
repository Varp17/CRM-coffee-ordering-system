import React, { useState } from 'react';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', orders: 5, totalSpent: 4500, status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', orders: 2, totalSpent: 2200, status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', orders: 1, totalSpent: 1200, status: 'Inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', orders: 10, totalSpent: 9500, status: 'Active' }
  ]);

  return (
    <div className="customers-view">
      <div className="view-header">
        <h2 className="section-title">Customer Data Management</h2>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Total Orders</th>
              <th>Total Spent (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.orders}</td>
                <td>₹{customer.totalSpent}</td>
                <td>
                  <span className={`status-chip ${customer.status.toLowerCase()}`}>
                    {customer.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn">View History</button>
                  <button className="action-btn edit">Contact</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
