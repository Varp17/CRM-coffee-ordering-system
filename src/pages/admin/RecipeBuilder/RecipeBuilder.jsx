import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { menuRecipeService } from '../../../services/menuRecipes';
import { productService } from '../../../services/products';
import { unwrapList } from '../../../utils/apiResponse';
import RecipeDetail from './RecipeDetail';
import CostingSummary from './CostingSummary';
import toast from 'react-hot-toast';
import './RecipeBuilder.css';

const RecipeBuilder = () => {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [activeTab, setActiveTab] = useState('ingredients');

  const loadRecipes = () => {
    setLoading(true);
    menuRecipeService.list()
      .then(res => {
        setRecipes(unwrapList(res));
      })
      .catch(err => toast.error('Failed to load recipes: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecipes();
    productService.getAll({ limit: 200 })
      .then(res => setProducts(unwrapList(res)))
      .catch(() => {});
  }, []);

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

  const handleSelect = (recipe) => {
    setSelectedRecipeId(recipe.id || recipe.uuid);
    setActiveTab('ingredients');
  };

  const handleRefresh = () => {
    loadRecipes();
  };

  return (
    <div className="recipe-builder-page animate-fade-in">
      <div className="page-header-container">
        <div>
          <h2 className="page-title">Recipe Builder</h2>
          <p className="page-subtitle">Create and manage drink recipes. Set ingredients, quantities, and view live costing.</p>
        </div>
      </div>

      <div className="recipe-builder-layout">
        {/* Left Pane: Recipe List */}
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

        {/* Center / Right Pane: Detail + Costing */}
        <main className="rb-main-pane">
          {!selectedRecipe ? (
            <div className="rb-placeholder">
              <p>Select a recipe from the list to view details</p>
            </div>
          ) : (
            <>
              <div className="rb-detail-header">
                <div>
                  <h3>{selectedRecipe.name}</h3>
                  <span className="rb-recipe-code">{selectedRecipe.recipe_code}</span>
                  {linkedProduct && <span className="rb-linked-product">→ {linkedProduct.name}</span>}
                </div>
                <div className="rb-tabs">
                  <button
                    className={`rb-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ingredients')}
                  >Ingredients</button>
                  <button
                    className={`rb-tab ${activeTab === 'costing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('costing')}
                  >Costing</button>
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

export default RecipeBuilder;
