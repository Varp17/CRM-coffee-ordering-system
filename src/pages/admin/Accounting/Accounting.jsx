import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import './Accounting.css'; // Optional: We can reuse Orders.css or create a new one

const Accounting = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounting = async () => {
      try {
        const response = await api.get('/accounting/sync/logs');
        setReports(response.data.data || response.data || []);
      } catch (error) {
        console.error('Failed to fetch accounting logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounting();
  }, []);

  return (
    <div className="orders-view">
      <div className="view-header">
        <h2 className="section-title">Accounting & Finance</h2>
      </div>

      <div className="cms-table-container glass">
        {loading ? (
          <p>Loading accounting data...</p>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Order ID</th>
                <th>Target Provider</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr key={report.id || index}>
                  <td>#{report.id}</td>
                  <td>#{report.order_id}</td>
                  <td>{report.provider || 'Zoho'}</td>
                  <td>
                    <span className={`status-badge ${report.status?.toLowerCase() === 'failed' ? 'failed' : 'success'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{new Date(report.created_at || report.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No accounting sync logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Accounting;
