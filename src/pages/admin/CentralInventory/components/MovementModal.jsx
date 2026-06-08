import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import { api } from '../../../../services/api';
import toast from 'react-hot-toast';

const MovementModal = ({ onClose, onSuccess, products }) => {
  const [form, setForm] = useState({
    product_id: '',
    quantity_ml: '',
    channel: 'store',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real scenario, this would likely be a distribution or adjustment endpoint
      // Assuming distribution for now since that's what removes from central inventory
      await api.post('/production/distribute', {
        batch_id: form.product_id, // Note: The distribute endpoint currently expects a batch_id, not just a product
        quantity_ml: form.quantity_ml,
        channel: form.channel,
        notes: form.notes
      });
      toast.success('Movement recorded successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to record movement: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h3>Record Stock Movement</h3>
        <p style={{ color: '#6B7280', marginBottom: '24px', fontSize: '14px' }}>
          Distribute central inventory to stores or other channels.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Product</label>
              <select 
                value={form.product_id} 
                onChange={(e) => setForm({...form, product_id: e.target.value})}
                required
              >
                <option value="">Select product...</option>
                {products?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity (ml)</label>
              <input 
                type="number" 
                value={form.quantity_ml}
                onChange={(e) => setForm({...form, quantity_ml: e.target.value})}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Channel</label>
              <select 
                value={form.channel}
                onChange={(e) => setForm({...form, channel: e.target.value})}
              >
                <option value="store">Store</option>
                <option value="d2c">D2C</option>
                <option value="b2b">B2B</option>
                <option value="waste">Wastage</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea 
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                rows={2}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Record Movement</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovementModal;
