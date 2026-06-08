import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, HelpCircle, Loader2 } from 'lucide-react';
import RecipeCard from './components/RecipeCard';
import RecipeBuilder from './components/RecipeBuilder';
import RecipeDetailDrawer from './components/RecipeDetailDrawer';
import { brewRecipeService } from '../../../services/brewRecipes';
import { unwrapList } from '../../../utils/apiResponse';
import { useConfirmation } from '../../../hooks/useConfirmation';
import toast from 'react-hot-toast';
import './BrewRecipes.css';

const BrewRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  
  // Modal & Drawer State
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const confirm = useConfirmation();

  const loadRecipes = () => {
    setLoading(true);
    brewRecipeService.getAll()
      .then(res => {
        setRecipes(unwrapList(res));
      })
      .catch(err => {
        toast.error('Failed to load brew recipes: ' + err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleCardClick = (id) => {
    setSelectedRecipeId(id);
  };

  const handleEdit = (id) => {
    setSelectedRecipeId(null);
    setEditingRecipeId(id);
    setShowBuilder(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Brew Recipe',
      message: 'Are you sure you want to delete this brew recipe? This action is permanent.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (isConfirmed) {
      try {
        await brewRecipeService.delete(id);
        toast.success('Brew recipe deleted successfully.');
        setSelectedRecipeId(null);
        loadRecipes();
      } catch (err) {
        toast.error('Failed to delete recipe: ' + err.message);
      }
    }
  };

  const filteredRecipes = useMemo(() => {
    return (recipes || []).filter(recipe => {
      const matchesSearch = searchQuery === '' ||
        recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesActive = filterActive === 'all' ||
        (filterActive === 'active' && recipe.is_active) ||
        (filterActive === 'inactive' && !recipe.is_active);

      return matchesSearch && matchesActive;
    });
  }, [recipes, searchQuery, filterActive]);

  return (
    <div className="brew-recipes-page animate-fade-in">
      <div className="page-header-container">
        <div>
          <h2 className="page-title">Brew Recipes</h2>
          <p className="page-subtitle">Formulate, calculate costing, and manage specifications for core coffee concentrates.</p>
        </div>
        <button 
          className="action-btn primary flex-center-gap"
          onClick={() => {
            setEditingRecipeId(null);
            setShowBuilder(true);
          }}
        >
          <Plus size={16} /> New Recipe
        </button>
      </div>

      <div className="toolbar-container">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search recipes by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="toolbar-search-input"
          />
        </div>
        <div className="filter-wrapper">
          <select 
            value={filterActive} 
            onChange={(e) => setFilterActive(e.target.value)}
            className="toolbar-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading && recipes.length === 0 ? (
        <div className="flex-center" style={{ height: '50vh' }}>
          <Loader2 className="spinner animate-spin" size={32} />
          <span style={{ marginLeft: '12px', color: 'var(--color-text-secondary)' }}>Loading recipes...</span>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="recipes-grid">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleCardClick(recipe.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-card flex-center">
          <HelpCircle size={48} className="empty-state-icon" />
          <h3>No Brew Recipes Found</h3>
          <p>Get started by creating your first visual coffee recipe formulary.</p>
          <button 
            className="action-btn primary flex-center-gap"
            style={{ marginTop: '16px' }}
            onClick={() => {
              setEditingRecipeId(null);
              setShowBuilder(true);
            }}
          >
            <Plus size={16} /> Create Recipe
          </button>
        </div>
      )}

      {/* Visual Recipe Builder Modal */}
      {showBuilder && (
        <RecipeBuilder
          recipeId={editingRecipeId}
          onClose={() => setShowBuilder(false)}
          onSave={() => {
            setShowBuilder(false);
            loadRecipes();
          }}
        />
      )}

      {/* Side Detail Drawer */}
      {selectedRecipeId && (
        <RecipeDetailDrawer
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default BrewRecipes;
