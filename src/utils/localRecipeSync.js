// Local Storage keys for offline/local recipe sync workflow
const PENDING_KEY = 'chilld_local_pending_recipes';
const APPROVED_KEY = 'chilld_local_approved_recipes';
const REJECTED_KEY = 'chilld_local_rejected_recipes';

export const getLocalPendingRecipes = () => {
  try {
    const data = localStorage.getItem(PENDING_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getLocalApprovedRecipes = () => {
  try {
    const data = localStorage.getItem(APPROVED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getLocalRejectedRecipes = () => {
  try {
    const data = localStorage.getItem(REJECTED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const publishUserMixLocally = (mixData) => {
  const existingPending = getLocalPendingRecipes();
  const baseName = mixData.baseName || mixData.base || 'Classic';
  const concentrateType = baseName.toLowerCase().includes('bold') ? 'Bold'
    : baseName.toLowerCase().includes('kappi') || baseName.toLowerCase().includes('sif') ? 'Kappi'
    : 'Classic';

  const newRecipe = {
    id: `custom-mix-${Date.now()}`,
    name: mixData.name || mixData.title || `${concentrateType} Custom Brew`,
    description: mixData.description || `Custom brew made with ${concentrateType} concentrate, ${mixData.milkName || mixData.milk || 'Milk'}, and custom sweeteners.`,
    author: mixData.author || 'User Mixologist',
    concentrate: concentrateType,
    status: 'pending',
    is_published: false,
    mood: mixData.mood || 'Refreshing',
    tags: mixData.tags || ['Custom Mix', concentrateType],
    likesCount: 1,
    createdAt: new Date().toISOString(),
    ingredients: mixData.ingredients || [
      `${concentrateType} Concentrate`,
      mixData.milkName || mixData.milk || 'Dairy Milk',
      mixData.sweetenerName || mixData.sweetener || 'Sugar Syrup',
      ...(mixData.toppings || [])
    ],
    steps: [
      { title: 'Step 1', copy: `Pour 120ml ${concentrateType} Concentrate over ice.` },
      { title: 'Step 2', copy: `Add ${mixData.milkName || mixData.milk || 'Milk'} and sweetener.` },
      { title: 'Step 3', copy: 'Stir well and enjoy your custom mix!' }
    ],
    image: mixData.image || (concentrateType === 'Bold' ? '/images/products/BoldConcentrate325.png' : concentrateType === 'Kappi' ? '/images/products/KappiConcentrate325.png' : '/images/products/ClassicCBConc325.png'),
  };

  const updated = [newRecipe, ...existingPending];
  localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
  
  // Trigger custom event for real-time reactivity
  window.dispatchEvent(new Event('recipes:updated'));
  return newRecipe;
};

export const approveRecipeLocally = (recipeId) => {
  const pending = getLocalPendingRecipes();
  const target = pending.find(r => r.id === recipeId);
  if (target) {
    const updatedPending = pending.filter(r => r.id !== recipeId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(updatedPending));

    const approved = getLocalApprovedRecipes();
    const approvedItem = { ...target, status: 'approved', is_published: true };
    localStorage.setItem(APPROVED_KEY, JSON.stringify([approvedItem, ...approved]));

    window.dispatchEvent(new Event('recipes:updated'));
    return true;
  }
  return false;
};

export const rejectRecipeLocally = (recipeId) => {
  const pending = getLocalPendingRecipes();
  const approved = getLocalApprovedRecipes();
  
  const target = pending.find(r => r.id === recipeId) || approved.find(r => r.id === recipeId);
  if (target) {
    const updatedPending = pending.filter(r => r.id !== recipeId);
    const updatedApproved = approved.filter(r => r.id !== recipeId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(updatedPending));
    localStorage.setItem(APPROVED_KEY, JSON.stringify(updatedApproved));

    const rejected = getLocalRejectedRecipes();
    const rejectedItem = { ...target, status: 'rejected', is_published: false };
    localStorage.setItem(REJECTED_KEY, JSON.stringify([rejectedItem, ...rejected]));

    window.dispatchEvent(new Event('recipes:updated'));
    return true;
  }
  return false;
};
