import React, { useState, useEffect, useCallback } from 'react';
import { recipeService } from '../../../services/recipes';
import { INGREDIENT_ID_TO_NAME } from '../../../utils/compatibility';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../../components/Button/Button';
import './CompatibilityRules.css';

const PRODUCTS = [
  { id: 27, name: '50:50 Base' },
  { id: 28, name: '70:30 Base' },
  { id: 29, name: '100% Arabica Base' },
  { id: 30, name: 'SIF Base' },
  { id: 31, name: 'Cascara Base' },
];

const RULE_TYPES = ['excludes', 'requires', 'conditional', 'size_lock', 'max_count'];

const RULE_TYPE_LABELS = {
  excludes: 'Exclude (if A, cannot use B)',
  requires: 'Require (if A, must also use B)',
  conditional: 'Conditional (complex if/then/else)',
  size_lock: 'Size Lock (limit to specific sizes)',
  max_count: 'Max Count (limit per group)',
};

const emptyRule = {
  rule_type: 'excludes',
  rule_name: '',
  condition_json: '{"if":{"ingredient_id":""},"then":{"exclude":[]},"message":""}',
  error_message: '',
  display_order: 1,
  is_active: true,
};

function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function resolveIngredientNames(jsonStr) {
  try {
    const c = JSON.parse(jsonStr);
    const parts = [];

    if (c.if?.ingredient_id) {
      const name = INGREDIENT_ID_TO_NAME[c.if.ingredient_id] || `#${c.if.ingredient_id}`;
      parts.push(`If "${name}"`);
    } else if (c.if?.group_id) {
      parts.push(`If group #${c.if.group_id}`);
    } else if (c.if?.temperature) {
      parts.push(`If "${c.if.temperature}"`);
    } else if (c.if?.size) {
      parts.push(`If size "${c.if.size}"`);
    }

    if (c.then?.exclude?.length) {
      const names = c.then.exclude.map((id) => INGREDIENT_ID_TO_NAME[id] || `#${id}`);
      parts.push(`→ exclude [${names.join(', ')}]`);
    }
    if (c.then?.require?.length) {
      const names = c.then.require.map((id) => INGREDIENT_ID_TO_NAME[id] || `#${id}`);
      parts.push(`→ require [${names.join(', ')}]`);
    }
    if (c.then?.disable?.length) {
      const names = c.then.disable.map((id) => INGREDIENT_ID_TO_NAME[id] || `#${id}`);
      parts.push(`→ disable [${names.join(', ')}]`);
    }
    if (c.else?.exclude?.length) {
      const names = c.else.exclude.map((id) => INGREDIENT_ID_TO_NAME[id] || `#${id}`);
      parts.push(`→ else exclude [${names.join(', ')}]`);
    }

    if (c.allowed_sizes) {
      parts.push(`Allowed sizes: ${c.allowed_sizes.join(', ')}`);
    }
    if (c.group_id !== undefined) {
      parts.push(`Group #${c.group_id}, max ${c.max || '?'}`);
    }

    return parts.join(' ') || c.message || 'No condition defined';
  } catch {
    return jsonStr;
  }
}

