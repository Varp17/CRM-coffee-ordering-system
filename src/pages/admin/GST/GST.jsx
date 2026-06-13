import React, { useState, useEffect, useMemo } from 'react';
import './GST.css';
import { gstService } from '../../../services/gst';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import DataTable from '../../../components/ui/DataTable';
import { X, RefreshCw, Plus, FileText, Ban } from 'lucide-react';

const GST = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [configs, setConfigs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ hsn_code: '', description: '', igst: '', cgst: '', sgst: '' });
  const [generateOrderId, setGenerateOrderId] = useState('');

  const loadConfig = async () => {
    try {
      const res = await gstService.getConfig();
      setConfigs(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load GST config: ' + err.message);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await gstService.getInvoices();
      setInvoices(unwrapList(res));
    } catch (err) {
      toast.error('Failed to load invoices: ' + err.message);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadConfig(), loadInvoices()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const openAddConfig = () => {
    setEditingConfig(null);
    setConfigForm({ hsn_code: '', description: '', igst: '', cgst: '', sgst: '' });
    setShowConfigModal(true);
  };

  const openEditConfig = (config) => {
    setEditingConfig(config);
    setConfigForm({
      hsn_code: config.hsn_code || '',
      description: config.description || '',
      igst: config.igst || '',
      cgst: config.cgst || '',
      sgst: config.sgst || '',
    });
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...configForm,
        igst: parseFloat(configForm.igst) || 0,
        cgst: parseFloat(configForm.cgst) || 0,
        sgst: parseFloat(configForm.sgst) || 0,
      };
      await gstService.upsertConfig(payload);
      toast.success(editingConfig ? 'Config updated' : 'Config created');
      setShowConfigModal(false);
      loadConfig();
    } catch (err) {
      toast.error('Failed to save config: ' + err.message);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!generateOrderId) { toast.error('Enter an order ID'); return; }
    try {
      await gstService.generateInvoice(generateOrderId);
      toast.success('Invoice generated');
      setGenerateOrderId('');
      loadInvoices();
    } catch (err) {
      toast.error('Failed to generate invoice: ' + err.message);
    }
  };

  const handleCancelInvoice = async (id) => {
    try {
      await gstService.cancelInvoice(id);
      toast.success('Invoice cancelled');
      loadInvoices();
    } catch (err) {
      toast.error('Failed to cancel invoice: ' + err.message);
    }
  };

  const configColumns = useMemo(() => [
    { header: 'HSN Code', accessor: 'hsn_code', sortable: true, render: (row) => <code className="gst-code">{row.hsn_code}</code> },
    { header: 'Description', accessor: 'description', sortable: true },
    { header: 'IGST (%)', accessor: 'igst', sortable: true, render: (row) => `${row.igst || 0}%` },
    { header: 'CGST (%)', accessor: 'cgst', sortable: true, render: (row) => `${row.cgst || 0}%` },
    { header: 'SGST (%)', accessor: 'sgst', sortable: true, render: (row) => `${row.sgst || 0}%` },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn-sm outline" onClick={() => openEditConfig(row)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem' }}>Edit</button>
        </div>
      ),
    },
  ], []);

  const invoiceColumns = useMemo(() => [
    { header: 'Invoice #', accessor: 'invoice_number', sortable: true, render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.invoice_number}</strong> },
    { header: 'Order', accessor: 'order_id', sortable: true, render: (row) => `#${row.order_id}` },
    { header: 'Customer GSTIN', accessor: 'customer_gstin', sortable: true, render: (row) => <code>{row.customer_gstin || '-'}</code> },
    { header: 'Taxable Amount', accessor: 'taxable_amount', sortable: true, render: (row) => formatCurrency(row.taxable_amount) },
    { header: 'Total Tax', accessor: 'total_tax', sortable: true, render: (row) => formatCurrency(row.total_tax) },
    { header: 'Status', accessor: 'status', sortable: true, render: (row) => <span className={`gst-status-badge ${row.status}`}>{row.status}</span> },
    { header: 'Date', accessor: 'created_at', sortable: true, render: (row) => formatDate(row.created_at) },
    {
      header: 'Actions', accessor: 'id', sortable: false,
      render: (row) => (
        <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
          {row.status === 'generated' && (
            <button className="action-btn-sm outline" onClick={() => handleCancelInvoice(row.id)} style={{ height: '28px', padding: '0 8px', fontSize: '0.8rem', color: 'var(--color-danger)' }}><Ban size={12} /> Cancel</button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="gst-view animate-fade-in">
      <div className="gst-header">
        <div>
          <h2 className="section-title">GST Management</h2>
          <p className="section-subtitle">Configure HSN codes, tax rates, and manage GST invoices</p>
        </div>
        <button className="gst-refresh-btn" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="gst-tabs">
        <button className={`gst-tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Config</button>
        <button className={`gst-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>Invoices</button>
      </div>

      {activeTab === 'config' && (
        <>
          <div className="gst-toolbar">
            <div />
            <button className="gst-action-btn primary" onClick={openAddConfig}><Plus size={14} /> Add HSN Code</button>
          </div>
          <DataTable columns={configColumns} data={configs} searchKey="hsn_code" searchPlaceholder="Search HSN code..." exportFileName="gst-config" />
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          <div className="gst-toolbar">
            <div className="gst-generate-row">
              <input type="text" className="gst-input" placeholder="Enter Order ID to generate invoice..." value={generateOrderId} onChange={(e) => setGenerateOrderId(e.target.value)} />
              <button className="gst-action-btn primary" onClick={handleGenerateInvoice}><FileText size={14} /> Generate</button>
            </div>
          </div>
          <DataTable columns={invoiceColumns} data={invoices} searchKey="invoice_number" searchPlaceholder="Search invoice..." exportFileName="gst-invoices" />
        </>
      )}

      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content gst-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingConfig ? 'Edit HSN Code' : 'Add HSN Code'}</h3>
              <button className="panel-close-btn" onClick={() => setShowConfigModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleConfigSubmit}>
              <div className="modal-body">
                <div className="gst-form-grid">
                  <div className="form-group">
                    <label>HSN Code</label>
                    <input className="gst-input" value={configForm.hsn_code} onChange={(e) => setConfigForm(p => ({ ...p, hsn_code: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input className="gst-input" value={configForm.description} onChange={(e) => setConfigForm(p => ({ ...p, description: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>IGST (%)</label>
                    <input type="number" step="0.01" className="gst-input" value={configForm.igst} onChange={(e) => setConfigForm(p => ({ ...p, igst: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>CGST (%)</label>
                    <input type="number" step="0.01" className="gst-input" value={configForm.cgst} onChange={(e) => setConfigForm(p => ({ ...p, cgst: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>SGST (%)</label>
                    <input type="number" step="0.01" className="gst-input" value={configForm.sgst} onChange={(e) => setConfigForm(p => ({ ...p, sgst: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="gst-action-btn primary">{editingConfig ? 'Update' : 'Add'} HSN Code</button>
                <button type="button" className="gst-action-btn ghost" onClick={() => setShowConfigModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GST;
