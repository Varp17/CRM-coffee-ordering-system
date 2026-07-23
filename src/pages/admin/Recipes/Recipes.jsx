import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ThumbsUp,
  Heart,
  XCircle,
  Eye,
  Coffee,
  Check,
  Trash2,
  Plus,
  Sparkles,
  Share2,
  Printer,
  MessageSquare,
  Send,
} from 'lucide-react';
import './Recipes.css';

import { RECIPES as KIOSK_WEBSITE_RECIPES } from '../../../data/kioskRecipes';

const getRecipeImage = (item) => {
  if (item.image && !item.image.includes('georgesso-hero')) {
    return item.image;
  }
  const name = (item.name || '').toLowerCase();
  if (name.includes('orange')) return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80';
  if (name.includes('cranberry')) return 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80';
  if (name.includes('vietnamese') || name.includes('mocha')) return 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&auto=format&fit=crop&q=80';
  if (name.includes('kaapi') || item.concentrate === 'Kappi') return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80';
};

// Format all recipes from the customer website catalog
const FORMATTED_WEBSITE_RECIPES = KIOSK_WEBSITE_RECIPES.map((item) => {
  let stepsList = [];
  if (Array.isArray(item.steps)) {
    stepsList = item.steps.map((s, idx) => {
      if (typeof s === 'string') return { title: `Step ${idx + 1}`, copy: s };
      return { title: s.title || `Step ${idx + 1}`, copy: s.copy || s.title || '' };
    });
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    author: item.author || 'CHILLD Lab',
    concentrate: item.concentrate || 'Classic',
    status: 'approved',
    mood: item.mood || 'Smooth, Refreshing & Charged-up',
    tags: Array.isArray(item.tags) ? item.tags : ['#Coffee', '#Chilld'],
    likesCount: typeof item.likes === 'number' ? item.likes : (parseInt(String(item.likes || '120')) || 120),
    createdAt: '2026-07-20T10:30:00Z',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    steps: stepsList,
    image: getRecipeImage(item),
  };
});

