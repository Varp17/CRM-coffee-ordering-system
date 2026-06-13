import React, { useState } from 'react';
import BrewTab from './components/BrewTab';
import MenuTab from './components/MenuTab';
import EngineTab from './components/EngineTab';
import CustomerTab from './components/CustomerTab';
import Button from '../../../components/Button/Button';
import { RefreshCw } from 'lucide-react';
import '../BrewRecipes/BrewRecipes.css';
import '../RecipeBuilder/RecipeBuilder.css';
import '../RecipeEngine/RecipeEngine.css';
import './Recipes.css';

const TABS = [
  { key: 'brew', label: 'Brew Recipes', icon: '☕' },
  { key: 'menu', label: 'Menu Recipes', icon: '📋' },
  { key: 'customer', label: 'Customer Recipes', icon: '⭐' },
  { key: 'engine', label: 'Recipe Engine', icon: '⚙️' },
];

const Recipes = () => {
  const [activeTab, setActiveTab] = useState('brew');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="recipes-unified-page animate-fade-in">
      <div className="page-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Recipes</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0' }}>Manage brew formulations, menu recipes, and view recipe-engine analysis.</p>
        </div>
        <div className="page-header-actions">
          <Button onClick={handleRefresh} variant="ghost" disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="recipes-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`recipes-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setIsLoading(false);
            }}
          >
            <span className="recipes-tab-icon">{tab.icon}</span>
            <span className="recipes-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="recipes-tab-content">
        {activeTab === 'brew' && <BrewTab refreshKey={refreshKey} setLoading={setIsLoading} />}
        {activeTab === 'menu' && <MenuTab refreshKey={refreshKey} setLoading={setIsLoading} />}
        {activeTab === 'customer' && <CustomerTab refreshKey={refreshKey} setLoading={setIsLoading} />}
        {activeTab === 'engine' && <EngineTab refreshKey={refreshKey} setLoading={setIsLoading} />}
      </div>
    </div>
  );
};

export default Recipes;
