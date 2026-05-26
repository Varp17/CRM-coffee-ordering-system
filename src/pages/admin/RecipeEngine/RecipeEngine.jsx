import React, { useState, useEffect } from 'react';
import './RecipeEngine.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import { recipeService } from '../../../services/recipes';
import { productService } from '../../../services/products';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';

const RecipeEngine = () => {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mappedIngredients, setMappedIngredients] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState([]);

  // Working States for adding a new ingredient mapping
  const [selectedIngId, setSelectedIngId] = useState('');
  const [quantityInput, setQuantityInput] = useState(10);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const pRes = await productService.getAll();
      const pList = unwrapList(pRes);
      setProducts(pList);

      const iRes = await recipeService.getAll();
      const iList = unwrapList(iRes);
      setIngredients(iList);

      if (pList.length > 0) {
        setSelectedProduct(pList[0]);
        await loadMappings(pList[0].id);
      }
    } catch (err) {
      toast.error('Failed to load recipe data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMappings = async (productUuid) => {
    try {
      const response = await recipeService.getIngredientMappings(productUuid);
      const mappings = unwrapList(response);
      setMappedIngredients(Array.isArray(mappings) ? mappings : []);
    } catch (err) {
      toast.error('Failed to load ingredient mappings: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setIsEditing(false);
    await loadMappings(product.id);
  };

  const handleStartEdit = () => {
    setEditedIngredients([...mappedIngredients]);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = editedIngredients.map(item => ({
        ingredient_id: Number(item.ingredient_id || item.id),
        quantity: Number(item.quantity),
        is_default: true,
        is_optional: false,
        price_override: null
      }));

      await recipeService.bulkSetMappings(selectedProduct.id, payload);
      toast.success(`Recipe for ${selectedProduct.name} saved successfully! 🧬`);
      setIsEditing(false);
      await loadMappings(selectedProduct.id);
    } catch (err) {
      toast.error('Failed to save recipe: ' + err.message);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedIngId) {
      toast.error('Please select an ingredient.');
      return;
    }

    const ingItem = ingredients.find(i => Number(i.id) === Number(selectedIngId) || i.uuid === selectedIngId);
    if (!ingItem) return;

    const exists = editedIngredients.some(item => Number(item.ingredient_id) === Number(ingItem.id));
    if (exists) {
      toast.error('This ingredient is already mapped to the product recipe.');
      return;
    }

    const newMapping = {
      ingredient_id: ingItem.id,
      name: ingItem.name,
      quantity: quantityInput,
      unit: ingItem.unit || 'ml'
    };

    setEditedIngredients([...editedIngredients, newMapping]);
    setSelectedIngId('');
    setQuantityInput(10);
    toast.success('Ingredient added to map.');
  };

  const handleRemoveIngredient = (index) => {
    const filtered = editedIngredients.filter((_, idx) => idx !== index);
    setEditedIngredients(filtered);
    toast.success('Ingredient removed.');
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="recipe-engine-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('recipeEngine.loading', 'Loading Recipe Engine...')}</p>
      </div>
    );
  }

  // Calculate gross cost per cup
  const calculateCostPerCup = (list) => {
    if (!Array.isArray(list)) return 0;
    return list.reduce((acc, curr) => {
      if (!curr) return acc;
      const idToFind = curr.ingredient_id || curr.id || curr.ingredient?.id;
      const ing = ingredients.find(i => i.id === idToFind || Number(i.id) === Number(idToFind) || i.uuid === idToFind);
      const costPerUnit = ing ? (ing.cost_per_unit || 0) : 0;
      return acc + (costPerUnit * (curr.quantity || 0));
    }, 0);
  };

  const currentCost = isEditing ? calculateCostPerCup(editedIngredients) : calculateCostPerCup(mappedIngredients);
  const basePrice = selectedProduct?.base_price || selectedProduct?.basePrice || 0;
  const grossProfit = Math.max(0, basePrice - currentCost);
  const profitMargin = basePrice > 0 ? Math.round((grossProfit / basePrice) * 100) : 0;

  return (
    <div className="recipe-engine-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">{t('recipeEngine.title', '🧬 Recipe Specification Engine')}</h2>
          <p className="section-subtitle">{t('recipeEngine.subtitle', 'Map raw warehouse inventory items to retail customer modifications')}</p>
        </div>
      </div>

      <div className="recipe-workspace-layout">
        {/* Left Side: Product Index List */}
        <div className="recipe-sidebar-nav ">
          <h3>{t('recipeEngine.sidebarTitle', 'Products Catalog')}</h3>
          <div className="recipe-list-scroll">
            {products.map((p) => (
              <button
                key={p.id}
                className={`recipe-nav-btn ${selectedProduct?.id === p.id ? 'active' : ''}`}
                onClick={() => handleSelectProduct(p)}
              >
                <div className="btn-main-row">
                  <strong>{p.name}</strong>
                </div>
                <div className="btn-sub-row">
                  <span>{p.category_name || 'Beverage'}</span>
                  <span>{formatCurrency(p.base_price || p.basePrice)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Working Composer Workspace */}
        <div className="recipe-composer-workspace ">
          {selectedProduct && (
            isEditing ? (
              /* Editing Mode */
              <div className="composer-form animate-slide-up">
                <div className="composer-form-header">
                  <h3>{t('recipeEngine.editorTitle', 'Formula Editor: ')}{selectedProduct.name}</h3>
                  <div className="composer-header-actions">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>{t('recipeEngine.cancel', 'Cancel')}</Button>
                    <Button variant="primary" onClick={handleSaveEdit}>{t('recipeEngine.saveFormula', 'Save Formula 💾')}</Button>
                  </div>
                </div>

                <div className="pricing-margin-analyser" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.retailPrice', 'Retail Base Price')}</span>
                    <strong>{formatCurrency(basePrice)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.estimatedCost', 'Estimated Cost')}</span>
                    <strong>{formatCurrency(currentCost)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.grossProfit', 'Est. Gross Profit')}</span>
                    <strong className="profit-text">{formatCurrency(grossProfit)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.profitMargin', 'Profit Margin')}</span>
                    <strong className="margin-text">{profitMargin}%</strong>
                  </div>
                </div>

                {/* Ingredients Mapping */}
                <div className="composer-block">
                  <h4>{t('recipeEngine.mapRawTitle', '1. Map Raw Inventory items')}</h4>
                  <div className="ingredient-creator-row">
                    <select
                      value={selectedIngId}
                      onChange={(e) => setSelectedIngId(e.target.value)}
                      className="styled-select"
                    >
                      <option value="">-- Choose Stock Item --</option>
                      {ingredients.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Qty"
                      type="number"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(parseFloat(e.target.value) || 0)}
                    />
                    <Button variant="outline" onClick={handleAddIngredient}>{t('recipeEngine.mapItemBtn', 'Map Item ➕')}</Button>
                  </div>

                  <div className="mapped-ingredients-list">
                    {editedIngredients.map((ing, idx) => (
                      <div key={idx} className="mapped-ing-item">
                        <span>📦 <strong>{ing.name || ingredients.find(i => i.id === ing.ingredient_id)?.name}</strong> - {ing.quantity} {ing.unit}</span>
                        <button type="button" className="remove-ing-btn" onClick={() => handleRemoveIngredient(idx)}>❌</button>
                      </div>
                    ))}
                    {editedIngredients.length === 0 && <p className="empty-helper-text">{t('recipeEngine.emptyMarginHelper', 'No active inventory items mapped. Coffee will have 100% gross margin!')}</p>}
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="recipe-viewer animate-slide-up">
                <div className="composer-form-header">
                  <div>
                    <span className="recipe-detail-category">{selectedProduct.category_name || 'Beverage'}</span>
                    <h2>{selectedProduct.name}</h2>
                  </div>
                  <Button variant="outline" onClick={handleStartEdit}>
                    {t('recipeEngine.editFormulaBtn', 'Edit Formula 📝')}
                  </Button>
                </div>

                <div className="pricing-margin-analyser">
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.retailPrice', 'Retail Base Price')}</span>
                    <strong>{formatCurrency(basePrice)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.estimatedCost', 'Estimated Cost')}</span>
                    <strong>{formatCurrency(currentCost)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.grossProfit', 'Est. Gross Profit')}</span>
                    <strong className="profit-text">{formatCurrency(grossProfit)}</strong>
                  </div>
                  <div className="analyser-tile">
                    <span>{t('recipeEngine.profitMargin', 'Profit Margin')}</span>
                    <strong className="margin-text">{profitMargin}%</strong>
                  </div>
                </div>

                <div className="recipe-sections-grid">
                  {/* Ingredients section */}
                  <div className="viewer-block " style={{ gridColumn: 'span 2' }}>
                    <h3>{t('recipeEngine.mapDetailsTitle', 'Inventory Map Details')}</h3>
                    <ul className="viewer-ing-list">
                      {mappedIngredients.map((ing, idx) => {
                        const originalIng = ingredients.find(i => Number(i.id) === Number(ing.ingredient_id) || i.id === ing.ingredient?.id || i.uuid === ing.ingredient?.id);
                        return (
                          <li key={idx}>
                            <span className="bullet">📦</span>
                            <div>
                              <strong>{ing.name || ing.ingredient?.name || originalIng?.name || 'Raw Ingredient'}</strong>
                              <p>{ing.quantity} {ing.unit || ing.ingredient?.unit || originalIng?.unit || 'g'} (Cost contribution: {formatCurrency(ing.quantity * (originalIng?.cost_per_unit || 0))})</p>
                            </div>
                          </li>
                        );
                      })}
                      {mappedIngredients.length === 0 && <p className="empty-helper-text">{t('recipeEngine.emptyIngredientsHelper', 'No active ingredients mapped to this product formula.')}</p>}
                    </ul>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeEngine;
