import React, { useState, useEffect, useMemo } from 'react';
import './FoodSafety.css';
import Button from '../../../components/Button/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { foodSafetyService } from '../../../services/foodSafety';
import { unwrapList } from '../../../utils/apiResponse';
import { formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

const LICENSE_TYPES = ['fssai', 'health', 'trade', 'fire', 'other'];
const LICENSE_STATUSES = ['active', 'expired', 'expiring_soon'];

const FoodSafety = () => {
  const [currentTab, setCurrentTab] = useState('licenses');
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [showExpiring, setShowExpiring] = useState(false);

  const [productId, setProductId] = useState('');
  const [allergens, setAllergens] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [allergenRows, setAllergenRows] = useState([]);
  const [nutritionForm, setNutritionForm] = useState({
    serving_size: '', calories: '', fat: '', carbs: '', protein: '', sodium: '', caffeine: '',
  });

  const [licenseForm, setLicenseForm] = useState({
    license_number: '', type: 'fssai', business_name: '', store: '',
    issue_date: '', expiry_date: '', status: 'active',
  });

  const loadLicenses = async (expiring = false) => {
    try {
      const params = expiring ? { expiring_soon: true } : {};
      const resp = expiring
        ? await foodSafetyService.getExpiringLicenses(params)
        : await foodSafetyService.getLicenses(params);
      setLicenses(unwrapList(resp));
    } catch (err) {
      toast.error('Failed to load licenses: ' + err.message);
    }
  };

  const loadAllergens = async (id) => {
    if (!id) return;
    try {
      const resp = await foodSafetyService.getAllergens(id);
      const data = unwrapList(resp);
      setAllergens(data);
      setAllergenRows(data.length > 0 ? data.map((a) => ({ name: a.name, is_present: a.is_present, notes: a.notes || '' })) : [{ name: '', is_present: false, notes: '' }]);
    } catch {
      setAllergens([]);
      setAllergenRows([{ name: '', is_present: false, notes: '' }]);
    }
  };

  const loadNutrition = async (id) => {
    if (!id) return;
    try {
      const resp = await foodSafetyService.getNutrition(id);
      const data = resp?.data || resp;
      setNutrition(data);
      setNutritionForm({
        serving_size: data?.serving_size || '', calories: data?.calories || '',
        fat: data?.fat || '', carbs: data?.carbs || '', protein: data?.protein || '',
        sodium: data?.sodium || '', caffeine: data?.caffeine || '',
      });
    } catch {
      setNutrition(null);
      setNutritionForm({
        serving_size: '', calories: '', fat: '', carbs: '', protein: '', sodium: '', caffeine: '',
      });
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadLicenses();
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (currentTab === 'allergens' && productId) loadAllergens(productId);
    if (currentTab === 'nutrition' && productId) loadNutrition(productId);
  }, [currentTab, productId]);

  const openAddLicense = () => {
    setEditingLicense(null);
    setLicenseForm({
      license_number: '', type: 'fssai', business_name: '', store: '',
      issue_date: '', expiry_date: '', status: 'active',
    });
    setShowLicenseModal(true);
  };

  const openEditLicense = (item) => {
    setEditingLicense(item);
    setLicenseForm({
      license_number: item.license_number, type: item.type, business_name: item.business_name,
      store: item.store || '', issue_date: item.issue_date?.split('T')[0] || '',
      expiry_date: item.expiry_date?.split('T')[0] || '', status: item.status,
    });
    setShowLicenseModal(true);
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLicense) {
        await foodSafetyService.updateLicense(editingLicense.id, licenseForm);
        toast.success('License updated');
      } else {
        await foodSafetyService.createLicense(licenseForm);
        toast.success('License created');
      }
      setShowLicenseModal(false);
      loadLicenses();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDeleteLicense = async (item) => {
    if (!window.confirm(`Delete license "${item.license_number}"?`)) return;
    try {
      await foodSafetyService.deleteLicense(item.id);
      toast.success('License deleted');
      loadLicenses();
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleAllergenRowChange = (index, field, value) => {
    const updated = [...allergenRows];
    updated[index] = { ...updated[index], [field]: value };
    setAllergenRows(updated);
  };

  const addAllergenRow = () => {
    setAllergenRows([...allergenRows, { name: '', is_present: false, notes: '' }]);
  };

  const removeAllergenRow = (index) => {
    if (allergenRows.length <= 1) return;
    setAllergenRows(allergenRows.filter((_, i) => i !== index));
  };

  const handleAllergensSave = async () => {
    if (!productId) return;
    try {
      await foodSafetyService.setAllergens(productId, { allergens: allergenRows });
      toast.success('Allergens updated');
      loadAllergens(productId);
    } catch (err) {
      toast.error('Failed to save allergens: ' + err.message);
    }
  };

  const handleNutritionSave = async () => {
    if (!productId) return;
    try {
      await foodSafetyService.setNutrition(productId, nutritionForm);
      toast.success('Nutrition info updated');
      loadNutrition(productId);
    } catch (err) {
      toast.error('Failed to save nutrition: ' + err.message);
    }
  };

  const licenseColumns = useMemo(() => [
    { header: 'License #', accessor: 'license_number', sortable: true },
    { header: 'Type', accessor: 'type', sortable: true },
    { header: 'Business Name', accessor: 'business_name', sortable: true },
    { header: 'Store', accessor: 'store', sortable: true },
    { header: 'Issue Date', accessor: (row) => formatDate(row.issue_date) },
    { header: 'Expiry Date', accessor: (row) => formatDate(row.expiry_date) },
    {
      header: 'Status', accessor: 'status', sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status}`}>
          {row.status === 'expiring_soon' ? 'Expiring Soon' : row.status}
        </span>
      ),
    },
  ], []);

  return (
    <div className="food-safety-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Food Safety</h2>
          <p className="page-subtitle">Manage licenses, allergens, and nutritional information</p>
        </div>
      </div>

      <div className="safety-tabs">
        {[
          { key: 'licenses', label: 'Licenses' },
          { key: 'allergens', label: 'Allergens' },
          { key: 'nutrition', label: 'Nutrition' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${currentTab === tab.key ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab === 'licenses' && (
        <>
          <div className="filters-row">
            <Button onClick={() => loadLicenses()} variant="ghost"><RefreshCw size={16} /></Button>
            <Button
              variant={showExpiring ? 'primary' : 'outline'}
              onClick={() => { setShowExpiring(!showExpiring); loadLicenses(!showExpiring); }}
            >
              <AlertTriangle size={16} /> Expiring Soon
            </Button>
            <Button onClick={openAddLicense} variant="primary"><Plus size={16} /> Add License</Button>
          </div>
          <DataTable
            columns={licenseColumns}
            data={licenses}
            searchKey="license_number"
            searchPlaceholder="Search licenses..."
            exportFileName="food-safety-licenses"
            onRowView={(item) => openEditLicense(item)}
            onRowDelete={(item) => handleDeleteLicense(item)}
          />
        </>
      )}

      {currentTab === 'allergens' && (
        <div className="allergens-panel">
          <div className="filters-row">
            <div className="form-group" style={{ flex: 1, maxWidth: 400 }}>
              <input
                type="text" placeholder="Enter Product ID..."
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="search-input"
              />
            </div>
            <Button onClick={() => loadAllergens(productId)} variant="ghost"><RefreshCw size={16} /></Button>
          </div>
          {productId ? (
            <div className="allergen-editor">
              <div className="allergen-table-wrapper">
                <table className="allergen-table">
                  <thead>
                    <tr>
                      <th>Allergen Name</th>
                      <th>Present</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allergenRows.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            value={row.name} placeholder="e.g. Milk, Nuts..."
                            onChange={(e) => handleAllergenRowChange(i, 'name', e.target.value)}
                          />
                        </td>
                        <td>
                          <label className="checkbox-label">
                            <input
                              type="checkbox" checked={row.is_present}
                              onChange={(e) => handleAllergenRowChange(i, 'is_present', e.target.checked)}
                            /> {row.is_present ? 'Yes' : 'No'}
                          </label>
                        </td>
                        <td>
                          <input
                            value={row.notes} placeholder="Optional notes"
                            onChange={(e) => handleAllergenRowChange(i, 'notes', e.target.value)}
                          />
                        </td>
                        <td>
                          <button className="icon-btn danger" onClick={() => removeAllergenRow(i)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="allergen-actions">
                <Button variant="outline" onClick={addAllergenRow}><Plus size={14} /> Add Row</Button>
                <Button variant="primary" onClick={handleAllergensSave}>Save Allergens</Button>
              </div>
            </div>
          ) : (
            <p className="empty-state">Enter a product ID to manage allergens.</p>
          )}
        </div>
      )}

      {currentTab === 'nutrition' && (
        <div className="nutrition-panel">
          <div className="filters-row">
            <div className="form-group" style={{ flex: 1, maxWidth: 400 }}>
              <input
                type="text" placeholder="Enter Product ID..."
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="search-input"
              />
            </div>
            <Button onClick={() => loadNutrition(productId)} variant="ghost"><RefreshCw size={16} /></Button>
          </div>
          {productId ? (
            <div className="nutrition-editor">
              <div className="form-grid">
                <div className="form-group"><label>Serving Size</label>
                  <input value={nutritionForm.serving_size} placeholder="e.g. 250ml" onChange={(e) => setNutritionForm({ ...nutritionForm, serving_size: e.target.value })} /></div>
                <div className="form-group"><label>Calories</label>
                  <input type="number" value={nutritionForm.calories} onChange={(e) => setNutritionForm({ ...nutritionForm, calories: e.target.value })} /></div>
                <div className="form-group"><label>Fat (g)</label>
                  <input type="number" step="0.1" value={nutritionForm.fat} onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })} /></div>
                <div className="form-group"><label>Carbs (g)</label>
                  <input type="number" step="0.1" value={nutritionForm.carbs} onChange={(e) => setNutritionForm({ ...nutritionForm, carbs: e.target.value })} /></div>
                <div className="form-group"><label>Protein (g)</label>
                  <input type="number" step="0.1" value={nutritionForm.protein} onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })} /></div>
                <div className="form-group"><label>Sodium (mg)</label>
                  <input type="number" value={nutritionForm.sodium} onChange={(e) => setNutritionForm({ ...nutritionForm, sodium: e.target.value })} /></div>
                <div className="form-group"><label>Caffeine (mg)</label>
                  <input type="number" value={nutritionForm.caffeine} onChange={(e) => setNutritionForm({ ...nutritionForm, caffeine: e.target.value })} /></div>
              </div>
              <div className="nutrition-actions">
                <Button variant="primary" onClick={handleNutritionSave}>Save Nutrition Info</Button>
              </div>
            </div>
          ) : (
            <p className="empty-state">Enter a product ID to edit nutritional information.</p>
          )}
        </div>
      )}

      {showLicenseModal && (
        <div className="modal-overlay" onClick={() => setShowLicenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingLicense ? 'Edit License' : 'Add License'}</h3>
            <form onSubmit={handleLicenseSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>License Number *</label>
                  <input name="license_number" value={licenseForm.license_number} onChange={(e) => setLicenseForm({ ...licenseForm, license_number: e.target.value })} required /></div>
                <div className="form-group"><label>Type</label>
                  <select value={licenseForm.type} onChange={(e) => setLicenseForm({ ...licenseForm, type: e.target.value })}>
                    {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select></div>
                <div className="form-group"><label>Business Name *</label>
                  <input value={licenseForm.business_name} onChange={(e) => setLicenseForm({ ...licenseForm, business_name: e.target.value })} required /></div>
                <div className="form-group"><label>Store</label>
                  <input value={licenseForm.store} onChange={(e) => setLicenseForm({ ...licenseForm, store: e.target.value })} /></div>
                <div className="form-group"><label>Issue Date</label>
                  <input type="date" value={licenseForm.issue_date} onChange={(e) => setLicenseForm({ ...licenseForm, issue_date: e.target.value })} /></div>
                <div className="form-group"><label>Expiry Date</label>
                  <input type="date" value={licenseForm.expiry_date} onChange={(e) => setLicenseForm({ ...licenseForm, expiry_date: e.target.value })} /></div>
                <div className="form-group"><label>Status</label>
                  <select value={licenseForm.status} onChange={(e) => setLicenseForm({ ...licenseForm, status: e.target.value })}>
                    {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowLicenseModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingLicense ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodSafety;
