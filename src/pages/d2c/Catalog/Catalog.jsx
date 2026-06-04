import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Catalog.css';
import Card from '../../../components/Card/Card';
import Tabs from '../../../components/Tabs/Tabs';
import SearchBar from '../../../components/SearchBar/SearchBar';
import Dropdown from '../../../components/Dropdown/Dropdown';
import { cmsService } from '../../../services/cms';
import { useCartStore } from '../../../store/useCartStore';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';
import CustomizationModal from '../../../components/CustomizationModal/CustomizationModal';
import Skeleton from '../../../components/ui/Skeleton';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  
  // Customization Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const navigate = useNavigate();
  const addItemToCart = useCartStore((state) => state.addItem);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory,
        search: searchQuery
      };
      const res = await cmsService.getD2CProducts(params);
      const prodList = res.data || res || [];
      
      // Sort logic
      const sorted = [...prodList].sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        // Default / Popular
        return (b.review_count || 0) - (a.review_count || 0);
      });

      setProducts(sorted);
      
      // Load categories once at start
      if (categories.length === 0) {
        const uniqueCats = ['All', ...new Set(prodList.map((p) => p.category))];
        const tabList = uniqueCats.map((cat) => {
          const count = cat === 'All' 
            ? prodList.length 
            : prodList.filter((p) => p.category === cat).length;
          return { id: cat, label: cat, count };
        });
        setCategories(tabList);
      }
    } catch (err) {
      console.error('Failed to fetch catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [sortBy, searchQuery, selectedCategory]);

  const handleAddToCartClick = (e, product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleModalAddToCart = (customDrink, variant, quantity) => {
    addItemToCart(customDrink, variant, quantity);
    toast.success(`${customDrink.title} added to cart!`);
  };

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];

  return (
    <div className="catalog-page animate-fade-in">
      <div className="catalog-header-section">
        <h1 className="catalog-title">{t('catalog.titlePrefix', 'Our Specialty ')}<span className="text-gradient">{t('catalog.titleGradient', 'Collection')}</span></h1>
        <p className="catalog-subtitle">{t('catalog.subtitle', 'Sustainably sourced, artisan roasted, and custom crafted to deliver peak flavor.')}</p>
      </div>

      {/* Promotional Custom Drink Banner */}
      <div className="custom-coffee-promo-banner" onClick={() => navigate('/store/custom')}>
        <div className="promo-left">
          <span className="promo-tag">NEW FEATURE</span>
          <h2>🧪 Custom Beverage Laboratory</h2>
          <p>Experiment with double espresso shots, specialty oat/almond milks, vanilla syrups, and silky cold foams. Craft your own signature blend, save it, and share it with friends!</p>
        </div>
        <button className="promo-btn">Start Designing ➔</button>
      </div>

      {/* Control bar (Search, Filter, Sort) */}
      <div className="catalog-controls">
        <div className="search-filter-row">
          <div className="catalog-search-wrapper">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search arabica beans, smooth concentrates, DIY kits..."
            />
          </div>
          <div className="catalog-sort-wrapper">
            <Dropdown 
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              label="Sort By"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {loading && categories.length === 0 ? (
          <div className="catalog-tabs-container" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        ) : categories.length > 0 ? (
          <div className="catalog-tabs-container">
            <Tabs 
              tabs={categories}
              activeTab={selectedCategory}
              onChange={setSelectedCategory}
              variant="segmented"
              size="medium"
            />
          </div>
        ) : null}
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="products-grid">
          {Array(6).fill(0).map((_, idx) => (
            <Card key={idx} isLoading={true} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="products-grid">
          {products.map((product) => (
            <div 
              key={product.uuid || product.id} 
              className="clickable-card-wrapper"
              onClick={() => navigate(`/catalog/${product.slug || product.uuid || product.id}`)}
            >
              <Card 
                id={product.uuid || product.id}
                title={product.title}
                description={product.short_description || product.description}
                price={product.price}
                imageUrl={product.image_url}
                category={product.category}
                rating={product.rating || 4.8}
                reviewCount={product.review_count || 120}
                tags={product.tags}
                inStock={product.in_stock === 1 || product.in_stock === true}
                actionText="Add to Cart"
                onAction={(e) => handleAddToCartClick(e, product)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="catalog-empty-wrapper">
          <span className="empty-emoji">☕</span>
          <h3>{t('catalog.noBeverages', 'No beverages found')}</h3>
          <p>{t('catalog.noMatchesPrefix', 'We couldn\'t find any coffee matching "')}{searchQuery}{t('catalog.noMatchesSuffix', '" under "')}{selectedCategory}{t('catalog.noMatchesEnd', '".')}</p>
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            {t('catalog.clearFilters', 'Clear Filters & Search')}
          </button>
        </div>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedProduct(null); }}
        product={selectedProduct}
        onAddToCart={handleModalAddToCart}
      />
    </div>
  );
};

export default Catalog;