const PENDING_RECIPES = [
  {
    id: 'rec-201',
    name: 'Spiced Cardamom Cloud',
    description: 'Shared via custom builder: Cardamom infused cold brew with aerated almond foam.',
    author: 'Rohan Mehta (Indiranagar Store)',
    concentrate: 'Kappi',
    status: 'pending',
    mood: 'Spiced, Creamy & Artisanal',
    tags: ['#Cardamom', '#AlmondMilk', '#KappiSpecial'],
    likesCount: 45,
    createdAt: '2026-07-23T11:45:00Z',
    ingredients: ['90 ml Kappi Concentrate', '100 ml Chilled Almond Milk', '2 pinch Ground Cardamom', '10 ml Organic Maple Syrup', 'Ice Cubes'],
    steps: [
      { title: 'Step 1', copy: 'Shake Kappi concentrate with ground cardamom & organic maple syrup' },
      { title: 'Step 2', copy: 'Fill tall serving glass with crystal clear ice cubes' },
      { title: 'Step 3', copy: 'Pour concentrate mix into glass, top with aerated almond milk froth' },
    ],
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-202',
    name: 'Salted Caramel Bold Splash',
    description: 'Shared via custom builder: Salted caramel syrup mixed with extra bold cold brew.',
    author: 'Sneha Patel (Koramangala Store)',
    concentrate: 'Bold',
    status: 'pending',
    mood: 'Sweet & Salty, Bold Fuel',
    tags: ['#Caramel', '#BoldBrew', '#SparklingCoffee'],
    likesCount: 88,
    createdAt: '2026-07-23T08:20:00Z',
    ingredients: ['90 ml Bold Concentrate', '150 ml Sparkling Soda Water', '20 ml Salted Caramel Syrup', 'Ice Cubes'],
    steps: [
      { title: 'Step 1', copy: 'Stir caramel syrup into Bold concentrate until dissolved' },
      { title: 'Step 2', copy: 'Add ice cubes into tumbler' },
      { title: 'Step 3', copy: 'Slowly pour chilled sparkling soda water to layer' },
    ],
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-203',
    name: 'Hazelnut Cream Classic Float',
    description: 'Shared via custom builder: Classic cold brew concentrate with hazelnut drizzle and whipped cream.',
    author: 'Vikram Singh (Whitefield Store)',
    concentrate: 'Classic',
    status: 'pending',
    mood: 'Rich, Indulgent & Dessert Coffee',
    tags: ['#Hazelnut', '#WhippedCream', '#ClassicFloat'],
    likesCount: 64,
    createdAt: '2026-07-22T17:10:00Z',
    ingredients: ['90 ml Classic Concentrate', '120 ml Chilled Mineral Water', '15 ml Hazelnut Syrup', 'Heavy Whipped Cream'],
    steps: [
      { title: 'Step 1', copy: 'Fill glass with ice and cold water' },
      { title: 'Step 2', copy: 'Add Classic concentrate and hazelnut syrup, stir gently' },
      { title: 'Step 3', copy: 'Top generously with fresh whipped cream & hazelnut drizzle' },
    ],
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
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

const INITIAL_COMMENTS = [
  {
    name: 'Alia Bhatt',
    time: '23 Jul 2026, 10:30 AM',
    copy: 'I love it! Best with the jaggery espresso. Add a tiny pinch of sea salt on top to elevate the flavors.',
  },
  {
    name: 'Ranveer Singh',
    time: '22 Jul 2026, 04:15 PM',
    copy: 'This recipe is dam good! Smooth caffeine hit without any bitterness.',
  },
];

const Recipes = () => {
  const [recipes, setRecipes] = useState(getMergedRecipes);
  const [activeTab, setActiveTab] = useState('approved');
  const [selectedConcentrate, setSelectedConcentrate] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Modal Recipe details interactivity (Likes & Comments)
  const [likedRecipes, setLikedRecipes] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [recipeComments, setRecipeComments] = useState(INITIAL_COMMENTS);

  // Sync with recipes submitted through the customer website
  React.useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'chilld_kiosk_recipes') {
        setRecipes(getMergedRecipes());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesTab = recipe.status === activeTab;
      const matchesConcentrate =
        selectedConcentrate === 'All' || recipe.concentrate === selectedConcentrate;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.author.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q);

      return matchesTab && matchesConcentrate && matchesSearch;
    });
  }, [recipes, activeTab, selectedConcentrate, searchQuery]);

  const approvedCount = recipes.filter((r) => r.status === 'approved').length;
  const pendingCount = recipes.filter((r) => r.status === 'pending').length;

  const handleApprove = (id) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe((prev) => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  const handleReject = (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
  };

  const toggleLike = (recipeId) => {
    setLikedRecipes((prev) => ({
      ...prev,
      [recipeId]: !prev[recipeId],
    }));
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newComm = {
      name: 'CRM Operator',
      time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      copy: commentInput.trim(),
    };
    setRecipeComments((prev) => [newComm, ...prev]);
    setCommentInput('');
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
        return 'badge-classic';
    }
  };

  // ── Render Full Recipe Details Page View if a recipe is selected ──
  if (selectedRecipe) {
    const isLiked = likedRecipes[selectedRecipe.id];
    const likesCount = selectedRecipe.likesCount + (isLiked ? 1 : 0);
    const relatedRecipes = recipes.filter((r) => r.id !== selectedRecipe.id).slice(0, 3);

    return (
      <div className="crm-recipes-page full-recipe-page-view animate-fade-in">
        {/* Navigation & Admin Action Header Bar */}
        <div className="recipe-detail-nav-bar">
          <button className="back-to-catalog-btn" onClick={() => setSelectedRecipe(null)}>
            ← Back to Recipes Catalog
          </button>

          <div className="nav-bar-admin-actions">
            {selectedRecipe.status === 'pending' ? (
              <>
                <span className="pending-badge">Pending Approval</span>
                <button
                  className="btn-approve-kiosk"
                  onClick={() => handleApprove(selectedRecipe.id)}
                >
                  <Check size={16} /> Approve for Store Menu
                </button>
                <button
                  className="btn-reject-kiosk"
                  onClick={() => handleReject(selectedRecipe.id)}
                >
                  <XCircle size={16} /> Reject
                </button>
              </>
            ) : (
              <>
                <span className="approved-badge">Approved Formulation</span>
                <button
                  className="btn-reject-kiosk"
                  onClick={() => handleReject(selectedRecipe.id)}
                >
                  <Trash2 size={16} /> Delete Recipe
                </button>
              </>
            )}
          </div>
        </div>

        {/* HERO SECTION */}
        <section className="kiosk-full-hero">
          <div className="hero-left-col">
            <div className="hero-title-row">
              <span className={`concentrate-badge ${getConcentrateBadgeClass(selectedRecipe.concentrate)}`}>
                {selectedRecipe.concentrate} Base
              </span>
              <span className="brand-author-tag">By: {selectedRecipe.author}</span>
            </div>

            <h1 className="hero-recipe-name">{selectedRecipe.name}</h1>

            {/* Likes counter */}
            <div className="hero-likes-bar">
              <button 
                className={`kiosk-like-btn ${isLiked ? 'is-liked' : ''}`}
                onClick={() => toggleLike(selectedRecipe.id)}
              >
                <Heart 
                  size={17} 
                  fill={isLiked ? '#DC2626' : 'none'} 
                  color={isLiked ? '#DC2626' : '#1F2A44'} 
                />
                <span>{likesCount} Likes</span>
              </button>
            </div>

            <div className="hero-desc-box">
              <p className="desc-eyebrow">DESCRIPTION</p>
              <p className="desc-text">{selectedRecipe.description}</p>
            </div>

            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <div className="hero-tags-wrapper">
                {selectedRecipe.tags.map((t) => (
                  <span key={t} className="hero-tag">{t}</span>
                ))}
              </div>
            )}

            <div className="hero-meta-table">
              <div className="meta-row">
                <span className="meta-label">Author</span>
                <span className="meta-val">{selectedRecipe.author}</span>
              </div>
              {selectedRecipe.mood && (
                <div className="meta-row">
                  <span className="meta-label">Mood Profile</span>
                  <span className="meta-val">{selectedRecipe.mood}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-label">Concentrate Base</span>
                <span className="meta-val" style={{ fontWeight: 700, color: '#007AFF' }}>
                  {selectedRecipe.concentrate}
                </span>
              </div>
            </div>
          </div>

          <div className="hero-right-col">
            <div className="hero-image-card">
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.name} 
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <span className="ai-note">*Illustrative visual presentation</span>
            </div>
          </div>
        </section>

        {/* INGREDIENTS & STEPS SPLIT SECTION */}
        <section className="kiosk-cooking-grid">
          <div className="ingredients-box">
            <h2><Coffee size={18} /> Ingredients</h2>
            <ul className="ingredients-list">
              {selectedRecipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="steps-box">
            <h2>Recipe Preparation Steps</h2>
            <div className="steps-timeline">
              {selectedRecipe.steps.map((step, idx) => (
                <div key={idx} className="step-card">
                  <div className="step-number">{idx + 1}</div>
                  <div className="step-info">
                    <h4>{step.title || `Step ${idx + 1}`}</h4>
                    <p>{step.copy || step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USER COMMENTS SECTION */}
        <section className="kiosk-comments-section">
          <h2>Comments & Feedback</h2>
          
          <div className="comment-input-row">
            <input
              type="text"
              placeholder="Write a comment or internal review note..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button className="post-comment-btn" onClick={handleAddComment} disabled={!commentInput.trim()}>
              <Send size={14} /> Post
            </button>
          </div>

          <div className="comments-stream">
            {recipeComments.map((c, i) => (
              <div key={i} className="comment-card">
                <div className="comment-header">
                  <strong>{c.name}</strong>
                  <span className="comment-time">{c.time}</span>
                </div>
                <p className="comment-body">{c.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MORE GREAT RECIPES CAROUSEL GRID */}
        <section className="more-recipes-section">
          <h2 className="more-recipes-title">More Great Recipes</h2>
          <div className="recipes-grid">
            {relatedRecipes.map((recipe) => (
              <div 
                key={recipe.id} 
                className="recipe-card"
                onClick={() => {
                  setSelectedRecipe(recipe);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="recipe-card-media">
                  <img src={recipe.image} alt={recipe.name} />
                  <span className={`concentrate-badge ${getConcentrateBadgeClass(recipe.concentrate)}`}>
                    {recipe.concentrate}
                  </span>
                </div>
                <div className="recipe-card-content">
                  <span className="author-name">By: {recipe.author}</span>
                  <h3 className="recipe-title">{recipe.name}</h3>
                  <p className="recipe-desc">{recipe.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Render Recipes Catalog Grid if no recipe is selected ──
  return (
    <div className="crm-recipes-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2>Recipes Catalog & Custom Formulations</h2>
          <p className="page-subtitle">
            Catalog of recipes and guest custom formulations. Click any recipe card to view detailed recipe instructions.
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
        <div className="concentrate-chips">
          <span className="chip-label">Concentrate Base:</span>
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

      {/* Customer website-style recipe cards grid */}
      {filteredRecipes.length === 0 ? (
        <div className="empty-state-card">
          <Coffee size={36} className="empty-icon" />
          <h3>No Recipes Found</h3>
          <p>No recipes match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => {
            const isLiked = likedRecipes[recipe.id];
            const likesCount = recipe.likesCount + (isLiked ? 1 : 0);

            return (
              <div 
                key={recipe.id} 
                className="recipe-card"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="recipe-card-media">
                  <img 
                    src={recipe.image} 
                    alt={recipe.name} 
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className={`concentrate-badge ${getConcentrateBadgeClass(recipe.concentrate)}`}>
                    {recipe.concentrate}
                  </span>
                  <div className="card-likes-badge">
                    <Heart size={13} fill="#DC2626" color="#DC2626" />
                    <span>{likesCount} Likes</span>
                  </div>
                </div>

                <div className="recipe-card-content">
                  <div className="recipe-author-row">
                    <span className="author-name">By: {recipe.author}</span>
                    <span className="recipe-date">
                      {new Date(recipe.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="recipe-title">{recipe.name}</h3>
                  <p className="recipe-desc">{recipe.description}</p>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="card-tags-row">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="recipe-tag-pill">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="recipe-ingredients-preview">
                    <strong>Ingredients ({recipe.ingredients.length}):</strong>
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
                  <div className="recipe-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-btn view-btn"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <Eye size={14} /> View Detail
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recipes;
