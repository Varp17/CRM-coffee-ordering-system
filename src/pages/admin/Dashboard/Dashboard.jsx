import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-view">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Reporting & Analytics</h2>
        <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: 'var(--color-primary)', color: '#1c0e08', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }} onClick={() => alert('Exporting financial data to Zoho Books...')}>Export to Zoho</button>
          <button style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: '600' }} onClick={() => alert('Exporting financial data to Tally...')}>Export to Tally</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">₹1,25,000</span>
          <span className="stat-sub">+12% from last month</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Total Orders</span>
          <span className="stat-value">1,240</span>
          <span className="stat-sub">+5% from last month</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Active Customers</span>
          <span className="stat-value">450</span>
          <span className="stat-sub">+8% from last month</span>
        </div>
      </div>

      {/* Simulated Chart */}
      <div className="chart-section glass">
        <h3 className="section-subtitle">Weekly Revenue Trend</h3>
        <div className="bar-chart">
          <div className="chart-bar" style={{ height: '40%' }} data-label="Mon"><span className="bar-val">₹12k</span></div>
          <div className="chart-bar" style={{ height: '60%' }} data-label="Tue"><span className="bar-val">₹18k</span></div>
          <div className="chart-bar" style={{ height: '50%' }} data-label="Wed"><span className="bar-val">₹15k</span></div>
          <div className="chart-bar" style={{ height: '80%' }} data-label="Thu"><span className="bar-val">₹24k</span></div>
          <div className="chart-bar" style={{ height: '70%' }} data-label="Fri"><span className="bar-val">₹21k</span></div>
          <div className="chart-bar" style={{ height: '95%' }} data-label="Sat"><span className="bar-val">₹28k</span></div>
          <div className="chart-bar" style={{ height: '90%' }} data-label="Sun"><span className="bar-val">₹27k</span></div>
        </div>
      </div>

      {/* Top Products */}
      <div className="cms-table-container glass">
        <h3 className="section-subtitle" style={{ padding: '20px 20px 0' }}>Top Selling Products</h3>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Sales</th>
              <th>Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dark Roast Concentrate</td>
              <td>Concentrates</td>
              <td>350</td>
              <td>₹3,49,650</td>
            </tr>
            <tr>
              <td>Vanilla Infused Cold Brew</td>
              <td>Ready to Drink</td>
              <td>220</td>
              <td>₹2,63,780</td>
            </tr>
            <tr>
              <td>Hazelnut Dream</td>
              <td>Specialty</td>
              <td>150</td>
              <td>₹1,94,850</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
