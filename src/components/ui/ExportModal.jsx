import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare, Square, FileSpreadsheet, FileText, Code2, X, Download,
  ArrowRight, ArrowLeft, Filter, Hash, CheckCircle2
} from 'lucide-react';
import './ExportModal.css';

/**
 * ExportModal — ICIT 3-Step Export Wizard
 *
 * Steps:
 *   Step 1: Scope & Field Selection (Date range, custom dates, column pickers)
 *   Step 2: Record Quantity / Limit Selection (All, Last 20, 50, 100, or Custom Count)
 *   Step 3: File Format & Final Download (Excel, CSV, JSON + Pre-flight summary)
 */
const ExportModal = ({
  isOpen,
  onClose,
  title = 'Export Data',
  columns = [],
  data = [],
  filenameBase = 'CRM_Export',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dateRange, setDateRange] = useState('CURRENT');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  
  // Step 2 state: Quantity / Limit selection
  const [recordLimit, setRecordLimit] = useState('ALL'); // 'ALL' | '20' | '50' | '100' | 'CUSTOM'
  const [customLimitValue, setCustomLimitValue] = useState(25);

  // Step 3 state: Format
  const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'csv' | 'json'
  const [isLoading, setIsLoading] = useState(false);

  // Reset wizard when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setDateRange('CURRENT');
      setFormat('xlsx');
      setSelectedColumns(columns.map((c) => c.key));
      setCustomStart('');
      setCustomEnd('');
      setRecordLimit('ALL');
      setCustomLimitValue(25);
    }
  }, [isOpen, columns]);

  const toggleColumn = (key) => {
    const col = columns.find((c) => c.key === key);
    if (col?.required) return;
    if (selectedColumns.includes(key)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== key));
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const selectAllColumns = () => setSelectedColumns(columns.map((c) => c.key));
  const clearOptionalColumns = () =>
    setSelectedColumns(columns.filter((c) => c.required).map((c) => c.key));

  // ── Step 1: Date Filtered Dataset ──
  const dateFilteredData = useMemo(() => {
    if (dateRange === 'CURRENT') return data;

    const now = new Date();
    let fromDate = null;
    let toDate = now;

    switch (dateRange) {
      case 'LAST_7':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'LAST_30':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 30);
        break;
      case 'LAST_90':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 90);
        break;
      case 'LAST_180':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 180);
        break;
      case 'LAST_365':
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 365);
        break;
      case 'CUSTOM':
        fromDate = customStart ? new Date(customStart) : null;
        toDate = customEnd ? new Date(customEnd) : now;
        break;
      default:
        return data;
    }

    return data.filter((row) => {
      const dateVal =
        row.createdAt || row.created_at || row.date || row.orderDate || row.timestamp;
      if (!dateVal) return true;
      const rowDate = new Date(dateVal);
      if (isNaN(rowDate.getTime())) return true;
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    });
  }, [data, dateRange, customStart, customEnd]);

  // ── Step 2: Quantity Limited Dataset ──
  const finalExportData = useMemo(() => {
    let dataset = [...dateFilteredData];

    if (recordLimit === 'ALL') return dataset;

    let limit = dataset.length;
    if (recordLimit === '20') limit = 20;
    else if (recordLimit === '50') limit = 50;
    else if (recordLimit === '100') limit = 100;
    else if (recordLimit === 'CUSTOM') limit = Math.max(1, Number(customLimitValue) || 1);

    return dataset.slice(0, limit);
  }, [dateFilteredData, recordLimit, customLimitValue]);

  // ── Data Exporters ──
  const escapeCell = (value) => {
    const str = value == null ? '' : String(value);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const generateCSV = (rows, cols) => {
    const headerRow = cols.map((c) => escapeCell(c.label)).join(',');
    const dataRows = rows.map((row) =>
      cols.map((c) => {
        let val = row[c.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return escapeCell(val);
      }).join(',')
    );
    return '\uFEFF' + [headerRow, ...dataRows].join('\n');
  };

  const generateTSV = (rows, cols) => {
    const headerRow = cols.map((c) => c.label).join('\t');
    const dataRows = rows.map((row) =>
      cols.map((c) => {
        let val = row[c.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return String(val).replace(/\t/g, ' ');
      }).join('\t')
    );
    return '\uFEFF' + [headerRow, ...dataRows].join('\n');
  };

  const generateJSON = (rows, cols) => {
    const jsonObjects = rows.map((row) => {
      const obj = {};
      cols.forEach((c) => {
        obj[c.label] = row[c.key] ?? null;
      });
      return obj;
    });
    return JSON.stringify(jsonObjects, null, 2);
  };

  const downloadBlob = (content, mimeType, extension) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const activeCols = columns.filter((c) => selectedColumns.includes(c.key));

      if (finalExportData.length === 0) {
        alert('No records available to export with the current settings.');
        return;
      }

      if (format === 'csv') {
        const csvContent = generateCSV(finalExportData, activeCols);
        downloadBlob(csvContent, 'text/csv;charset=utf-8;', 'csv');
      } else if (format === 'json') {
        const jsonContent = generateJSON(finalExportData, activeCols);
        downloadBlob(jsonContent, 'application/json;charset=utf-8;', 'json');
      } else {
        // Excel format (.xlsx)
        const tsvContent = generateTSV(finalExportData, activeCols);
        downloadBlob(tsvContent, 'application/vnd.ms-excel', 'xlsx');
      }

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal-header">
          <div className="export-modal-header-left">
            <div className="export-modal-icon">
              {currentStep === 1 && <Filter size={20} />}
              {currentStep === 2 && <Hash size={20} />}
              {currentStep === 3 && <Download size={20} />}
            </div>
            <div>
              <h3 className="export-modal-title">{title}</h3>
              <p className="export-modal-subtitle">
                {currentStep === 1 && 'Step 1 of 3: Scope & Field Selection'}
                {currentStep === 2 && 'Step 2 of 3: Record Count & Limit'}
                {currentStep === 3 && 'Step 3 of 3: Format & Export'}
              </p>
            </div>
          </div>
          <button className="export-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Wizard Stepper Progress Header */}
        <div className="export-wizard-stepper">
          <div className={`stepper-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-num">{currentStep > 1 ? <CheckCircle2 size={13} /> : '1'}</span>
            <span className="step-label">Scope & Fields</span>
          </div>
          <div className="stepper-line" />
          <div className={`stepper-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-num">{currentStep > 2 ? <CheckCircle2 size={13} /> : '2'}</span>
            <span className="step-label">Quantity</span>
          </div>
          <div className="stepper-line" />
          <div className={`stepper-step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Format</span>
          </div>
        </div>

        {/* Body Pages */}
        <div className="export-modal-body">
          {/* ════ STEP 1: SCOPE & FIELDS ════ */}
          {currentStep === 1 && (
            <>
              {/* Date Scope */}
              <div className="export-field-group">
                <label className="export-field-label">1. Date Range Scope</label>
                <select
                  className="export-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="CURRENT">Current Filtered View ({data.length} total records)</option>
                  <option value="LAST_7">Last 7 Days</option>
                  <option value="LAST_30">Last 30 Days</option>
                  <option value="LAST_90">Last 3 Months</option>
                  <option value="LAST_180">Last 6 Months</option>
                  <option value="LAST_365">Last 12 Months</option>
                  <option value="CUSTOM">Custom Date Range...</option>
                </select>
              </div>

              {dateRange === 'CUSTOM' && (
                <div className="export-custom-dates">
                  <div className="export-date-field">
                    <label className="export-field-label">Start Date</label>
                    <input
                      type="date"
                      className="export-date-input"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="export-date-field">
                    <label className="export-field-label">End Date</label>
                    <input
                      type="date"
                      className="export-date-input"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Column Selection */}
              <div className="export-columns-section">
                <div className="export-columns-header-row">
                  <span className="export-field-label">
                    2. Select Export Fields ({selectedColumns.length} of {columns.length} selected)
                  </span>
                  <div className="export-columns-actions">
                    <button type="button" onClick={selectAllColumns} className="col-action-btn highlight">
                      Select All
                    </button>
                    <span className="col-separator">|</span>
                    <button type="button" onClick={clearOptionalColumns} className="col-action-btn">
                      Required Only
                    </button>
                  </div>
                </div>

                <div className="export-columns-grid standalone-grid">
                  {columns.map((col) => {
                    const isChecked = selectedColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        disabled={col.required}
                        onClick={() => toggleColumn(col.key)}
                        className={`export-col-chip ${
                          col.required
                            ? 'locked'
                            : isChecked
                            ? 'checked'
                            : ''
                        }`}
                      >
                        {isChecked || col.required ? (
                          <CheckSquare size={15} className={col.required ? 'icon-locked' : 'icon-checked'} />
                        ) : (
                          <Square size={15} className="icon-unchecked" />
                        )}
                        <span className="col-chip-label">
                          {col.label}
                          {col.required && <span className="required-star">*</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ════ STEP 2: RECORD LIMIT / QUANTITY ════ */}
          {currentStep === 2 && (
            <div className="export-step-container">
              <label className="export-field-label">Select How Many Records To Export</label>
              
              <div className="export-quantity-options">
                <label className={`quantity-tile ${recordLimit === 'ALL' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recordLimit"
                    value="ALL"
                    checked={recordLimit === 'ALL'}
                    onChange={() => setRecordLimit('ALL')}
                  />
                  <div className="quantity-tile-content">
                    <span className="quantity-title">All Matching Records</span>
                    <span className="quantity-desc">Export all {dateFilteredData.length} records in scope</span>
                  </div>
                </label>

                <label className={`quantity-tile ${recordLimit === '20' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recordLimit"
                    value="20"
                    checked={recordLimit === '20'}
                    onChange={() => setRecordLimit('20')}
                  />
                  <div className="quantity-tile-content">
                    <span className="quantity-title">Last 20 Records</span>
                    <span className="quantity-desc">Export top 20 recent entries</span>
                  </div>
                </label>

                <label className={`quantity-tile ${recordLimit === '50' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recordLimit"
                    value="50"
                    checked={recordLimit === '50'}
                    onChange={() => setRecordLimit('50')}
                  />
                  <div className="quantity-tile-content">
                    <span className="quantity-title">Last 50 Records</span>
                    <span className="quantity-desc">Export top 50 recent entries</span>
                  </div>
                </label>

                <label className={`quantity-tile ${recordLimit === '100' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recordLimit"
                    value="100"
                    checked={recordLimit === '100'}
                    onChange={() => setRecordLimit('100')}
                  />
                  <div className="quantity-tile-content">
                    <span className="quantity-title">Last 100 Records</span>
                    <span className="quantity-desc">Export top 100 recent entries</span>
                  </div>
                </label>

                <label className={`quantity-tile ${recordLimit === 'CUSTOM' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recordLimit"
                    value="CUSTOM"
                    checked={recordLimit === 'CUSTOM'}
                    onChange={() => setRecordLimit('CUSTOM')}
                  />
                  <div className="quantity-tile-content custom-qty-wrap">
                    <span className="quantity-title">Custom Quantity</span>
                    {recordLimit === 'CUSTOM' && (
                      <input
                        type="number"
                        min="1"
                        max={dateFilteredData.length || 9999}
                        className="custom-qty-input"
                        value={customLimitValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setCustomLimitValue(e.target.value)}
                      />
                    )}
                  </div>
                </label>
              </div>

              {/* Quantity Preview Badge */}
              <div className="export-preview-badge">
                📊 Ready to export: <strong>{finalExportData.length}</strong> of {dateFilteredData.length} records
              </div>
            </div>
          )}

          {/* ════ STEP 3: FORMAT & DOWNLOAD ════ */}
          {currentStep === 3 && (
            <div className="export-step-container">
              <label className="export-field-label">Select File Format</label>
              <div className="export-format-grid-3">
                <button
                  type="button"
                  className={`export-format-btn ${format === 'xlsx' ? 'active' : ''}`}
                  onClick={() => setFormat('xlsx')}
                >
                  <FileSpreadsheet size={24} />
                  <div>
                    <p className="format-btn-title">Excel (.xlsx)</p>
                    <p className="format-btn-desc">Spreadsheet</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`export-format-btn ${format === 'csv' ? 'active' : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  <FileText size={24} />
                  <div>
                    <p className="format-btn-title">CSV (.csv)</p>
                    <p className="format-btn-desc">Comma Separated</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`export-format-btn ${format === 'json' ? 'active' : ''}`}
                  onClick={() => setFormat('json')}
                >
                  <Code2 size={24} />
                  <div>
                    <p className="format-btn-title">JSON (.json)</p>
                    <p className="format-btn-desc">Structured Data</p>
                  </div>
                </button>
              </div>

              {/* Pre-flight Summary Card */}
              <div className="export-summary-card">
                <h4 className="summary-title">Export Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Target Dataset</span>
                    <span className="summary-value">{filenameBase}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Date Scope</span>
                    <span className="summary-value">{dateRange.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Records</span>
                    <span className="summary-value highlight">{finalExportData.length} records</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Selected Fields</span>
                    <span className="summary-value">{selectedColumns.length} columns</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="export-modal-footer">
          {currentStep > 1 ? (
            <button
              type="button"
              className="export-btn cancel"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isLoading}
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <button type="button" className="export-btn cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              className="export-btn primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={selectedColumns.length === 0}
            >
              Next Step
              <ArrowRight size={15} />
            </button>
          ) : (
            <button type="button" className="export-btn primary" onClick={handleGenerate} disabled={isLoading}>
              <Download size={15} />
              {isLoading ? 'Generating File...' : 'Download Export'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
