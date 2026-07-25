import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Heart,
  XCircle,
  Eye,
  EyeOff,
  Coffee,
  Check,
  Trash2,
  Send,
  RotateCcw,
} from 'lucide-react';
import './Recipes.css';
import toast from 'react-hot-toast';
import { recipeService } from '../../../services/recipes';
import { unwrapList } from '../../../utils/apiResponse';
import { useConfirmation } from '../../../hooks/useConfirmation';
import {
  getLocalPendingRecipes,
  getLocalApprovedRecipes,
  getLocalRejectedRecipes,
  approveRecipeLocally,
  rejectRecipeLocally,
} from '../../../utils/localRecipeSync';

const ORDERING_WEBSITE_ORIGIN =
  import.meta.env.VITE_ORDERING_WEBSITE_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5176'
    : 'https://coffee-ordering-kiosk.vercel.app');

const resolveWebsiteMedia = (source) => {
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) return source;
  return `${ORDERING_WEBSITE_ORIGIN}${source.startsWith('/') ? source : `/${source}`}`;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending' | 'hidden' | 'rejected'
  const [selectedConcentrate, setSelectedConcentrate] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Interactivity (Likes & Comments)
  const [likedRecipes, setLikedRecipes] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [recipeComments, setRecipeComments] = useState([]);

  const confirmAction = useConfirmation();

  // Load recipes from backend & local sync
  const loadFromBackend = async () => {
    try {
      setIsLoading(true);
      let backendFormatted = [];
      try {
        const res = await recipeService.getCommunityRecipes();
        const list = unwrapList(res);
        if (Array.isArray(list) && list.length > 0) {
          backendFormatted = list.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            author: item.author || 'CHILLD Lab',
            concentrate: item.concentrate || 'Classic',
            status: item.status || (item.is_published ? 'approved' : 'pending'),
            mood: item.mood || '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            likesCount: typeof item.likesCount === 'number' ? item.likesCount : (item.likes_count || 0),
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            steps: Array.isArray(item.steps) ? item.steps.map((s, idx) => {
              if (typeof s === 'string') return { title: `Step ${idx + 1}`, copy: s };
              return { title: s.title || `Step ${idx + 1}`, copy: s.copy || s.title || '' };
            }) : [],
            image: resolveWebsiteMedia(item.image),
          }));
        }
      } catch {
        // API fallback
      }

      const localPending = getLocalPendingRecipes();
      const localApproved = getLocalApprovedRecipes();
      const localRejected = getLocalRejectedRecipes();

      const mergedMap = new Map();
      [...localPending, ...localApproved, ...localRejected, ...backendFormatted].forEach(r => {
        if (r && r.id) {
          mergedMap.set(r.id, r);
        }
      });

      setRecipes(Array.from(mergedMap.values()));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    loadFromBackend();
    window.addEventListener('recipes:updated', loadFromBackend);
    window.addEventListener('storage', loadFromBackend);

    let bc = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('chilld_recipe_channel');
      bc.onmessage = () => loadFromBackend();
    }

    return () => {
      window.removeEventListener('recipes:updated', loadFromBackend);
      window.removeEventListener('storage', loadFromBackend);
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedRecipe) return;
    let isMounted = true;
    recipeService.getComments(selectedRecipe.id)
      .then((res) => {
        if (!isMounted) return;
        const comments = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRecipeComments(comments.map((c) => ({
          name: c.author || c.customer_name || 'CRM Operator',
          time: new Date(c.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          copy: c.body || c.content || c.text || '',
        })));
      })
      .catch(() => {
        if (isMounted) setRecipeComments([]);
      });
    return () => { isMounted = false; };
  }, [selectedRecipe]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      let matchesTab = recipe.status === activeTab;
      if (activeTab === 'rejected') {
        matchesTab = recipe.status === 'rejected' || recipe.status === 'deleted';
      }

      const matchesConcentrate =
        selectedConcentrate === 'All' ||
        recipe.concentrate === selectedConcentrate ||
        (recipe.concentrate || '').toLowerCase().includes(selectedConcentrate.toLowerCase());
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        recipe.name.toLowerCase().includes(q) ||
        recipe.author.toLowerCase().includes(q) ||
        recipe.description.toLowerCase().includes(q);

      return matchesTab && matchesConcentrate && matchesSearch;
    });
  }, [recipes, activeTab, selectedConcentrate, searchQuery]);

  // Tab counts
  const approvedCount = recipes.filter((r) => r.status === 'approved').length;
  const pendingCount = recipes.filter((r) => r.status === 'pending').length;
  const hiddenCount = recipes.filter((r) => r.status === 'hidden').length;
  const rejectedCount = recipes.filter((r) => r.status === 'rejected' || r.status === 'deleted').length;

  // ── Action Handlers ──
  const handleApprove = async (id) => {
    approveRecipeLocally(id);
    try {
      await recipeService.updateReviewStatus(id, 'approved');
    } catch {
      // local fallback handled
    }
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved', is_published: true } : r))
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe((prev) => (prev ? { ...prev, status: 'approved', is_published: true } : null));
    }
    toast.success('Recipe approved and published to website catalog! ✨');
  };

  const handleHide = async (id) => {
    try {
      await recipeService.updateReviewStatus(id, 'hidden');
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'hidden' } : r))
      );
      if (selectedRecipe?.id === id) {
        setSelectedRecipe((prev) => (prev ? { ...prev, status: 'hidden' } : null));
      }
      toast.success('Recipe moved to Hidden Recipes');
    } catch (error) {
      toast.error(error.message || 'Unable to hide recipe');
    }
  };

  const handleReject = async (id) => {
    rejectRecipeLocally(id);
    try {
      await recipeService.updateReviewStatus(id, 'rejected');
    } catch {
      // Local fallback handled
    }
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe(null);
    }
    toast.success('Recipe moved to Recently Deleted / Rejected');
  };

  const handleRestore = async (id) => {
    try {
      await recipeService.updateReviewStatus(id, 'approved');
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
      );
      if (selectedRecipe?.id === id) {
        setSelectedRecipe((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
      toast.success('Recipe restored to Approved Recipes');
    } catch (error) {
      toast.error(error.message || 'Unable to restore recipe');
    }
  };

  const handlePermanentDelete = async (id) => {
    const recipe = recipes.find((r) => r.id === id);
    const isConfirmed = await confirmAction({
      title: 'Permanently Delete Recipe',
      description: `This will PERMANENTLY delete "${recipe?.name || 'this recipe'}" from the system. This action cannot be undone.`,
      type: 'level2',
      payload: { requireText: true },
      isDestructive: true,
    });
    if (!isConfirmed) return;

    try {
      await recipeService.permanentDelete(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
      }
      toast.success('Recipe permanently deleted');
    } catch (error) {
      toast.error(error.message || 'Unable to permanently delete recipe');
    }
  };

  const toggleLike = async (recipeId) => {
    try {
      await recipeService.toggleLike(recipeId);
      setLikedRecipes((prev) => ({
        ...prev,
        [recipeId]: !prev[recipeId],
      }));
    } catch {
      toast.error('Unable to toggle like');
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedRecipe) return;
    try {
      await recipeService.addComment(selectedRecipe.id, commentInput.trim());
      const res = await recipeService.getComments(selectedRecipe.id);
      const comments = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRecipeComments(comments.map((c) => ({
        name: c.author || c.customer_name || 'CRM Operator',
        time: new Date(c.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        copy: c.body || c.content || c.text || '',
      })));
      setCommentInput('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error(err.message || 'Unable to add comment');
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
            {selectedRecipe.status === 'pending' && (
              <>
                <span className="pending-badge">Pending Approval</span>
                <button className="btn-approve-kiosk" onClick={() => handleApprove(selectedRecipe.id)}>
                  <Check size={16} /> Approve
                </button>
                <button className="btn-reject-kiosk" onClick={() => handleReject(selectedRecipe.id)}>
                  <XCircle size={16} /> Reject
                </button>
              </>
            )}
            {selectedRecipe.status === 'approved' && (
              <>
                <span className="approved-badge">Approved Formulation</span>
                <button className="btn-hide-kiosk" onClick={() => handleHide(selectedRecipe.id)}>
                  <EyeOff size={16} /> Hide Recipe
                </button>
                <button className="btn-reject-kiosk" onClick={() => handleReject(selectedRecipe.id)}>
                  <Trash2 size={16} /> Move to Trash
                </button>
              </>
            )}
            {selectedRecipe.status === 'hidden' && (
              <>
                <span className="hidden-badge">Hidden Recipe</span>
                <button className="btn-approve-kiosk" onClick={() => handleApprove(selectedRecipe.id)}>
                  <Check size={16} /> Unhide / Approve
                </button>
                <button className="btn-reject-kiosk" onClick={() => handleReject(selectedRecipe.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
            {(selectedRecipe.status === 'rejected' || selectedRecipe.status === 'deleted') && (
              <>
                <span className="rejected-badge">Recently Deleted</span>
                <button className="btn-approve-kiosk" onClick={() => handleRestore(selectedRecipe.id)}>
                  <RotateCcw size={16} /> Restore
                </button>
                <button className="btn-reject-kiosk" onClick={() => handlePermanentDelete(selectedRecipe.id)}>
                  <Trash2 size={16} /> Delete Permanently
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
            Manage approved formulations, community recipe submissions, hidden items, and rejected entries.
          </p>
        </div>
      </div>

      {/* ── 4 Main Category Tabs ── */}
      <div className="recipe-main-tabs">
        {/* Tab 1: Approved Recipes */}
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle2 size={16} />
          <span>Approved Recipes</span>
          <span className="count-pill">{approvedCount}</span>
        </button>

        {/* Tab 2: Pending for Approval */}
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          <span>Pending for Approval</span>
          {pendingCount > 0 && <span className="count-pill warning">{pendingCount}</span>}
        </button>

        {/* Tab 3: Hidden Recipes */}
        <button
          className={`tab-btn ${activeTab === 'hidden' ? 'active' : ''}`}
          onClick={() => setActiveTab('hidden')}
        >
          <EyeOff size={16} />
          <span>Hidden Recipes</span>
          <span className="count-pill muted">{hiddenCount}</span>
        </button>

        {/* Tab 4: Recently Deleted / Rejected */}
        <button
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <Trash2 size={16} />
          <span>Recently Deleted / Rejected</span>
          <span className="count-pill danger">{rejectedCount}</span>
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
      {isLoading ? (
        <div className="empty-state-card">
          <Coffee size={36} className="empty-icon" />
          <h3>Loading Recipes</h3>
          <p>Fetching recipe data from the backend.</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="empty-state-card">
          <Coffee size={36} className="empty-icon" />
          <h3>No Recipes Found</h3>
          <p>No recipes match the selected tab or filter criteria.</p>
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
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `${ORDERING_WEBSITE_ORIGIN}/images/georgesso-hero.png`;
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

                  {/* ── CARD ACTIONS FOR EACH OF THE 4 TABS ── */}
                  <div className="recipe-card-actions" onClick={(e) => e.stopPropagation()}>
                    {/* TAB 1: APPROVED RECIPES (3 Buttons: View Details, Hide, Delete) */}
                    {activeTab === 'approved' && (
                      <>
                        <button
                          className="action-btn view-btn"
                          onClick={() => setSelectedRecipe(recipe)}
                          title="View Details"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          className="action-btn hide-btn"
                          onClick={() => handleHide(recipe.id)}
                          title="Hide Recipe from Website"
                        >
                          <EyeOff size={14} /> Hide
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleReject(recipe.id)}
                          title="Delete Recipe"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </>
                    )}

                    {/* TAB 2: PENDING FOR APPROVAL (3 Buttons: View Details, Approve, Reject) */}
                    {activeTab === 'pending' && (
                      <>
                        <button
                          className="action-btn view-btn"
                          onClick={() => setSelectedRecipe(recipe)}
                          title="View Details"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <button
                          className="action-btn approve-btn"
                          onClick={() => handleApprove(recipe.id)}
                          title="Approve Recipe"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleReject(recipe.id)}
                          title="Reject Recipe"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}

                    {/* TAB 3: HIDDEN RECIPES (2 Buttons: Unhide, Delete) */}
                    {activeTab === 'hidden' && (
                      <>
                        <button
                          className="action-btn approve-btn"
                          onClick={() => handleApprove(recipe.id)}
                          title="Unhide Recipe to Approved"
                        >
                          <Check size={14} /> Unhide
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleReject(recipe.id)}
                          title="Delete Recipe"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </>
                    )}

                    {/* TAB 4: DELETED / REJECTED RECIPES (2 Buttons: Restore, Permanently Delete) */}
                    {(activeTab === 'rejected' || activeTab === 'deleted') && (
                      <>
                        <button
                          className="action-btn restore-btn"
                          onClick={() => handleRestore(recipe.id)}
                          title="Restore Recipe to Approved"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button
                          className="action-btn danger-btn"
                          onClick={() => handlePermanentDelete(recipe.id)}
                          title="Permanently Delete Recipe"
                        >
                          <Trash2 size={14} /> Permanently Delete
                        </button>
                      </>
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
