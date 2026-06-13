import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, Eye, Trash2, ArrowUpDown } from 'lucide-react';
import './DataTable.css';

export const DataTable = ({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKey = '',
  onRowView = null,
  onRowDelete = null,
  onRowClick = null,
  exportFileName = 'data-export'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sorting Handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 1. Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    return data.filter((row) => {
      const val = row[searchKey];
      return String(val || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchKey]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key];
        let bValue = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key];

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 3. Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // CSV Export Utility
  const handleExportCSV = () => {
    const headers = columns.map((col) => `"${col.header}"`).join(',');
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFileName}-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-table-wrapper">
      {/* Table Toolbar */}
      <div className="data-table-toolbar">
        {searchKey ? (
          <div className="data-table-search-wrapper">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="data-table-search-input"
            />
          </div>
        ) : (
          <div />
        )}
        <div>
          <button
            onClick={handleExportCSV}
            className="data-table-export-btn btn"
          >
            <Download className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.header}
                  onClick={() => col.sortable && handleSort(col.accessor)}
                >
                  <div className="data-table-header-cell" style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: col.sortable ? 'pointer' : 'default', color: 'var(--color-text-muted)' }}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span style={{ display: 'flex', alignItems: 'center', color: sortConfig.key === col.accessor ? 'var(--color-text-primary)' : 'var(--color-text-muted)', opacity: sortConfig.key === col.accessor ? 1 : 0.5 }}>
                        {sortConfig.key === col.accessor ? (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onRowView || onRowDelete) && (
                <th style={{ textAlign: 'right' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onRowView || onRowDelete ? 1 : 0)} style={{ textAlign: 'center', py: 8 }}>
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'data-table-row-clickable' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.header}>
                      {col.render
                        ? col.render(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor] ?? '-'}
                    </td>
                  ))}
                  {(onRowView || onRowDelete) && (
                    <td style={{ textAlign: 'right' }}>
                      {onRowView && (
                        <button
                          onClick={() => onRowView(row)}
                          className="action-btn-sm outline"
                          style={{ marginRight: '6px' }}
                        >
                          <Eye className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
                          <span>View</span>
                        </button>
                      )}
                      {onRowDelete && (
                        <button
                          onClick={() => onRowDelete(row)}
                          className="action-btn-sm outline"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ display: 'inline', marginRight: '4px' }} />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="data-table-footer">
        <div>
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} records
        </div>
        {totalPages > 1 && (
          <div className="data-table-pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="data-table-pg-btn btn"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`data-table-pg-btn btn ${currentPage === p ? 'active' : ''}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="data-table-pg-btn btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
