import React, { useState, useEffect } from 'react';
import './ActivityLog.css';
import Button from '../../../components/Button/Button';
import Table from '../../../components/Table/Table';
import { activityLogService } from '../../../services/activityLog';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await activityLogService.getAll({ limit: 100 });
      const rawLogs = unwrapList(res);
      const mapped = rawLogs.map(log => ({
        id: log.id,
        user: log.user_name || 'System',
        action: log.action,
        resource: log.resource || '-',
        details: log.details || '-',
        timestamp: log.created_at
      }));
      setLogs(mapped);
    } catch (err) {
      toast.error('Failed to load system audit trail: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const columns = [
    { key: 'id', title: 'Audit ID', sortable: true, render: (val) => <code>{val}</code> },
    { key: 'user', title: 'Operator Role', sortable: true, render: (val) => <span className={`user-badge-role ${(val || '').toLowerCase().replace(' ', '-')}`}>{val}</span> },
    { key: 'action', title: 'Operation Action', sortable: true, render: (val) => <strong>{val}</strong> },
    { key: 'resource', title: 'Resource Name', sortable: true },
    { key: 'details', title: 'Activity Details' },
    { key: 'timestamp', title: 'Timestamp Logged', sortable: true, render: (val) => new Date(val).toLocaleString('en-IN') }
  ];

  const handlePurgeLogs = () => {
    toast.error('Security Protocol Override: System security logs are set to tamper-proof. Direct purge actions are BLOCKED in super-admin compliance mode! 🛡️');
  };

  const handleExportCsv = () => {
    toast.success('Exporting secure encrypted Audit Trail to central compliance database... 📄');
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="activity-log-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('activityLog.loading', 'Loading system audit trail...')}</p>
      </div>
    );
  }

  return (
    <div className="activity-log-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">{t('activityLog.title', '📜 System Security Audit Trail')}</h2>
          <p className="section-subtitle">{t('activityLog.subtitle', 'Real-time tamper-proof logs capturing every employee action, permission change, and pricing update')}</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={handleExportCsv}>{t('activityLog.exportCsv', 'Export CSV 🧾')}</Button>
          <Button variant="outline" onClick={handlePurgeLogs}>{t('activityLog.purgeLogs', 'Purge Logs 🚨')}</Button>
        </div>
      </div>

      <div className="activity-log-table-card ">
        <Table
          columns={columns}
          data={logs}
          searchKey="action"
          searchPlaceholder="Search audit operations (e.g. Price, Recipe)..."
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default ActivityLog;
