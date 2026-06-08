import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

const PRODUCT_ID_MAP = {
  '50-50': 27,
  '70-30': 28,
  'arabica': 29,
  'sif': 30,
  'cascara': 31,
};

export const OPTION_ID_TO_INGREDIENT_ID = {
  '50-50': 1, '70-30': 2, 'arabica': 3, 'sif': 4, 'cascara': 46,
  'dairy': 8, 'oat': 9, 'almond': 10, 'coconut': 11, 'condensed': 15,
  'sugar': 12, 'jaggery': 13, 'honey': 14, 'vanilla': 17,
  'salted-caramel': 16, 'hazelnut': 18, 'mango': 25,
  'raspberry': 24, 'strawberry': 22, 'orange': 23,
  'cinnamon': 31, 'cacao': 30, 'nutmeg': 32, 'golden-cream': 26,
  'whipped-cream': 27, 'chocolate-drizzle': 21, 'honey-drizzle': 14,
  'coconut-flakes': 36, 'almond-flakes': 35, 'rainbow-sprinkles': 38,
  'brown-sugar-dust': 40, 'honey-pollen': 39, 'almond-cashew-crush': 37,
  'cocoa-powder': 34, 'fresh-cream': 29, 'milk-cream': 28,
  'elaichi': 33, 'ice': 45, 'tonic': 41, 'soda': 42,
  'lemon-juice': 43, 'orange-juice': 44, 'lemon-slice': 43, 'orange-slice': 44,
};

export const INGREDIENT_ID_TO_NAME = Object.entries(OPTION_ID_TO_INGREDIENT_ID).reduce((acc, [optId, ingId]) => {
  const name = optId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (!acc[ingId]) {
    acc[ingId] = name;
  } else if (!acc[ingId].includes(name)) {
    acc[ingId] += ` / ${name}`;
  }
  return acc;
}, {});

const COMPATIBILITY_MATRIX = {
  '50-50': {
    milks: ['dairy', 'oat', 'almond', 'coconut', 'none'],
    sweeteners: ['sugar', 'jaggery', 'honey', 'vanilla', 'salted-caramel', 'hazelnut'],
    toppings: [
      'cinnamon', 'cacao', 'nutmeg', 'golden-cream', 'whipped-cream',
      'chocolate-drizzle', 'hazelnut', 'honey-drizzle', 'salted-caramel',
      'coconut-flakes', 'almond-flakes', 'rainbow-sprinkles', 'brown-sugar-dust',
      'honey-pollen', 'almond-cashew-crush', 'ice',
    ],
    rules: [
      { when: { milk: 'coconut' }, then: { disable: ['golden-cream'] }, reason: 'Coconut milk is incompatible with golden cream' },
    ],
  },
  '70-30': {
    milks: ['dairy', 'oat', 'almond', 'none'],
    sweeteners: ['sugar', 'jaggery', 'honey', 'vanilla', 'salted-caramel', 'hazelnut', 'mango'],
    toppings: [
      'whipped-cream', 'cacao', 'cinnamon', 'nutmeg', 'cocoa-powder',
      'almond-flakes', 'fresh-cream', 'almond-cashew-crush', 'chocolate-drizzle', 'ice',
    ],
    rules: [
      { when: { sweetener: 'mango' }, then: { disable: ['nutmeg'] }, reason: 'Mango pulp and nutmeg flavors clash' },
    ],
  },
  'arabica': {
    milks: ['none'],
    sweeteners: ['sugar', 'honey', 'jaggery'],
    toppings: ['ice', 'lemon-slice', 'orange-slice', 'tonic', 'soda'],
    rules: [],
  },
  'sif': {
    milks: ['dairy', 'oat', 'none'],
    sweeteners: ['condensed', 'jaggery'],
    toppings: ['milk-cream', 'elaichi', 'almond-cashew-crush', 'ice'],
    rules: [
      { when: { milk: 'oat' }, then: { disable: ['milk-cream'] }, reason: 'Oat milk and milk cream are incompatible' },
    ],
  },
  'cascara': {
    milks: ['none'],
    sweeteners: ['sugar', 'honey'],
    toppings: ['ice', 'lemon-juice', 'orange-juice', 'tonic', 'soda'],
    rules: [],
  },
};

function resolveFromStatic(baseId, milkId, sweetenerId) {
  const base = COMPATIBILITY_MATRIX[baseId];
  if (!base) return { milks: [], sweeteners: [], toppings: [], reasons: {} };
  let toppings = [...base.toppings];
  const reasons = {};
  for (const rule of base.rules) {
    const match = (rule.when.milk && rule.when.milk === milkId) ||
                  (rule.when.sweetener && rule.when.sweetener === sweetenerId);
    if (match && rule.then.disable) {
      for (const disabledId of rule.then.disable) {
        toppings = toppings.filter((id) => id !== disabledId);
        reasons[disabledId] = rule.reason;
      }
    }
  }
  return { milks: base.milks, sweeteners: base.sweeteners, toppings, reasons };
}

function buildOptionIdList(selections) {
  const ids = [];
  if (selections.milk && selections.milk !== 'none' && OPTION_ID_TO_INGREDIENT_ID[selections.milk]) {
    ids.push({ ingredient_id: OPTION_ID_TO_INGREDIENT_ID[selections.milk] });
  }
  if (selections.sweetener && OPTION_ID_TO_INGREDIENT_ID[selections.sweetener]) {
    ids.push({ ingredient_id: OPTION_ID_TO_INGREDIENT_ID[selections.sweetener] });
  }
  (selections.syrups || []).forEach((id) => {
    if (OPTION_ID_TO_INGREDIENT_ID[id]) {
      ids.push({ ingredient_id: OPTION_ID_TO_INGREDIENT_ID[id] });
    }
  });
  (selections.toppings || []).forEach((id) => {
    if (OPTION_ID_TO_INGREDIENT_ID[id]) {
      ids.push({ ingredient_id: OPTION_ID_TO_INGREDIENT_ID[id] });
    }
  });
  return ids;
}

