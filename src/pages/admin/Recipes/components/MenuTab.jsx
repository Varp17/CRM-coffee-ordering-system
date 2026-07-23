import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { menuRecipeService } from '../../../../services/menuRecipes';
import { brewRecipeService } from '../../../../services/brewRecipes';
import { productService } from '../../../../services/products';
import { unwrapList } from '../../../../utils/apiResponse';
import RecipeDetail from '../../RecipeBuilder/RecipeDetail';
import CostingSummary from '../../RecipeBuilder/CostingSummary';
import toast from 'react-hot-toast';

const MenuTab = ({ refreshKey, setLoading }) => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [brewRecipes, setBrewRecipes] = useState([]);
  const [brewLinkId, setBrewLinkId] = useState('');
  const [savingBrewLink, setSavingBrewLink] = useState(false);
  const [loading, setInternalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [activeTab, setActiveTab] = useState('ingredients');

  useEffect(() => {
    if (setLoading) {
      setLoading(loading);
    }
  }, [loading, setLoading]);

  const loadRecipes = () => {
    setInternalLoading(true);
    menuRecipeService.list()
      .then(res => {
        const list = unwrapList(res);
        if (Array.isArray(list) && list.length > 0) {
          setRecipes(list);
        }
      })
      .catch(() => {})
      .finally(() => setInternalLoading(false));
  };

  useEffect(() => {
    loadRecipes();
    productService.getAll({ limit: 200 })
      .then(res => setProducts(unwrapList(res)))
      .catch(err => console.error('[MenuTab] Error loading products:', err.message));
    brewRecipeService.list()
      .then(res => setBrewRecipes(unwrapList(res)))
      .catch(err => console.error('[MenuTab] Error loading brew recipes:', err.message));
  }, [refreshKey]);

  const filteredRecipes = useMemo(() => {
    return (recipes || []).filter(r =>
      searchQuery === '' ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recipe_code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find(r => r.id === selectedRecipeId || r.uuid === selectedRecipeId) || null;
  }, [recipes, selectedRecipeId]);

  const linkedProduct = useMemo(() => {
    if (!selectedRecipe) return null;
    return (products || []).find(p => p.recipe_id === selectedRecipe.id || p.recipe_id === selectedRecipe.uuid) || null;
  }, [products, selectedRecipe]);

  const linkedBrewRecipe = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.brew_recipe_id) return null;
    return brewRecipes.find(b => b._pk === Number(selectedRecipe.brew_recipe_id)) || null;
  }, [brewRecipes, selectedRecipe]);

  const profit = useMemo(() => {
    if (!selectedRecipe) return '0.00';
    const sellPrice = linkedProduct?.base_price || linkedProduct?.basePrice || 0;
    const totalCost = selectedRecipe.total_cost || 0;
    return sellPrice > 0 ? (sellPrice - totalCost).toFixed(2) : '0.00';
  }, [selectedRecipe, linkedProduct]);

  const margin = useMemo(() => {
    if (!selectedRecipe) return '0.0';
    const sellPrice = linkedProduct?.base_price || linkedProduct?.basePrice || 0;
    const totalCost = selectedRecipe.total_cost || 0;
    return sellPrice > 0 ? ((sellPrice - totalCost) / sellPrice * 100).toFixed(1) : '0.0';
  }, [selectedRecipe, linkedProduct]);

  const handleSelect = (recipe) => {
    setSelectedRecipeId(recipe.id || recipe.uuid);
    setBrewLinkId(recipe.brew_recipe_id ? String(recipe.brew_recipe_id) : '');
    setActiveTab('ingredients');
  };

  const handleSaveBrewLink = async () => {
    if (!selectedRecipe) return;
    setSavingBrewLink(true);
    try {
      await menuRecipeService.update(selectedRecipe.id || selectedRecipe.uuid, {
        brew_recipe_id: brewLinkId ? Number(brewLinkId) : null,
      });
      toast.success('Brew recipe link updated');
      loadRecipes();
    } catch (err) {
      toast.error('Failed to update brew recipe link: ' + err.message);
    } finally {
      setSavingBrewLink(false);
    }
  };

  const handleRefresh = () => {
    loadRecipes();
  };

  return (
    <div className="recipe-builder-page" style={{ padding: 0, marginTop: 0 }}>
      <div className="recipe-builder-layout full-scroll-layout" style={{ marginTop: 0, height: 'auto' }}>
        <aside className="rb-left-pane">
          <div className="rb-search-wrapper">
            <Search size={16} className="rb-search-icon" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rb-search-input"
            />
          </div>
          <div className="rb-recipes-list">
            {loading && recipes.length === 0 ? (
              <div className="rb-loading"><Loader2 size={20} className="spinner" /> Loading...</div>
            ) : filteredRecipes.length === 0 ? (
              <div className="rb-empty">No recipes found</div>
            ) : (
              filteredRecipes.map(r => (
                <button
                  key={r.id || r.uuid}
                  className={`rb-recipe-item ${(selectedRecipe?.id === r.id || selectedRecipe?.uuid === r.uuid) ? 'active' : ''}`}
                  onClick={() => handleSelect(r)}
                >
                  <div className="rb-item-name">{r.name}</div>
                  <div className="rb-item-code">{r.recipe_code || '—'}</div>
                  <div className="rb-item-cost">₹{parseFloat(r.total_cost || 0).toFixed(2)}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="rb-main-pane">
          {!selectedRecipe ? (
            <div className="rb-placeholder">
              <p>Select a recipe from the list to view details</p>
            </div>
          ) : (
            <>
              <div className="rb-detail-header" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Menu Recipe Details</span>
                  <h3 style={{ marginTop: '2px', fontSize: '20px' }}>{selectedRecipe.name}</h3>
                </div>
                <div className="rb-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="rb-tabs">
                    <button className={`rb-tab ${activeTab === 'ingredients' ? 'active' : ''}`} onClick={() => setActiveTab('ingredients')}>Ingredients</button>
                    <button className={`rb-tab ${activeTab === 'costing' ? 'active' : ''}`} onClick={() => setActiveTab('costing')}>Costing Summary</button>
                  </div>
                </div>
              </div>

              {/* Visual Connectivity Pipeline */}
              <div className="rb-connectivity-pipeline">
                <div className="pipeline-node">
                  <div className="pipeline-node-title">1. Raw Materials</div>
                  <div className="pipeline-node-value">Supplies Inventory</div>
                  <div className="pipeline-node-meta">
                    {selectedRecipe.ingredients?.length || 0} ingredients mapped
                  </div>
                </div>

                <div className="pipeline-connector">➔</div>

                <div className="pipeline-node active">
                  <div className="pipeline-node-title">2. Brew Formulation</div>
                  <div className="pipeline-node-value">
                    {linkedBrewRecipe ? linkedBrewRecipe.name : 'No Brew Link'}
                  </div>
                  <div className="rb-brew-link-container" style={{ marginTop: 8 }}>
                    <select 
                      value={brewLinkId} 
                      onChange={e => setBrewLinkId(e.target.value)} 
                      className="rb-input-sm" 
                      style={{ width: '100%', marginBottom: 4, height: 28, fontSize: '11px', padding: '2px 6px' }}
                    >
                      <option value="">-- No Brew Link --</option>
                      {brewRecipes.map(b => <option key={b._pk || b.id} value={b._pk || b.id}>{b.name}</option>)}
                    </select>
                    <button 
                      className="rb-btn-sm primary" 
                      onClick={handleSaveBrewLink} 
                      disabled={savingBrewLink} 
                      style={{ width: '100%', justifyContent: 'center', height: 24, fontSize: 10, padding: '2px 4px', whiteSpace: 'nowrap' }}
                    >
                      {savingBrewLink ? 'Linking...' : 'Link Brew'}
                    </button>
                  </div>
                </div>

                <div className="pipeline-connector">➔</div>

                <div className="pipeline-node active">
                  <div className="pipeline-node-title">3. Menu Recipe</div>
                  <div className="pipeline-node-value" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedRecipe.name}</div>
                  <div className="pipeline-node-meta">
                    Code: {selectedRecipe.recipe_code || '—'}
                  </div>
                  <div className="pipeline-node-cost" style={{ marginTop: 4, fontWeight: 700, fontSize: 12 }}>
                    Cost: ₹{parseFloat(selectedRecipe.total_cost || 0).toFixed(2)}
                  </div>
                </div>

                <div className="pipeline-connector">➔</div>

                <div className={`pipeline-node ${linkedProduct ? 'active' : 'warning'}`}>
                  <div className="pipeline-node-title">4. Product Catalog</div>
                  <div className="pipeline-node-value">
                    {linkedProduct ? linkedProduct.name : 'Unmapped Product'}
                  </div>
                  {linkedProduct ? (
                    <div style={{ marginTop: 4 }}>
                      <div className="pipeline-node-meta">Price: ₹{parseFloat(linkedProduct.base_price || linkedProduct.basePrice || 0).toFixed(2)}</div>
                      <div className="pipeline-node-profit" style={{ fontWeight: 600, color: '#16A34A', fontSize: 11 }}>
                        Profit: ₹{profit} ({margin}%)
                      </div>
                    </div>
                  ) : (
                    <div className="pipeline-node-meta" style={{ color: '#DC2626', fontWeight: 500, marginTop: 4 }}>
                      ⚠️ Not sold on Kiosk/D2C
                    </div>
                  )}
                </div>
              </div>

              <div className="rb-detail-body">
                {activeTab === 'ingredients' ? (
                  <RecipeDetail
                    recipe={selectedRecipe}
                    onRefresh={handleRefresh}
                  />
                ) : (
                  <CostingSummary
                    recipeId={selectedRecipe.id || selectedRecipe.uuid}
                    recipe={selectedRecipe}
                    linkedProduct={linkedProduct}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MenuTab;