const CompatibilityRules = () => {
  const [selectedProduct, setSelectedProduct] = useState(27);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({ ...emptyRule });
  const [jsonError, setJsonError] = useState('');

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recipeService.getCompatibilityRules(selectedProduct);
      setRules(res.data || []);
    } catch {
      setRules([]);
      toast.error('Failed to load compatibility rules');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openCreate = () => {
    setEditingRule(null);
    setForm({ ...emptyRule, display_order: rules.length + 1 });
    setJsonError('');
    setShowModal(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      rule_type: rule.rule_type,
      rule_name: rule.rule_name,
      condition_json: rule.condition_json,
      error_message: rule.error_message || '',
      display_order: rule.display_order,
      is_active: rule.is_active,
    });
    setJsonError('');
    setShowModal(true);
  };

  const handleJsonChange = (value) => {
    setForm({ ...form, condition_json: value });
    if (!value.trim()) {
      setJsonError('Condition JSON is required');
    } else if (!isValidJson(value)) {
      setJsonError('Invalid JSON format');
    } else {
      setJsonError('');
    }
  };

  const handleSave = async () => {
    if (!form.rule_name.trim()) {
      toast.error('Rule name is required');
      return;
    }
    if (!form.condition_json.trim()) {
      toast.error('Condition JSON is required');
      return;
    }
    if (!isValidJson(form.condition_json)) {
      toast.error('Invalid JSON in condition');
      return;
    }

    const parsed = JSON.parse(form.condition_json);
    if (form.rule_type === 'excludes' && !parsed.then?.exclude?.length) {
      toast.error('Exclude rule must have at least one excluded ingredient');
      return;
    }
    if (form.rule_type === 'requires' && !parsed.then?.require?.length) {
      toast.error('Require rule must have at least one required ingredient');
      return;
    }

    try {
      if (editingRule) {
        await recipeService.updateCompatibilityRule(editingRule.id, form);
        toast.success('Rule updated');
      } else {
        await recipeService.createCompatibilityRule(selectedProduct, form);
        toast.success('Rule created');
      }
      setShowModal(false);
      fetchRules();
    } catch (err) {
      toast.error(err.message || 'Failed to save rule');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Delete this compatibility rule?')) return;
    try {
      await recipeService.deleteCompatibilityRule(ruleId);
      toast.success('Rule deleted');
      fetchRules();
    } catch (err) {
      toast.error(err.message || 'Failed to delete rule');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await recipeService.updateCompatibilityRule(rule.id, { is_active: !rule.is_active });
      toast.success(rule.is_active ? 'Rule disabled' : 'Rule enabled');
      fetchRules();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle rule');
    }
  };

  return (
    <div className="compatibility-rules-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Compatibility Rules</h1>
          <p className="page-subtitle">Ingredient compatibility rules for build-your-own bases</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary comp-btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Rule
          </button>
        </div>
      </div>

      <div className="filters-row">
        <label style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--al-text-secondary)' }}>PRODUCT</label>
        <select className="filter-select" value={selectedProduct} onChange={(e) => setSelectedProduct(Number(e.target.value))}>
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="al-loading"><Loader2 className="spin" size={20} /> Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="empty-state">No compatibility rules for this product. Click "New Rule" to create one.</div>
      ) : (
        <div className="cms-table-container" style={{ overflowX: 'auto' }}>
          <table className="cms-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th>Name</th>
                <th style={{ width: 100 }}>Type</th>
                <th>Condition</th>
                <th style={{ width: 160 }}>Message</th>
                <th style={{ width: 72 }}>Active</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.display_order}</td>
                  <td><strong>{rule.rule_name}</strong></td>
                  <td>
                    <span className="comp-type-badge" data-type={rule.rule_type}>
                      {rule.rule_type}
                    </span>
                  </td>
                  <td className="comp-condition-cell" title={resolveIngredientNames(rule.condition_json)}>
                    {resolveIngredientNames(rule.condition_json)}
                  </td>
                  <td className="comp-msg-cell">{rule.error_message}</td>
                  <td>
                    <button className="comp-icon-btn" onClick={() => handleToggleActive(rule)} title={rule.is_active ? 'Disable' : 'Enable'}>
                      {rule.is_active ? <ToggleRight size={18} className="comp-active-icon" /> : <ToggleLeft size={18} className="comp-inactive-icon" />}
                    </button>
                  </td>
                  <td>
                    <div className="comp-action-cell">
                      <button className="comp-icon-btn" onClick={() => openEdit(rule)} title="Edit"><Pencil size={15} /></button>
                      <button className="comp-icon-btn comp-icon-danger" onClick={() => handleDelete(rule.id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingRule ? 'Edit Rule' : 'New Rule'}</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Rule Name</label>
                <input value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} placeholder="e.g. Coconut Milk excludes Golden Cream" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}>
                  {RULE_TYPES.map((t) => <option key={t} value={t}>{RULE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <div className="form-group full-width">
                <label>Condition JSON</label>
                <textarea
                  value={form.condition_json}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={4}
                  className={jsonError ? 'comp-input-error' : ''}
                />
                {jsonError && (
                  <span className="comp-form-error">
                    <AlertCircle size={12} /> {jsonError}
                  </span>
                )}
                <span className="comp-form-hint">
                  {'{ "if": { "ingredient_id": 11 }, "then": { "exclude": [26] }, "message": "..." }'}
                </span>
                <span className="comp-form-hint">
                  IDs: 1=50-50, 2=70-30, 8=Dairy Milk, 9=Oat Milk, 10=Almond, 11=Coconut, 26=Golden Cream
                </span>
              </div>
              <div className="form-group full-width">
                <label>Error Message (user-facing)</label>
                <input value={form.error_message} onChange={(e) => setForm({ ...form, error_message: e.target.value })} placeholder="Not available with this combination" />
              </div>
            </div>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <button className="btn-primary comp-btn-primary" onClick={handleSave} disabled={!!jsonError}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompatibilityRules;
