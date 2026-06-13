import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../../../../services/products';
import { menuRecipeService } from '../../../../services/menuRecipes';
import { brewRecipeService } from '../../../../services/brewRecipes';
import { formatCurrency } from '../../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../../utils/apiResponse';
import toast from 'react-hot-toast';

const EngineTab = ({ refreshKey, setLoading }) => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [linkedRecipe, setLinkedRecipe] = useState(null);
  const [linkedBrewRecipe, setLinkedBrewRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (setLoading) {
      setLoading(isLoading);
    }
  }, [isLoading, setLoading]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        productService.getAll(),
        menuRecipeService.list(),
      ]);
      const pList = unwrapList(pRes);
      const rList = unwrapList(rRes);
      setProducts(pList);
      setRecipes(rList);

      if (pList.length > 0) {
        // Maintain selection if already selected
        setSelectedProduct(prev => {
          if (prev) {
            const updated = pList.find(p => p.id === prev.id);
            if (updated) return updated;
          }
          return pList[0];
        });
      }
    } catch (err) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedProduct || recipes.length === 0) {
      setLinkedRecipe(null);
      setRecipeIngredients([]);
      setLinkedBrewRecipe(null);
      return;
    }

    const recipe = recipes.find(
      r => r._pk === selectedProduct.recipe_id || r.id === selectedProduct.recipe_id || r.uuid === selectedProduct.recipe_id
    );

    if (recipe) {
      setLinkedRecipe(recipe);
      setRecipeIngredients(recipe.ingredients || recipe.recipe_ingredients || []);

      if (recipe.brew_recipe_id) {
        brewRecipeService.getById(recipe.brew_recipe_id)
          .then(res => setLinkedBrewRecipe(unwrapObject(res)))
          .catch(() => setLinkedBrewRecipe(null));
      } else {
        setLinkedBrewRecipe(null);
      }
    } else {
      setLinkedRecipe(null);
      setRecipeIngredients([]);
      setLinkedBrewRecipe(null);
    }
  }, [selectedProduct, recipes]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const calculateCostPerCup = (list) => {
    if (!Array.isArray(list)) return 0;
    return list.reduce((acc, curr) => {
      if (!curr) return acc;
      const ing = curr.ingredient || {};
      const qty = parseFloat(curr.quantity || 0);
      const cpu = parseFloat(ing.cost_per_unit || curr.cost_per_unit || 0);
      return acc + (qty * cpu);
    }, 0);
  };

  const currentCost = calculateCostPerCup(recipeIngredients);
  const basePrice = selectedProduct?.base_price || selectedProduct?.basePrice || 0;
  const grossProfit = Math.max(0, basePrice - currentCost);
  const profitMargin = basePrice > 0 ? Math.round((grossProfit / basePrice) * 100) : 0;

  if (isLoading && products.length === 0) {
    return (
      <div className="recipe-engine-view flex-center" style={{ height: '40vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Recipe Engine...</p>
      </div>
    );
  }

  return (
    <div className="recipe-engine-view animate-fade-in">
      <div className="recipe-workspace-layout">
        <div className="recipe-sidebar-nav">
          <h3>Products Catalog</h3>
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

        <div className="recipe-composer-workspace">
          {selectedProduct && (
            <div className="recipe-viewer animate-slide-up">
              <div className="composer-form-header">
                <div>
                  <span className="recipe-detail-category">{selectedProduct.category_name || 'Beverage'}</span>
                  <h2>{selectedProduct.name}</h2>
                </div>
                {linkedRecipe && (
                  <span className="recipe-nav-btn" style={{ padding: '6px 12px', cursor: 'default' }}>
                    Recipe: {linkedRecipe.recipe_code || linkedRecipe.name}
                  </span>
                )}
              </div>

              <div className="pricing-margin-analyser">
                <div className="analyser-tile">
                  <span>Retail Base Price</span>
                  <strong>{formatCurrency(basePrice)}</strong>
                </div>
                <div className="analyser-tile">
                  <span>Estimated Cost</span>
                  <strong>{formatCurrency(currentCost)}</strong>
                </div>
                <div className="analyser-tile">
                  <span>Est. Gross Profit</span>
                  <strong className="profit-text">{formatCurrency(grossProfit)}</strong>
                </div>
                <div className="analyser-tile">
                  <span>Profit Margin</span>
                  <strong className="margin-text">{profitMargin}%</strong>
                </div>
              </div>

              {linkedBrewRecipe && (
                <div className="viewer-block" style={{ gridColumn: 'span 2' }}>
                  <h3>Concentrate Formula — {linkedBrewRecipe.name}</h3>
                  {(linkedBrewRecipe.brew_time_hours || linkedBrewRecipe.ratio_description || linkedBrewRecipe.expected_ph || linkedBrewRecipe.expected_brix || linkedBrewRecipe.expected_tds) && (
                    <div className="brew-params" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '8px 0 16px' }}>
                      {linkedBrewRecipe.brew_time_hours && (
                        <span className="param-chip"><strong>Brew Time:</strong> {linkedBrewRecipe.brew_time_hours}h</span>
                      )}
                      {linkedBrewRecipe.ratio_description && (
                        <span className="param-chip"><strong>Ratio:</strong> {linkedBrewRecipe.ratio_description}</span>
                      )}
                      {linkedBrewRecipe.expected_ph && (
                        <span className="param-chip"><strong>pH:</strong> {linkedBrewRecipe.expected_ph}</span>
                      )}
                      {linkedBrewRecipe.expected_brix && (
                        <span className="param-chip"><strong>Brix:</strong> {linkedBrewRecipe.expected_brix}°</span>
                      )}
                      {linkedBrewRecipe.expected_tds && (
                        <span className="param-chip"><strong>TDS:</strong> {linkedBrewRecipe.expected_tds}%</span>
                      )}
                    </div>
                  )}
                  {Array.isArray(linkedBrewRecipe.raw_materials) && linkedBrewRecipe.raw_materials.length > 0 && (
                    <table className="rb-ing-table" style={{ marginTop: '12px' }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Raw Material</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkedBrewRecipe.raw_materials.map((rm, idx) => {
                          const rmName = rm.raw_material?.name || rm.raw_material_name || rm.name || '—';
                          const rmQty = rm.quantity || rm.qty || '—';
                          const rmUnit = rm.unit || rm.raw_material?.unit || 'g';
                          return (
                            <tr key={rm.id || idx}>
                              <td>{idx + 1}</td>
                              <td>{rmName}</td>
                              <td>{rmQty}</td>
                              <td>{rmUnit}</td>
                              <td>—</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              <div className="recipe-sections-grid">
                <div className="viewer-block" style={{ gridColumn: 'span 2' }}>
                  <h3>Recipe Ingredients</h3>
                  {linkedRecipe ? (
                    recipeIngredients.length > 0 ? (
                      <table className="rb-ing-table" style={{ marginTop: '12px' }}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Ingredient</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Cost/Unit</th>
                            <th>Line Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipeIngredients.map((item, idx) => {
                            const ing = item.ingredient || {};
                            const qty = parseFloat(item.quantity || 0);
                            const cpu = parseFloat(ing.cost_per_unit || item.cost_per_unit || 0);
                            const lineCost = qty * cpu;
                            return (
                              <tr key={item.id || idx}>
                                <td>{idx + 1}</td>
                                <td>{ing.name || item.ingredient_name || '—'}</td>
                                <td>{qty}</td>
                                <td>{item.unit || ing.unit || 'ml'}</td>
                                <td>{formatCurrency(cpu)}</td>
                                <td>{formatCurrency(lineCost)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={5}><strong>Total Cost</strong></td>
                            <td><strong>{formatCurrency(currentCost)}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <p className="empty-helper-text">Recipe has no ingredients mapped yet.</p>
                    )
                  ) : (
                    <p className="empty-helper-text">No recipe linked to this product. Go to Recipe Builder to create one.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EngineTab;
