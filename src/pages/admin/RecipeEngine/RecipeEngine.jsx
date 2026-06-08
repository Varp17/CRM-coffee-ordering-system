import React, { useState, useEffect } from 'react';
import './RecipeEngine.css';
import { productService } from '../../../services/products';
import { menuRecipeService } from '../../../services/menuRecipes';
import { formatCurrency } from '../../../utils/formatters';
import { unwrapList, unwrapObject } from '../../../utils/apiResponse';
import toast from 'react-hot-toast';

const RecipeEngine = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [linkedRecipe, setLinkedRecipe] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

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
        setSelectedProduct(pList[0]);
      }
    } catch (err) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedProduct || recipes.length === 0) {
      setLinkedRecipe(null);
      setRecipeIngredients([]);
      return;
    }

    const recipe = recipes.find(
      r => r.id === selectedProduct.recipe_id || r.uuid === selectedProduct.recipe_id
    );

    if (recipe) {
      setLinkedRecipe(recipe);
      setRecipeIngredients(recipe.ingredients || recipe.recipe_ingredients || []);
    } else {
      setLinkedRecipe(null);
      setRecipeIngredients([]);
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
      <div className="recipe-engine-view flex-center" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading Recipe Engine...</p>
      </div>
    );
  }

  return (
    <div className="recipe-engine-view animate-fade-in">
      <div className="view-header">
        <div>
          <h2 className="section-title">Recipe Specification Engine</h2>
          <p className="section-subtitle">View recipes linked to products with ingredient costs and profit analysis.</p>
        </div>
      </div>

      <div className="recipe-workspace-layout">
        {/* Left Side: Product Index List */}
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

        {/* Right Side: Recipe Viewer */}
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

export default RecipeEngine;
