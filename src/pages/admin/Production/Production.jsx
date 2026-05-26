import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { unwrapList } from '../../../utils/apiResponse';

const Production = () => {
  const [productionBatches, setProductionBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduction = async () => {
      try {
        setError('');
        const response = await api.get('/production');
        setProductionBatches(unwrapList(response));
      } catch (error) {
        setError(error.message || 'Failed to fetch production batches.');
        console.error('Failed to fetch production:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduction();
  }, []);

  return (
    <div className="orders-view">
      <div className="view-header">
        <h2 className="section-title">Production Batches</h2>
      </div>

      <div className="cms-table-container glass">
        {loading ? (
          <p>Loading production batches...</p>
        ) : error ? (
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {productionBatches.map((batch, index) => (
                <tr key={batch.id || index}>
                  <td>{batch.id}</td>
                  <td>{batch.product_name}</td>
                  <td>{batch.quantity}</td>
                  <td>{batch.status}</td>
                </tr>
              ))}
              {productionBatches.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No production batches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Production;
