import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ThumbsUp,
  XCircle,
  Eye,
  Coffee,
  Check,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import './Recipes.css';

import { RECIPES as KIOSK_WEBSITE_RECIPES } from '../../../data/kioskRecipes';

// Format all recipes from the Kiosk website catalog
const FORMATTED_WEBSITE_RECIPES = KIOSK_WEBSITE_RECIPES.map((item) => {
  let stepsList = [];
  if (Array.isArray(item.steps)) {
    stepsList = item.steps.map(s => typeof s === 'string' ? s : `${s.title}: ${s.copy}`);
  }
  
  // Pick curated Unsplash imagery for high quality UI display
  let bgImg = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80';
  if (item.name.toLowerCase().includes('orange')) {
    bgImg = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80';
  } else if (item.name.toLowerCase().includes('cranberry')) {
    bgImg = 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80';
  } else if (item.name.toLowerCase().includes('vietnamese') || item.name.toLowerCase().includes('mocha')) {
    bgImg = 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80';
  } else if (item.name.toLowerCase().includes('chicory') || item.name.toLowerCase().includes('kaapi') || item.concentrate === 'Kappi') {
    bgImg = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    author: item.author || 'CHILLD Lab',
    concentrate: item.concentrate || 'Classic',
    status: 'approved',
    likes: typeof item.likes === 'number' ? item.likes : (parseInt(String(item.likes || '120')) || 120),
    createdAt: '2026-07-20T10:30:00Z',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    steps: stepsList,
    image: bgImg,
  };
});

const PENDING_RECIPES = [
  {
    id: 'rec-201',
    name: 'Spiced Cardamom Cloud',
    description: 'Shared via Kiosk custom builder: Cardamom infused cold brew with almond foam.',
    author: 'Rohan Mehta (Kiosk T1 Guest)',
    concentrate: 'Kappi',
    status: 'pending',
    likes: 0,
    createdAt: '2026-07-23T11:45:00Z',
    ingredients: ['90 ml Kappi Concentrate', '100 ml Almond Milk', '2 pinch Ground Cardamom', '10 ml Maple Syrup'],
    steps: ['Shake Kappi concentrate with cardamom & maple', 'Pour into glass with ice', 'Top with aerated almond milk'],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-202',
    name: 'Salted Caramel Bold Splash',
    description: 'Shared via Kiosk custom builder: Salted caramel syrup mixed with extra bold cold brew.',
    author: 'Sneha Patel (Kiosk T2 Guest)',
    concentrate: 'Bold',
    status: 'pending',
    likes: 0,
    createdAt: '2026-07-23T08:20:00Z',
    ingredients: ['90 ml Bold Concentrate', '150 ml Sparkling Water', '20 ml Salted Caramel Syrup', 'Ice'],
    steps: ['Stir caramel syrup into Bold concentrate', 'Add ice cubes', 'Top up with sparkling soda water'],
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-203',
    name: 'Hazelnut Cream Classic Float',
    description: 'Shared via Kiosk custom builder: Classic cold brew concentrate with hazelnut drizzle and whipped cream.',
    author: 'Vikram Singh (Kiosk T1 Guest)',
    concentrate: 'Classic',
    status: 'pending',
    likes: 0,
    createdAt: '2026-07-22T17:10:00Z',
    ingredients: ['90 ml Classic Concentrate', '120 ml Chilled Water', '15 ml Hazelnut Syrup', 'Whipped Cream'],
    steps: ['Fill glass with ice and cold water', 'Add Classic concentrate and hazelnut syrup', 'Top with whipped cream'],
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&auto=format&fit=crop&q=80',
  },
];

const ALL_INITIAL_RECIPES = [...FORMATTED_WEBSITE_RECIPES, ...PENDING_RECIPES];