export function getCompatibleMilksStatic(baseId) {
  const base = COMPATIBILITY_MATRIX[baseId];
  return base ? base.milks : [];
}

export function getCompatibleSweetenersStatic(baseId) {
  const base = COMPATIBILITY_MATRIX[baseId];
  return base ? base.sweeteners : [];
}

export function isMilkCompatibleStatic(baseId, milkId) {
  return getCompatibleMilksStatic(baseId).includes(milkId);
}

export function isSweetenerCompatibleStatic(baseId, sweetenerId) {
  return getCompatibleSweetenersStatic(baseId).includes(sweetenerId);
}

export function isToppingCompatibleStatic(baseId, milkId, sweetenerId, toppingId) {
  return resolveFromStatic(baseId, milkId, sweetenerId).toppings.includes(toppingId);
}

export function getDisabledReasonStatic(baseId, milkId, sweetenerId, toppingId) {
  return resolveFromStatic(baseId, milkId, sweetenerId).reasons[toppingId] || null;
}

export async function fetchAvailabilityFromApi(baseId, selections = {}, signal) {
  const productId = PRODUCT_ID_MAP[baseId];
  if (!productId) return null;
  try {
    const res = await api.post('/recipes/availability', {
      productId,
      currentSelections: buildOptionIdList(selections),
    }, { signal });
    if (!res.data || typeof res.data !== 'object' || Array.isArray(res.data)) {
      console.warn('[Compatibility] API returned unexpected format', res.data);
      return null;
    }
    return res.data;
  } catch (err) {
    if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return null;
    console.error('[Compatibility] Availability API failed', err);
    return null;
  }
}

export function useCompatibility(baseId, selections = {}) {
  const [apiAvailability, setApiAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const selectionsKey = JSON.stringify({
    base: baseId,
    milk: selections.milk,
    sweetener: selections.sweetener,
    syrups: selections.syrups,
    toppings: selections.toppings,
  });

  useEffect(() => {
    if (!baseId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    setLoading(true);
    setApiError(false);

    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = setTimeout(async () => {
      const result = await fetchAvailabilityFromApi(baseId, selections, controller.signal);
      if (!mountedRef.current) return;
      setApiAvailability(result);
      setLoading(false);
      if (!result) setApiError(true);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [selectionsKey, baseId]);

  const getCompatibleMilks = useCallback(() => {
    if (apiAvailability) {
      const available = Object.entries(OPTION_ID_TO_INGREDIENT_ID)
        .filter(([, ingId]) => apiAvailability[ingId]?.available !== false)
        .map(([optId]) => optId);
      const allMilks = ['dairy', 'oat', 'almond', 'coconut', 'condensed', 'none'];
      return allMilks.filter((m) => available.includes(m));
    }
    return getCompatibleMilksStatic(baseId);
  }, [apiAvailability, baseId]);

  const getCompatibleSweeteners = useCallback(() => {
    if (apiAvailability) {
      const available = Object.entries(OPTION_ID_TO_INGREDIENT_ID)
        .filter(([, ingId]) => apiAvailability[ingId]?.available !== false)
        .map(([optId]) => optId);
      const all = ['sugar', 'jaggery', 'honey', 'condensed', 'vanilla',
        'salted-caramel', 'hazelnut', 'mango', 'raspberry', 'strawberry', 'orange'];
      return all.filter((s) => available.includes(s));
    }
    return getCompatibleSweetenersStatic(baseId);
  }, [apiAvailability, baseId]);

  const _check = useCallback((type, optionId, milkId, sweetenerId) => {
    if (apiAvailability) {
      const ingId = OPTION_ID_TO_INGREDIENT_ID[optionId];
      if (ingId && apiAvailability[ingId] !== undefined) {
        return apiAvailability[ingId].available !== false;
      }
    }
    if (type === 'milk') return getCompatibleMilksStatic(baseId).includes(optionId);
    if (type === 'sweetener') return getCompatibleSweetenersStatic(baseId).includes(optionId);
    return resolveFromStatic(baseId, milkId, sweetenerId).toppings.includes(optionId);
  }, [apiAvailability, baseId]);

  const getDisabledReason = useCallback((optionId, milkId, sweetenerId) => {
    if (apiAvailability) {
      const ingId = OPTION_ID_TO_INGREDIENT_ID[optionId];
      if (ingId && apiAvailability[ingId] !== undefined && apiAvailability[ingId].available === false) {
        return apiAvailability[ingId].reason || 'Not available with this combination';
      }
    }
    return getDisabledReasonStatic(baseId, milkId, sweetenerId, optionId);
  }, [apiAvailability, baseId]);

  const isMilkCompatible = useCallback((milkId) => _check('milk', milkId), [_check]);
  const isSweetenerCompatible = useCallback((sweetenerId) => _check('sweetener', sweetenerId), [_check]);
  const isToppingCompatible = useCallback((milkId, sweetenerId, toppingId) => _check('topping', toppingId, milkId, sweetenerId), [_check]);

  return {
    isMilkCompatible,
    isSweetenerCompatible,
    isToppingCompatible,
    getCompatibleMilks,
    getCompatibleSweeteners,
    getDisabledReason,
    loading,
    apiError,
  };
}
