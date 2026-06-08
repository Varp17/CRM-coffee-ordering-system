import React, { useState, useEffect, useMemo } from 'react';
import './Subscriptions.css';
import { subscriptionsService } from '../../../services/subscriptions';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Plus } from 'lucide-react';

const initialPlan = { name: '', product_id: '', frequency: 'weekly', discount_percent: 0, min_qty: 1, max_qty: 10, is_active: true };

const Subscriptions = () => {
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialPlan);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        subscriptionsService.getPlans(),
        subscriptionsService.getSubscriptions(),
      ]);
      setPlans(unwrapList(plansRes));
      setSubs(unwrapList(subsRes));
    } catch (err) {
      toast.error('Failed to load subscriptions data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDue = async () => {
    try {
      const res = await subscriptionsService.processDue();
      toast.success(res?.message || 'Due subscriptions processed');
      loadData();
    } catch (err) {
      toast.error('Failed to process due subscriptions');
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(initialPlan);
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({ ...plan });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await subscriptionsService.updatePlan(editing.id, form);
        toast.success('Plan updated');
      } else {
        await subscriptionsService.createPlan(form);
        toast.success('Plan created');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save plan');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await subscriptionsService.updateSubscriptionStatus(id, { status });
      toast.success(`Subscription ${status}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const planColumns = useMemo(() => [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'Product', accessor: 'product_id', sortable: true },
    {
      header: 'Frequency',
      accessor: 'frequency',
      sortable: true,
      render: (row) => <span className="badge badge-info">{row.frequency}</span>,
    },
    {
      header: 'Discount %',
      accessor: 'discount_percent',
      sortable: true,
      render: (row) => <span>{row.discount_percent}%</span>,
    },
    {
      header: 'Min Qty',
      accessor: 'min_qty',
      sortable: true,
    },
    {
      header: 'Max Qty',
      accessor: 'max_qty',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: 'is_active',
      sortable: true,
      render: (row) => (
        <span className={`badge ${row.is_active ? 'badge-success' : 'badge-muted'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <button className="action-btn-sm outline" onClick={() => openEdit(row)}>Edit</button>
      ),
    },
  ], []);

  const subColumns = useMemo(() => [
    { header: 'Customer', accessor: 'customer_name', sortable: true },
    { header: 'Plan', accessor: 'plan_name', sortable: true },
    { header: 'Quantity', accessor: 'quantity', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        const cls = {
          active: 'badge-success',
          paused: 'badge-warning',
          cancelled: 'badge-danger',
          expired: 'badge-muted',
        }[row.status] || 'badge-info';
        return <span className={`badge ${cls}`}>{row.status}</span>;
      },
    },
    { header: 'Next Delivery', accessor: 'next_delivery', sortable: true },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.status === 'active' && (
            <button className="action-btn-sm outline" onClick={() => handleStatusUpdate(row.id, 'paused')}>Pause</button>
          )}
          {row.status === 'paused' && (
            <button className="action-btn-sm primary" onClick={() => handleStatusUpdate(row.id, 'active')}>Resume</button>
          )}
          {(row.status === 'active' || row.status === 'paused') && (
            <button className="action-btn-sm danger" onClick={() => handleStatusUpdate(row.id, 'cancelled')}>Cancel</button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="subs-view animate-fade-in">
      <div className="subs-header">
        <div>
          <h1 className="subs-title">Subscriptions</h1>
          <p className="subs-sub">Manage subscription plans and subscribers</p>
        </div>
        <div className="subs-header-actions">
          <button className="subs-action-btn ghost" onClick={loadData}><RefreshCw size={13} /> Refresh</button>
          <button className="subs-action-btn primary" onClick={handleProcessDue}>Process Due</button>
          {tab === 'plans' && (
            <button className="subs-action-btn primary" onClick={openAdd}><Plus size={13} /> Add Plan</button>
          )}
        </div>
      </div>

      <div className="subs-tabs">
        <button className={`subs-tab ${tab === 'plans' ? 'active' : ''}`} onClick={() => setTab('plans')}>Plans</button>
        <button className={`subs-tab ${tab === 'subscribers' ? 'active' : ''}`} onClick={() => setTab('subscribers')}>Subscribers</button>
      </div>

      {loading ? (
        <div className="subs-loading">Loading...</div>
      ) : tab === 'plans' ? (
        <DataTable columns={planColumns} data={plans} exportFileName="subscription-plans" />
      ) : (
        <DataTable columns={subColumns} data={subs} exportFileName="subscriptions" />
      )}

      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal-content subs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Plan' : 'Add Plan'}</h3>
              <button className="panel-close-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="subs-modal-body">
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Product ID</label>
                <input value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount %</label>
                  <input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Qty</label>
                  <input type="number" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Max Qty</label>
                  <input type="number" value={form.max_qty} onChange={(e) => setForm({ ...form, max_qty: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="subs-action-btn primary" onClick={handleSave}>Save</button>
              <button className="subs-action-btn ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Subscriptions;