const getMergedRecipes = () => {
  try {
    const userRecipes = JSON.parse(localStorage.getItem('chilld_kiosk_recipes') || '[]');
    if (Array.isArray(userRecipes) && userRecipes.length > 0) {
      return [...userRecipes, ...ALL_INITIAL_RECIPES];
    }
  } catch (_) {}
  return ALL_INITIAL_RECIPES;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState(getMergedRecipes);
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'
  const [selectedConcentrate, setSelectedConcentrate] = useState('All'); // 'All' | 'Classic' | 'Bold' | 'Kappi'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Sync with kiosk website submitted recipes
  React.useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chilld_kiosk_recipes') {
        setRecipes(getMergedRecipes());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filtered recipes list
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Tab matching
      const matchesTab = recipe.status === activeTab;
      // Concentrate matching
      const matchesConcentrate =
        selectedConcentrate === 'All' || recipe.concentrate === selectedConcentrate;
      // Search matching
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.author.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q);

      return matchesTab && matchesConcentrate && matchesSearch;
    });
  }, [recipes, activeTab, selectedConcentrate, searchQuery]);

  // Status counters
  const approvedCount = recipes.filter((r) => r.status === 'approved').length;
  const pendingCount = recipes.filter((r) => r.status === 'pending').length;

  const handleApprove = (id) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  };

  const handleReject = (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  };

  const getConcentrateBadgeClass = (concentrate) => {
    switch (concentrate) {
      case 'Classic':
        return 'badge-classic';
      case 'Bold':
        return 'badge-bold';
      case 'Kappi':
        return 'badge-kappi';
      default:
        return '';
    }
  };

  return (
    <div className="crm-recipes-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Recipes Management</h2>
          <p className="page-subtitle">
            Review customer creations from the Kiosk website and manage approved brand formulations.
          </p>
        </div>
      </div>

      {/* Main Approval State Tabs */}
      <div className="recipe-main-tabs">
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle2 size={16} />
          <span>Approved Recipes</span>
          <span className="count-pill">{approvedCount}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          <span>Pending for Approval</span>
          {pendingCount > 0 && <span className="count-pill warning">{pendingCount}</span>}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="recipe-filter-bar">
        {/* Concentrate Filter Chips */}
        <div className="concentrate-chips">
          <span className="chip-label">Concentrate:</span>
          {['All', 'Classic', 'Bold', 'Kappi'].map((conc) => (
            <button
              key={conc}
              className={`chip-btn ${selectedConcentrate === conc ? 'active' : ''}`}
              onClick={() => setSelectedConcentrate(conc)}
            >
              {conc === 'Classic' && '☕ '}
              {conc === 'Bold' && '⚡ '}
              {conc === 'Kappi' && '🌟 '}
              {conc}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="recipe-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search recipe, ingredient or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Recipe Cards */}
      {filteredRecipes.length === 0 ? (
        <div className="empty-state-card">
          <Coffee size={36} className="empty-icon" />
          <h3>No Recipes Found</h3>
          <p>No recipes match the selected tab and concentrate filters.</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card">
              <div className="recipe-card-media">
                <img src={recipe.image} alt={recipe.name} />
                <span className={`concentrate-badge ${getConcentrateBadgeClass(recipe.concentrate)}`}>
                  {recipe.concentrate}
                </span>
              </div>

              <div className="recipe-card-content">
                <div className="recipe-author-row">
                  <span className="author-name">{recipe.author}</span>
                  <span className="recipe-date">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="recipe-title">{recipe.name}</h3>
                <p className="recipe-desc">{recipe.description}</p>

                <div className="recipe-ingredients-preview">
                  <strong>Ingredients:</strong>
                  <ul>
                    {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="more-ingredients">+{recipe.ingredients.length - 3} more...</li>
                    )}
                  </ul>
                </div>

                {/* Card Actions */}
                <div className="recipe-card-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    <Eye size={14} /> View
                  </button>

                  {recipe.status === 'pending' ? (
                    <>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(recipe.id)}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => handleReject(recipe.id)}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleReject(recipe.id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className={`concentrate-badge ${getConcentrateBadgeClass(selectedRecipe.concentrate)}`}>
                  {selectedRecipe.concentrate} Concentrate
                </span>
                <h3>{selectedRecipe.name}</h3>
                <span className="modal-author">Created by: {selectedRecipe.author}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedRecipe(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <img src={selectedRecipe.image} alt={selectedRecipe.name} className="modal-recipe-img" />
              <p className="modal-recipe-desc">{selectedRecipe.description}</p>

              <div className="recipe-section">
                <h4>Ingredients</h4>
                <ul className="modal-ingredients-list">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>

              <div className="recipe-section">
                <h4>Preparation Steps</h4>
                <ol className="modal-steps-list">
                  {selectedRecipe.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="modal-actions">
              {selectedRecipe.status === 'pending' && (
                <>
                  <button
                    className="btn-primary-blue"
                    onClick={() => handleApprove(selectedRecipe.id)}
                  >
                    <Check size={14} /> Approve for Kiosk Menu
                  </button>
                  <button
                    className="btn-danger-outline"
                    onClick={() => handleReject(selectedRecipe.id)}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setSelectedRecipe(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
