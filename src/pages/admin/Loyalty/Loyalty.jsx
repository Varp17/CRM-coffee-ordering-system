import React, { useState, useEffect, useMemo } from 'react';
import './Loyalty.css';
import { loyaltyService } from '../../../services/loyalty';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Plus, Star, Trophy, Gift, ChevronRight } from 'lucide-react';

const Loyalty = () => {
  const [activeTab, setActiveTab] = useState('tiers');
  const [tiers, setTiers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierForm, setTierForm] = useState({ name: '', min_points: '', multiplier: '', discount_percent: '' });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({ name: '', points_required: '', type: 'discount', status: 'active' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [showLedger, setShowLedger] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [tiersRes, customersRes, rewardsRes] = await Promise.all([
        loyaltyService.getTiers(),
        loyaltyService.getCustomers(),
        loyaltyService.getRewards(),
      ]);
      setTiers(unwrapList(tiersRes));
      setCustomers(unwrapList(customersRes));
      setRewards(unwrapList(rewardsRes));
    } catch (err) {
      toast.error('Failed to load loyalty data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openAddTier = () => {
    setEditingTier(null);
    setTierForm({ name: '', min_points: '', multiplier: '', discount_percent: '' });
    setShowTierModal(true);
  };

  const openEditTier = (tier) => {
    setEditingTier(tier);
    setTierForm({ name: tier.name || '', min_points: tier.min_points || '', multiplier: tier.multiplier || '', discount_percent: tier.discount_percent || '' });
    setShowTierModal(true);
  };

  const handleTierSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...tierForm, min_points: parseInt(tierForm.min_points) || 0, multiplier: parseFloat(tierForm.multiplier) || 1, discount_percent: parseFloat(tierForm.discount_percent) || 0 };
      if (editingTier) {
        await loyaltyService.updateTier(editingTier.id, payload);
        toast.success('Tier updated');
      } else {
        await loyaltyService.createTier(payload);
        toast.success('Tier created');
      }
      setShowTierModal(false);
      const res = await loyaltyService.getTiers();
      setTiers(unwrapList(res));
    } catch (err) {
      toast.error('Failed to save tier: ' + err.message);
    }
  };

  const openAddReward = () => {
    setEditingReward(null);
    setRewardForm({ name: '', points_required: '', type: 'discount', status: 'active' });
    setShowRewardModal(true);
  };

  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...rewardForm, points_required: parseInt(rewardForm.points_required) || 0 };
      await loyaltyService.createReward(payload);
      toast.success('Reward created');
      setShowRewardModal(false);
      const res = await loyaltyService.getRewards();
      setRewards(unwrapList(res));
    } catch (err) {
      toast.error('Failed to save reward: ' + err.message);
    }
  };

  const viewLedger = async (customer) => {
    setSelectedCustomer(customer);
    setShowLedger(true);
    try {
      const res = await loyaltyService.getLedger(customer.id);
      setLedgerEntries(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load ledger: ' + err.message);
      setLedgerEntries([]);
    }
  };

  const tierColumns = useMemo(() => [
    { header: 'Name', accessor: 'name', sortable: true, render: (row) => <strong>{row.name}</strong> },
    { header: 'Min Points', accessor: 'min_points', sortable: true },
    { header: 'Multiplier', accessor: 'multiplier', sortable: true, render: (row) => `${row.multiplier}x` },
    { header: 'Discount %', accessor: 'discount_percent', sortable: true, render: (row) => `${row.discount_percent || 0}%` },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn-sm outline" onClick={() => openEditTier(row)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
        </div>
      ),
    },
  ], []);

  const customerColumns = useMemo(() => [
    { header: 'Customer', accessor: 'name', sortable: true, render: (row) => <strong>{row.name || row.customer_name}</strong> },
    { header: 'Tier', accessor: 'tier_name', sortable: true, render: (row) => <span className="loyalty-tier-badge">{row.tier_name || 'Bronze'}</span> },
    { header: 'Total Points', accessor: 'total_points', sortable: true },
    { header: 'Lifetime Spent', accessor: 'lifetime_spent', sortable: true, render: (row) => formatCurrency(row.lifetime_spent || row.total_spent) },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn-sm outline" onClick={() => viewLedger(row)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}><Star size={12} /> Ledger</button>
        </div>
      ),
    },
  ], []);

  const rewardColumns = useMemo(() => [
    { header: 'Name', accessor: 'name', sortable: true, render: (row) => <strong>{row.name}</strong> },
    { header: 'Points Required', accessor: 'points_required', sortable: true },
    { header: 'Type', accessor: 'type', sortable: true, render: (row) => <span className={`reward-type-badge ${row.type}`}>{row.type}</span> },
    { header: 'Status', accessor: 'status', sortable: true, render: (row) => <span className={`loyalty-status-badge ${row.status}`}>{row.status}</span> },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn-sm outline" style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
        </div>
      ),
    },
  ], []);

  const ledgerColumns = useMemo(() => [
    { header: 'Date', accessor: 'created_at', sortable: true, render: (row) => formatDate(row.created_at) },
    { header: 'Type', accessor: 'type', sortable: true, render: (row) => <span className={`ledger-type-badge ${row.type}`}>{row.type}</span> },
    { header: 'Points', accessor: 'points', sortable: true, render: (row) => <strong className={row.points > 0 ? 'text-earned' : 'text-redeemed'}>{row.points > 0 ? `+${row.points}` : row.points}</strong> },
    { header: 'Description', accessor: 'description', sortable: false },
  ], []);

  return (
    <div className="loyalty-view animate-fade-in">
      <div className="loyalty-header">
        <div>
          <h2 className="section-title">Loyalty Program</h2>
          <p className="section-subtitle">Manage tiers, customer points, and rewards catalog</p>
        </div>
        <button className="loyalty-refresh-btn" onClick={loadAll}><RefreshCw size={13} /></button>
      </div>

      <div className="loyalty-tabs">
        <button className={`loyalty-tab ${activeTab === 'tiers' ? 'active' : ''}`} onClick={() => setActiveTab('tiers')}><Trophy size={14} /> Tiers</button>
        <button className={`loyalty-tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}><Star size={14} /> Customers</button>
        <button className={`loyalty-tab ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}><Gift size={14} /> Rewards</button>
      </div>

      {activeTab === 'tiers' && (
        <>
          <div className="loyalty-toolbar">
            <div />
            <button className="loyalty-action-btn primary" onClick={openAddTier}><Plus size={14} /> Add Tier</button>
          </div>
          <DataTable columns={tierColumns} data={tiers} searchKey="name" searchPlaceholder="Search tiers..." exportFileName="loyalty-tiers" />
        </>
      )}

      {activeTab === 'customers' && (
        <>
          <DataTable columns={customerColumns} data={customers} searchKey="name" searchPlaceholder="Search customers..." exportFileName="loyalty-customers" />
        </>
      )}

      {activeTab === 'rewards' && (
        <>
          <div className="loyalty-toolbar">
            <div />
            <button className="loyalty-action-btn primary" onClick={openAddReward}><Plus size={14} /> Add Reward</button>
          </div>
          <DataTable columns={rewardColumns} data={rewards} searchKey="name" searchPlaceholder="Search rewards..." exportFileName="loyalty-rewards" />
        </>
      )}

      {showTierModal && (
        <div className="modal-overlay" onClick={() => setShowTierModal(false)}>
          <div className="modal-content loyalty-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTier ? 'Edit Tier' : 'Add Tier'}</h3>
              <button className="panel-close-btn" onClick={() => setShowTierModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleTierSubmit}>
              <div className="modal-body">
                <div className="loyalty-form-grid">
                  <div className="form-group">
                    <label>Tier Name</label>
                    <input className="loyalty-input" value={tierForm.name} onChange={(e) => setTierForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Min Points</label>
                    <input type="number" className="loyalty-input" value={tierForm.min_points} onChange={(e) => setTierForm(p => ({ ...p, min_points: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Points Multiplier</label>
                    <input type="number" step="0.1" className="loyalty-input" value={tierForm.multiplier} onChange={(e) => setTierForm(p => ({ ...p, multiplier: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Discount %</label>
                    <input type="number" step="0.1" className="loyalty-input" value={tierForm.discount_percent} onChange={(e) => setTierForm(p => ({ ...p, discount_percent: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="loyalty-action-btn primary">{editingTier ? 'Update' : 'Create'} Tier</button>
                <button type="button" className="loyalty-action-btn ghost" onClick={() => setShowTierModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="modal-overlay" onClick={() => setShowRewardModal(false)}>
          <div className="modal-content loyalty-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Reward</h3>
              <button className="panel-close-btn" onClick={() => setShowRewardModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRewardSubmit}>
              <div className="modal-body">
                <div className="loyalty-form-grid">
                  <div className="form-group">
                    <label>Reward Name</label>
                    <input className="loyalty-input" value={rewardForm.name} onChange={(e) => setRewardForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Points Required</label>
                    <input type="number" className="loyalty-input" value={rewardForm.points_required} onChange={(e) => setRewardForm(p => ({ ...p, points_required: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="loyalty-input" value={rewardForm.type} onChange={(e) => setRewardForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="discount">Discount</option>
                      <option value="free_item">Free Item</option>
                      <option value="free_delivery">Free Delivery</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="loyalty-input" value={rewardForm.status} onChange={(e) => setRewardForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="loyalty-action-btn primary">Create Reward</button>
                <button type="button" className="loyalty-action-btn ghost" onClick={() => setShowRewardModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLedger && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowLedger(false)}>
          <div className="modal-content ledger-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Points Ledger — {selectedCustomer.name || selectedCustomer.customer_name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#888' }}>Tier: {selectedCustomer.tier_name || 'Bronze'} · Points: {selectedCustomer.total_points || 0}</p>
              </div>
              <button className="panel-close-btn" onClick={() => setShowLedger(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <DataTable columns={ledgerColumns} data={ledgerEntries} exportFileName={`ledger-${selectedCustomer.id}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loyalty;
