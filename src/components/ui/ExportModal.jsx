import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Square, FileSpreadsheet, FileText, X, Download } from 'lucide-react';
import './ExportModal.css';

/**
 * ExportModal — adapted from ICIT-Frontend ExportModal.
 *
 * Props:
 *   isOpen        boolean
 *   onClose       () => void
 *   title         string        e.g. "Export Orders"
 *   columns       { key, label, required? }[]
 *   data          any[]         the full filtered dataset
 *   filenameBase  string        e.g. "Chilld_Orders"
 */
const ExportModal = ({
  isOpen,
  onClose,
  title = 'Export Data',
  columns = [],
  data = [],
  filenameBase = 'CRM_Export',
}) => {
  const [dateRange, setDateRange] = useState('CURRENT');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [format, setFormat] = useState('csv');
  const [showColumnCustomization, setShowColumnCustomization] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDateRange('CURRENT');
      setFormat('csv');
      setSelectedColumns(columns.map((c) => c.key));
      setShowColumnCustomization(false);
      setCustomStart('');
      setCustomEnd('');
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

  // ── Date filtering ──
  const getFilteredData = useCallback(() => {
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
      // Try common date fields
      const dateVal =
        row.createdAt || row.created_at || row.date || row.orderDate || row.timestamp;
      if (!dateVal) return true; // no date → include
      const rowDate = new Date(dateVal);
      if (isNaN(rowDate.getTime())) return true;
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    });
  }, [data, dateRange, customStart, customEnd]);

  // ── CSV generation ──
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

  // ── Download trigger ──
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
      const filteredRows = getFilteredData();
      const activeCols = columns.filter((c) => selectedColumns.includes(c.key));

      if (filteredRows.length === 0) {
        alert('No data to export for the selected date range.');
        return;
      }

      if (format === 'csv') {
        const csvContent = generateCSV(filteredRows, activeCols);
        downloadBlob(csvContent, 'text/csv;charset=utf-8;', 'csv');
      } else {
        // XLSX format — generate as TSV (tab-separated) with .xlsx extension
        // This opens correctly in Excel
        const headerRow = activeCols.map((c) => c.label).join('\t');
        const dataRows = filteredRows.map((row) =>
          activeCols.map((c) => {
            let val = row[c.key];
            if (val === undefined || val === null) val = '';
            if (typeof val === 'object') val = JSON.stringify(val);
            return String(val).replace(/\t/g, ' ');
          }).join('\t')
        );
        const tsvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');
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
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="export-modal-title">{title}</h3>
              <p className="export-modal-subtitle">Configure and download export file</p>
            </div>
          </div>
          <button className="export-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="export-modal-body">
          {/* Date Range */}
          <div className="export-field-group">
            <label className="export-field-label">Date Range Scope</label>
            <select
              className="export-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="CURRENT">Current Filters Applied</option>
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

          {/* Format Selection */}
          <div className="export-field-group">
            <label className="export-field-label">Export Format</label>
            <div className="export-format-grid">
              <button
                type="button"
                className={`export-format-btn ${format === 'xlsx' ? 'active' : ''}`}
                onClick={() => setFormat('xlsx')}
              >
                <FileSpreadsheet size={22} />
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
                <FileText size={22} />
                <div>
                  <p className="format-btn-title">CSV (.csv)</p>
                  <p className="format-btn-desc">Plain text</p>
                </div>
              </button>
            </div>
          </div>

          {/* Column Customization */}
          <div className="export-columns-section">
            <button
              type="button"
              className="export-columns-toggle"
              onClick={() => setShowColumnCustomization(!showColumnCustomization)}
            >
              <span className="export-columns-label">
                Customize Fields ({selectedColumns.length} of {columns.length} selected)
              </span>
              <span className="export-columns-action">
                {showColumnCustomization ? 'Hide Options' : 'Show Options'}
              </span>
            </button>

            {showColumnCustomization && (
              <div className="export-columns-panel">
                <div className="export-columns-toolbar">
                  <button type="button" onClick={selectAllColumns} className="col-action-btn highlight">
                    Select All
                  </button>
                  <span className="col-separator">|</span>
                  <button type="button" onClick={clearOptionalColumns} className="col-action-btn">
                    Required Only
                  </button>
                </div>
                <div className="export-columns-grid">
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="export-modal-footer">
          <button className="export-btn cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="export-btn primary" onClick={handleGenerate} disabled={isLoading}>
            <Download size={15} />
            {isLoading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
