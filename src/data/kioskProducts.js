// =====================================================
// CHILLD COFFEE - Concentrate Product Catalog
// Source: CHILLD Product Detail Catalog (July 2026)
// =====================================================

// ── Product Card (Menu Page) Images ──
const CLASSIC_IMAGE = '/images/Classic-concentrate.png';
const BOLD_IMAGE = '/bold-concentrate-bottle.png';
const KAPI_IMAGE = '/images/Kappi-concentrate.png';
const BOLD_1L_BACK_IMAGE = '/images/products/Bold1ltr-Back.png';
const CLASSIC_1L_BACK_IMAGE = '/images/products/Classic1ltr-Back.png';
const KAPPI_1L_BACK_IMAGE = '/images/products/Kaapi1ltr-Back.png';
const BOLD_1L_FRONT_IMAGE = '/images/products/Bold1ltr .jpeg';
const CLASSIC_1L_FRONT_IMAGE = '/images/products/Classic1ltr.jpeg';

const size = (id, label, ml, basePrice = 390) => {
  if (id === '325ml') {
    return [
      { id: '325ml', label: '325 ml', ml: 325, modifier: 0 },
      { id: '1000ml', label: '1 Liter', ml: 1000, modifier: 1200 - basePrice }
    ];
  }
  return [
    { id, label, ml, modifier: 0 },
  ];
};

const fourImageGallery = (id, name, mainImage) => {
  const images = [
    mainImage,
    '/images/COFFEBOTTLES.png',
    '/images/coffee-cups/iced-coffee-cup.png',
    '/images/bgremoveconcentratebottels.png'
  ];
  return images.map((src, index) => ({
    id: `${id}-image-${index}`,
    label: index === 0 ? 'Front' : index === 1 ? 'Pack' : index === 2 ? 'Serve' : 'Details',
    src,
    alt: `${name} - View ${index + 1}`
  }));
};

export const CATEGORIES = [
  { id: 'all', label: 'All Products', icon: 'All' },
  { id: 'coffee-50-50', label: 'Bold', icon: 'BD' },
  { id: 'coffee-arabica', label: 'Classic', icon: 'CL' },
  { id: 'sif', label: 'Kaapi', icon: 'KA' },
  { id: 'sampler', label: 'Discovery Kit', icon: 'Kit' },
];

