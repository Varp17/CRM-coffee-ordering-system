import React, { useState, useEffect, useMemo } from 'react';
import './DailyOps.css';
import { dashboardService } from '../../../services/dashboard';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapObject, unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { RefreshCw, ChevronRight } from 'lucide-react';

const TABS = ['Daily Ops', 'Menu Engineering', 'Demand Forecast'];

const DailyOps = () => {
  const [tab, setTab] = useState('Daily Ops');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState(null);
  const [menuEng, setMenuEng] = useState([]);
  const [forecast, setForecast] = useState(null);

  const loadDaily = async () => {
    setLoading(true);
    try {
      const params = { date };
      const [dailyRes, menuRes, forecastRes] = await Promise.all([
        dashboardService.getDailyOps(params),
        dashboardService.getMenuEngineering(params),
        dashboardService.getDemandForecast(params),
      ]);
      setDaily(unwrapObject(dailyRes));
      setMenuEng(unwrapList(menuRes));
      setForecast(unwrapObject(forecastRes));
    } catch (err) {
      toast.error('Failed to load daily operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDaily();
  }, [date]);

  const summary = useMemo(() => ({
    orders: daily?.orders_count || daily?.total_orders || 0,
    revenue: daily?.total_revenue || daily?.revenue || 0,
    cogs: daily?.total_cogs || daily?.cogs || 0,
    profit: daily?.total_profit || daily?.profit || 0,
    margin: daily?.profit_margin || daily?.margin || 0,
  }), [daily]);

  const paymentMethods = useMemo(() => daily?.payment_breakdown || daily?.payment_methods || [], [daily]);
  const topProducts = useMemo(() => daily?.top_products || daily?.best_sellers || [], [daily]);
  const stockAlerts = useMemo(() => daily?.stock_alerts || daily?.low_stock || [], [daily]);
  const staffSummary = useMemo(() => daily?.staff_summary || daily?.staff || {}, [daily]);

  const forecastData = useMemo(() => forecast?.trend || forecast?.daily_revenue || [], [forecast]);
  const avgDailyRevenue = forecast?.avg_daily_revenue || forecast?.average_daily || 0;
  const projectedMonthly = forecast?.projected_monthly || forecast?.monthly_projected || 0;
  const peakDays = forecast?.peak_days || forecast?.peak || [];

  const renderDailyOps = () => (
    <>
      <div className="dops-summary-grid">
        <div className="dops-stat-card">
          <span className="dops-stat-icon orders-icon">📦</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Orders</span>
            <span className="dops-stat-value">{summary.orders}</span>
          </div>
        </div>
        <div className="dops-stat-card">
          <span className="dops-stat-icon revenue-icon">💰</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Total Revenue</span>
            <span className="dops-stat-value">{formatCurrency(summary.revenue)}</span>
          </div>
        </div>
        <div className="dops-stat-card">
          <span className="dops-stat-icon cogs-icon">📊</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">COGS</span>
            <span className="dops-stat-value">{formatCurrency(summary.cogs)}</span>
          </div>
        </div>
        <div className="dops-stat-card">
          <span className="dops-stat-icon profit-icon">📈</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Profit</span>
            <span className="dops-stat-value">{formatCurrency(summary.profit)}</span>
          </div>
        </div>
        <div className="dops-stat-card">
          <span className="dops-stat-icon margin-icon">🎯</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Margin</span>
            <span className="dops-stat-value">{summary.margin}%</span>
          </div>
        </div>
      </div>

      <div className="dops-grid">
        <div className="dops-card">
          <div className="dops-card-header"><h3>Payment Breakdown</h3></div>
          <div className="dops-card-body">
            {paymentMethods.length === 0 ? (
              <p className="dops-empty">No data</p>
            ) : (
              <table className="dops-table">
                <thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead>
                <tbody>
                  {paymentMethods.map((pm, i) => (
                    <tr key={i}>
                      <td>{pm.method || pm.name}</td>
                      <td>{pm.count || 0}</td>
                      <td>{formatCurrency(pm.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dops-card">
          <div className="dops-card-header"><h3>Top Products</h3></div>
          <div className="dops-card-body">
            {topProducts.length === 0 ? (
              <p className="dops-empty">No data</p>
            ) : (
              <table className="dops-table">
                <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="dops-product-name">{p.name}</td>
                      <td>{p.quantity || p.qty || 0}</td>
                      <td>{formatCurrency(p.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dops-card">
          <div className="dops-card-header"><h3>Stock Alerts</h3></div>
          <div className="dops-card-body">
            {stockAlerts.length === 0 ? (
              <p className="dops-empty">All items above reorder point</p>
            ) : (
              <div className="dops-alerts-list">
                {stockAlerts.map((item, i) => (
                  <div key={i} className="dops-alert-item">
                    <span className="dops-alert-name">{item.name}</span>
                    <span className="dops-alert-qty">Stock: {item.stock || item.quantity || 0}</span>
                    <span className="dops-alert-reorder">Reorder: {item.reorder_point || item.min_stock || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dops-card">
          <div className="dops-card-header"><h3>Staff Summary</h3></div>
          <div className="dops-card-body">
            <div className="dops-staff-grid">
              <div className="dops-staff-item">
                <span className="dops-staff-count on-duty">{staffSummary.on_duty || staffSummary.present || 0}</span>
                <span className="dops-staff-label">On Duty</span>
              </div>
              <div className="dops-staff-item">
                <span className="dops-staff-count scheduled">{staffSummary.scheduled || 0}</span>
                <span className="dops-staff-label">Scheduled</span>
              </div>
              <div className="dops-staff-item">
                <span className="dops-staff-count absent">{staffSummary.absent || 0}</span>
                <span className="dops-staff-label">Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderMenuEngineering = () => (
    <div className="dops-card">
      <div className="dops-card-header"><h3>Product Profitability</h3></div>
      <div className="dops-card-body">
        {menuEng.length === 0 ? (
          <p className="dops-empty">No data</p>
        ) : (
          <table className="dops-table dops-table-full">
            <thead><tr><th>Name</th><th>Category</th><th>Qty Sold</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr></thead>
            <tbody>
              {menuEng.map((p, i) => (
                <tr key={i}>
                  <td className="dops-product-name">{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.quantity_sold || p.qty || 0}</td>
                  <td>{formatCurrency(p.revenue || 0)}</td>
                  <td>{formatCurrency(p.profit || 0)}</td>
                  <td>{p.margin || p.profit_margin || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderForecast = () => (
    <>
      <div className="dops-summary-grid">
        <div className="dops-stat-card">
          <span className="dops-stat-icon revenue-icon">📈</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Avg Daily Revenue</span>
            <span className="dops-stat-value">{formatCurrency(avgDailyRevenue)}</span>
          </div>
        </div>
        <div className="dops-stat-card">
          <span className="dops-stat-icon profit-icon">📊</span>
          <div className="dops-stat-body">
            <span className="dops-stat-label">Projected Monthly</span>
            <span className="dops-stat-value">{formatCurrency(projectedMonthly)}</span>
          </div>
        </div>
      </div>

      <div className="dops-card">
        <div className="dops-card-header"><h3>30-Day Revenue Trend</h3></div>
        <div className="dops-card-body">
          {forecastData.length === 0 ? (
            <p className="dops-empty">No data</p>
          ) : (
            <table className="dops-table dops-table-full">
              <thead><tr><th>Date</th><th>Revenue</th></tr></thead>
              <tbody>
                {forecastData.map((d, i) => (
                  <tr key={i}>
                    <td>{d.date || d.day}</td>
                    <td>{formatCurrency(d.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {peakDays.length > 0 && (
        <div className="dops-card">
          <div className="dops-card-header"><h3>Peak Days</h3></div>
          <div className="dops-card-body">
            <div className="dops-peak-list">
              {peakDays.map((d, i) => (
                <span key={i} className="dops-peak-tag">{d.date || d.day}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="dops-view animate-fade-in">
      <div className="dops-header">
        <div>
          <h1 className="dops-title">Daily Operations</h1>
          <p className="dops-sub">Gaps 17 · 22 · 24: Forecasting, Ops Dashboard, Menu Engineering</p>
        </div>
        <div className="dops-header-actions">
          <input type="date" className="dops-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="dops-action-btn ghost" onClick={loadDaily}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      <div className="dops-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dops-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dops-loading">Loading...</div>
      ) : tab === 'Daily Ops' ? renderDailyOps() : tab === 'Menu Engineering' ? renderMenuEngineering() : renderForecast()}
    </div>
  );
};

export default DailyOps;
