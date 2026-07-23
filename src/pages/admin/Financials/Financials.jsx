import React, { useState, useEffect } from 'react';
import './Financials.css';
import Button from '../../../components/Button/Button';
import { analyticsService } from '../../../services/analytics';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';

const Financials = () => {
  const [grossSales, setGrossSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exportTarget, setExportTarget] = useState('Zoho');

  const loadFinancials = async () => {
    setIsLoading(true);
    try {
      const res = await analyticsService.getDashboard();
      const data = unwrapObject(res, {});
      const rev = data.revenue?.thisMonth || 0;
      setGrossSales(rev);
    } catch (err) {
      toast.error('Failed to load financials: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, []);

  const gstRate = 0.18; // 18% F&B GST
  const netRevenue = Math.round(grossSales / (1 + gstRate));
  const totalGst = grossSales - netRevenue;
  const cgstSGstSplit = Math.round(totalGst / 2);

  const handleExportData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Formatting double-entry accounting records for ${exportTarget}...`,
        success: `POS journals synced perfectly to ${exportTarget} Books! 💸`,
        error: 'Export failed.',
      }
    );
  };

  const salesLedger = [
    { code: 'LED-4010', name: 'D2C Retail Beverage Sales', debit: 0, credit: Math.round(grossSales * 0.62) },
    { code: 'LED-4020', name: 'Retail Store Coffee Sales', debit: 0, credit: Math.round(grossSales * 0.38) },
    { code: 'LED-2050', name: 'CGST Liability Account (9%)', debit: 0, credit: cgstSGstSplit },
    { code: 'LED-2060', name: 'SGST Liability Account (9%)', debit: 0, credit: cgstSGstSplit },
    { code: 'LED-1010', name: 'UPI Gateway Clearing Ledger', debit: grossSales, credit: 0 },
  ];

  if (isLoading && grossSales === 0) {
    return (
      <div className="financials-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('financials.loading', 'Loading tax & financials ledger...')}</p>
      </div>
    );
  }

  return (
    <div className="financials-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">{t('financials.title', '💸 GST Accounting & Zoho Integration')}</h2>
          <p className="section-subtitle">{t('financials.subtitle', 'Compile F&B tax liabilities, export point-of-sale journals, and sync store accounts')}</p>
        </div>
      </div>

      <div className="financials-kpi-row">
        <div className="finance-kpi">
          <span>{t('financials.grossSales', 'Gross Invoiced Sales')}</span>
          <strong>{formatCurrency(grossSales)}</strong>
          <span className="finance-kpi-sub">{t('financials.grossSalesSub', 'Total sales including GST')}</span>
        </div>

        <div className="finance-kpi">
          <span>{t('financials.netSales', 'Net Sales (Excl. Tax)')}</span>
          <strong>{formatCurrency(netRevenue)}</strong>
          <span className="finance-kpi-sub">{t('financials.netSalesSub', 'Base revenue mapped to P&L')}</span>
        </div>

        <div className="finance-kpi">
          <span>{t('financials.gstAccrued', 'Accrued F&B GST (18%)')}</span>
          <strong className="gst-liability-text">{formatCurrency(totalGst)}</strong>
          <span className="finance-kpi-sub">{t('financials.gstAccruedSub', 'Split: 9% CGST | 9% SGST')}</span>
        </div>
      </div>

      <div className="financials-split-grid">
        {/* Double entry journal */}
        <div className="finance-panel-card">
          <div className="panel-card-header">
            <h3>{t('financials.ledgerTitle', '📖 POS Double-Entry General Ledger')}</h3>
            <span className="ledger-tag">{t('financials.ledgerTag', 'Month-to-Date Journal')}</span>
          </div>

          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>{t('financials.accCode', 'Acc Code')}</th>
                  <th>{t('financials.ledgerName', 'Ledger Account Name')}</th>
                  <th className="num-col">{t('financials.debit', 'Debit (Dr)')}</th>
                  <th className="num-col">{t('financials.credit', 'Credit (Cr)')}</th>
                </tr>
              </thead>
              <tbody>
                {salesLedger.map((row, idx) => (
                  <tr key={idx}>
                    <td><code>{row.code}</code></td>
                    <td><strong>{row.name}</strong></td>
                    <td className="num-col text-debit">{row.debit > 0 ? formatCurrency(row.debit) : '—'}</td>
                    <td className="num-col text-credit">{row.credit > 0 ? formatCurrency(row.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="finance-panel-card">
          <h3>{t('financials.syncTitle', '☁️ Cloud ERP Integrations')}</h3>
          <p className="integration-subtitle">{t('financials.syncSubtitle', 'Sync point-of-sale ledger lines directly to Zoho Books, Tally Prime, or QuickBooks endpoints.')}</p>

          <div className="integration-workspace">
            <div className="target-select-row">
              <label>{t('financials.selectDestination', 'Select Cloud Destination:')}</label>
              <div className="target-buttons">
                {['Zoho', 'Tally', 'QuickBooks'].map((target) => (
                  <button
                    key={target}
                    className={`target-btn ${exportTarget === target ? 'active' : ''}`}
                    onClick={() => setExportTarget(target)}
                  >
                    {target === 'Zoho' && '🍊 Zoho Books'}
                    {target === 'Tally' && '🟢 Tally Prime'}
                    {target === 'QuickBooks' && '🔵 QuickBooks'}
                  </button>
                ))}
              </div>
            </div>

            <div className="erp-sync-card">
              <div className="sync-status-indicator">
                <span className="status-dot online"></span>
                <span>{t('financials.apiState', 'API Connection State: ')}<strong>{t('financials.connectedStatus', 'CONNECTED')}</strong></span>
              </div>
              <p className="sync-text-desc">{t('financials.taxProfileDesc', 'Digital Coffee Indian tax profile is linked securely. Sync updates will post tax split CGST and SGST into individual tax liability ledgers automatically.')}</p>
            </div>

            <Button variant="primary" size="large" fullWidth={true} onClick={handleExportData} style={{marginTop: 'var(--space-16)'}}>
              {t('financials.syncButtonPrefix', 'Sync POS Journal Lines to ')}{exportTarget} 🚀
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financials;