export const PRODUCTS = [
  {
    order: 1,
    id: 'coffee-50-50-concentrate',
    category: 'coffee-50-50',
    concentrateType: 'Bold',
    name: 'Bold Concentrate',
    tagline: 'Balanced Arabica and Robusta for everyday cold coffee.',
    description:
      'Built for that extra punch. This strong concentrate holds its flavor in milk-heavy lattes, jaggery blends, mocha drinks, and dessert-style cold coffee.',
    // ── Image Config ──
    // cardImage → Product Card on Menu Page
    // image     → Detail Page default (325ml)
    // imageLtr  → Detail Page when 1L selected
    // gallery   → Detail Page gallery (front/serve/details/label)
    cardImage: BOLD_IMAGE,
    image: BOLD_IMAGE,
    imageLtr: BOLD_1L_FRONT_IMAGE,
    gallery: [
      { id: 'coffee-50-50-concentrate-image-0', label: 'Front', src: BOLD_IMAGE, alt: 'Bold Concentrate - Bottle' },
      { id: 'coffee-50-50-concentrate-image-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Bold Concentrate - Serve' },
      { id: 'coffee-50-50-concentrate-image-2', label: '325 Back', src: '/images/products/BoldConcentrare-325-backlabel.png', alt: 'Bold Concentrate - 325ml Back Label' },
    ],
    galleryLtr: [
      { id: 'coffee-50-50-concentrate-ltr-0', label: 'Front', src: BOLD_1L_FRONT_IMAGE, alt: 'Bold Concentrate - 1L Front' },
      { id: 'coffee-50-50-concentrate-ltr-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Bold Concentrate - Serve' },
      { id: 'coffee-50-50-concentrate-ltr-2', label: '1L Back', src: BOLD_1L_BACK_IMAGE, alt: 'Bold Concentrate - 1L Back Label' },
    ],
    basePrice: 390,
    defaultSizeId: '325ml',
    sizes: size('325ml', '325 ml', 325, 390),
    availability: 'Available',
    badges: ['bold', 'bestseller'],
    tags: ['bold', 'cold brew', 'balanced', 'milk', 'juices', 'sweet'],
    ingredients: ['Cold brew coffee concentrate', 'Arabica coffee', 'Robusta coffee', 'Filtered water'],
    caffeine: 'High',
    servings: '4-6 serves',
    brewRatio: '1:2 with milk or oatmilk',
    roast: 'Medium dark',
    beanProfile: '50% Arabica, 50% Robusta',
    bestMix: '1:2 with milk or oatmilk',
    reviews: {
      rating: 4.8,
      count: 126,
      summary: 'Loved for its rounded body and easy cold coffee base.',
      quotes: [
        'Makes a cafe-style cold coffee in under a minute.',
        'Balanced taste, not too bitter, great with dairy milk.',
      ],
    },
    orderButtonText: 'Coming Soon',
    isAvailable: true,
  },
  {
    order: 2,
    id: 'classic-cb-concentrate',
    category: 'coffee-arabica',
    concentrateType: 'Classic',
    name: 'Classic CB Concentrate',
    tagline: '100% Arabica from Coorg, specially blended and roasted for a bright and clean flavour',
    description:
      'A classic cold brew profile made for those who want coffee clarity, low bitterness, and a flexible base for cold brew, tonics, and black serves.',
    // ── Image Config ──
    // cardImage → Product Card on Menu Page
    // image     → Detail Page default (325ml)
    // imageLtr  → Detail Page when 1L selected
    // gallery   → Detail Page gallery (front/serve/details/label)
    cardImage: CLASSIC_IMAGE,
    image: CLASSIC_IMAGE,
    imageLtr: CLASSIC_1L_FRONT_IMAGE,
    gallery: [
      { id: 'classic-cb-concentrate-image-0', label: 'Front', src: CLASSIC_IMAGE, alt: 'Classic CB Concentrate - Front' },
      { id: 'classic-cb-concentrate-image-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Classic CB Concentrate - Serve' },
      { id: 'classic-cb-concentrate-image-2', label: '325 Label', src: '/images/products/classicbrew_label.png', alt: 'Classic CB Concentrate - 325ml Label' },
    ],
    galleryLtr: [
      { id: 'classic-cb-concentrate-ltr-0', label: 'Front', src: CLASSIC_1L_FRONT_IMAGE, alt: 'Classic CB Concentrate - 1L Front' },
      { id: 'classic-cb-concentrate-ltr-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Classic CB Concentrate - Serve' },
      { id: 'classic-cb-concentrate-ltr-2', label: '1L Back', src: CLASSIC_1L_BACK_IMAGE, alt: 'Classic CB Concentrate - 1L Back Label' },
    ],
    basePrice: 390,
    defaultSizeId: '325ml',
    sizes: size('325ml', '325 ml', 325, 390),
    availability: 'Available',
    badges: ['smooth', 'black'],
    tags: ['classic cb', 'cold brew', 'smooth', 'black coffee'],
    ingredients: ['Cold brew coffee concentrate', 'Arabica coffee', 'Filtered water'],
    caffeine: 'Medium High',
    servings: '4-6 serves',
    brewRatio: '1:1.5 with water or tonic',
    roast: 'Medium plus',
    beanProfile: 'Arabica washed and natural blend',
    bestMix: '1:1.5 with water or tonic',
    reviews: {
      rating: 4.7,
      count: 94,
      summary: 'A clean concentrate that works well for black cold brew.',
      quotes: [
        'Very smooth over ice, no harsh aftertaste.',
        'Perfect for original cold brew and tonic recipes.',
      ],
    },
    orderButtonText: 'Coming Soon',
    isAvailable: true,
  },
  {
    order: 3,
    id: 'sif-concentrate',
    category: 'sif',
    concentrateType: 'Kaapi',
    name: 'Kaapi Concentrate',
    tagline: 'South Indian filter-inspired depth in a chilled format.',
    description:
      'A nostalgic South Indian filter coffee style concentrate, made for chilled kaapi, condensed milk serves, and rich cafe recipes.',
    image: KAPI_IMAGE,
    gallery: [
      { id: 'sif-concentrate-image-0', label: 'Front', src: KAPI_IMAGE, alt: 'Kaapi Concentrate - Front' },
      { id: 'sif-concentrate-image-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Kaapi Concentrate - Serve' },
      { id: 'sif-concentrate-image-3', label: '325 Back', src: '/images/products/Kapi-325-backlabel.png', alt: 'Kaapi Concentrate - 325ml Back Label' },
    ],
    galleryLtr: [
      { id: 'sif-concentrate-ltr-0', label: 'Front', src: KAPI_IMAGE, alt: 'Kaapi Concentrate - 1L Front' },
      { id: 'sif-concentrate-ltr-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Kaapi Concentrate - Serve' },
      { id: 'sif-concentrate-ltr-2', label: '1L Back', src: KAPPI_1L_BACK_IMAGE, alt: 'Kaapi Concentrate - 1L Back Label' },
    ],
    basePrice: 390,
    defaultSizeId: '325ml',
    sizes: size('325ml', '325 ml', 325, 390),
    availability: 'Available',
    badges: ['traditional', 'rich'],
    tags: ['sif', 'south indian filter', 'cold kaapi', 'milk', 'sweet'],
    ingredients: ['Coffee concentrate', 'Arabica coffee', 'Robusta coffee', 'Chicory', 'Filtered water'],
    caffeine: 'Very High',
    servings: '4-6 serves',
    brewRatio: '1:3 with milk or condensed milk blend',
    roast: 'Medium dark',
    beanProfile: 'Filter coffee style blend',
    bestMix: '1:3 with milk or condensed milk blend',
    reviews: {
      rating: 4.8,
      count: 87,
      summary: 'Popular for kaapi-style cold coffee and richer milk recipes.',
      quotes: [
        'Tastes close to filter coffee but works cold.',
        'Great with condensed milk and ice.',
      ],
    },
    orderButtonText: 'Coming Soon',
    isAvailable: true,
  },
  {
    order: 4,
    id: 'sampler-concentrate',
    category: 'sampler',
    concentrateType: 'Classic, Bold and Kaapi',
    name: 'Discovery Kit',
    tagline: 'Discover your preference or stock up for the mood swings',
    description: '3 Cold Brew Concentrate samples in a single pack',
    image: '/3inone.png',
    gallery: [
      { id: 'sampler-concentrate-image-0', label: 'Front', src: '/3inone.png', alt: 'Discovery Kit - 3 in 1' },
      { id: 'sampler-concentrate-image-1', label: 'Serve', src: '/images/coffee-cups/iced-coffee-cup.png', alt: 'Discovery Kit - Serve' },
      { id: 'sampler-concentrate-image-2', label: 'Details', src: '/images/bgremoveconcentratebottels.png', alt: 'Discovery Kit - Details' },
    ],
    basePrice: 725,
    defaultSizeId: '540ml',
    sizes: size('540ml', '540 ml', 540),
    availability: 'Coming Soon',
    badges: ['sampler', 'all-in-one'],
    tags: ['classic', 'bold', 'kaapi', 'trial', 'discover'],
    ingredients: ['Coffee concentrate', 'Arabica coffee', 'Robusta coffee', 'Chicory', 'Filtered water'],
    caffeine: 'High',
    servings: '12-18 serves',
    brewRatio: '',
    roast: 'Medium plus / Medium dark',
    beanProfile: 'Free branded shot glass',
    bestMix: '',
    reviews: {
      rating: 5.8,
      count: 88,
      summary: 'Popular for kaapi-style cold coffee and richer milk recipes.',
      quotes: [
        'Tastes close to filter coffee but works cold.',
        'Great with condensed milk and ice.',
      ],
    },
    orderButtonText: 'Coming Soon',
    isAvailable: false,
  },
];

// The custom builder should not route to removed cafe drinks.
export const KNOWN_COMBOS = [];

export const getProductById = (id) => PRODUCTS.find((product) => product.id === id);
export const getProductsByCategory = (category) =>
  category === 'all' ? PRODUCTS : PRODUCTS.filter((product) => product.category === category);
