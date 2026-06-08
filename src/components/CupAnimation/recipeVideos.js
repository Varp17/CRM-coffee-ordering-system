export const SIGNATURE_RECIPES = [
  {
    id: 'golden_jaggery_velvet',
    name: 'Golden Jaggery Velvet',
    match: { base: '50-50', milk: 'dairy', sweetener: 'jaggery' },
    toppings: ['golden_cream'],
    video: null,
    thumbnail: null,
  },
  {
    id: 'salted_caramel_jaggery',
    name: 'Salted Caramel Jaggery',
    match: { base: '70-30', milk: 'dairy', sweetener: 'jaggery' },
    toppings: ['salted_caramel'],
    video: '/images/products/Salted_Caramel_Jaggery_Bran.mp4',
    thumbnail: null,
  },
  {
    id: 'honey_spiced_latte',
    name: 'Honey Spiced Latte',
    match: { base: '70-30', milk: 'almond', sweetener: 'honey' },
    toppings: ['honey_drizzle', 'almond_flakes'],
    video: '/images/products/Honey_Spiced_Latte_Brand_St.mp4',
    thumbnail: null,
  },
  {
    id: 'ice_mocha',
    name: 'Ice Mocha',
    match: { base: '50-50', milk: 'dairy', sweetener: 'jaggery' },
    toppings: ['cacao'],
    video: '/images/products/Ice_Mocha_Brand_Story_Choco.mp4',
    thumbnail: null,
  },
  {
    id: 'hazelnut_cream',
    name: 'Hazelnut Cream',
    match: { base: '70-30', milk: 'dairy', sweetener: 'sugar_syrup' },
    toppings: ['hazelnut'],
    video: '/images/products/Hazelnut_Cream_Kiosk_Video.mp4',
    thumbnail: null,
  },
  {
    id: 'smoky_jaggery_latte',
    name: 'Smoky Jaggery Latte',
    match: { base: '70-30', milk: 'dairy', sweetener: 'jaggery' },
    toppings: ['cinnamon', 'cacao'],
    video: '/images/products/Smoky_Jaggery_Latte_Kiosk.mp4',
    thumbnail: null,
  },
  {
    id: 'cold_brew_mint_tonic',
    name: 'Cold Brew Mint Tonic',
    match: { base: '50-50', sweetener: 'none' },
    toppings: ['ice'],
    video: '/images/products/5 product video/Cold Brew Mint Tonic.mp4',
    thumbnail: '/images/products/Cold Brew Mint Tonic.png',
  },
  {
    id: 'cold_brew_orange',
    name: 'Cold Brew Orange',
    match: { base: '50-50', sweetener: 'honey' },
    toppings: ['orange'],
    video: '/images/products/5 product video/Cold Brew Orange .mp4',
    thumbnail: '/images/products/Cold Brew Orange .png',
  },
  {
    id: 'ice_latte',
    name: 'Ice Latte',
    match: { base: 'arabica', milk: 'dairy' },
    toppings: [],
    video: '/images/products/5 product video/Ice Latte.mp4',
    thumbnail: '/images/products/Ice Latte.png',
  },
  {
    id: 'sif_on_the_rocks',
    name: 'SIF on the Rocks',
    match: { base: 'chicory', milk: 'condensed' },
    toppings: [],
    video: '/images/products/5 product video/SIFon the Rocks (South indian filter Coffee).mp4',
    thumbnail: '/images/products/SIFon the Rocks (South indian filter Coffee).png',
  },
  {
    id: 'cold_brew_tonic',
    name: 'Cold Brew Tonic',
    match: { base: 'arabica', sweetener: 'none' },
    toppings: ['ice'],
    video: '/images/products/5 product video/Cold Brew Tonic.mp4',
    thumbnail: '/images/products/Cold Brew Tonic.png',
  },
];

export function findMatchingRecipe(selections) {
  if (!selections?.base?.id) return null;

  const base = selections.base.id;
  const milk = selections.milk?.id || null;
  const sweetener = selections.sweetener?.id || null;
  const selectedToppingIds = (selections.toppings || []).map(t => t.id);

  for (const recipe of SIGNATURE_RECIPES) {
    if (recipe.match.base !== base) continue;
    if (recipe.match.milk && recipe.match.milk !== milk) continue;
    if (recipe.match.sweetener && recipe.match.sweetener !== sweetener) continue;

    const requiredToppings = recipe.match.toppings || recipe.toppings || [];
    const hasRequired = requiredToppings.length === 0 ||
      requiredToppings.every(t => selectedToppingIds.includes(t));

    if (hasRequired) return recipe;
  }

  return null;
}
