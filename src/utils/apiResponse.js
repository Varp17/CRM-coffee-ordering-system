export const unwrapData = (response, fallback = null) => {
  if (response == null) return fallback;
  if (response.data !== undefined) return response.data;
  return response;
};

export const unwrapList = (response, fallback = []) => {
  const data = unwrapData(response, response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.stores)) return data.stores;
  if (Array.isArray(data?.stock)) return data.stock;
  if (Array.isArray(data?.logs)) return data.logs;
  if (Array.isArray(data?.raw_materials)) return data.raw_materials;
  if (Array.isArray(data?.purchases)) return data.purchases;
  if (Array.isArray(data?.batches)) return data.batches;
  if (Array.isArray(data?.brew_recipes)) return data.brew_recipes;
  if (Array.isArray(data?.ingredients)) return data.ingredients;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  if (Array.isArray(data?.purchase_orders)) return data.purchase_orders;
  if (Array.isArray(data?.waste_logs)) return data.waste_logs;
  if (Array.isArray(data?.store_transfers)) return data.store_transfers;
  if (Array.isArray(data?.packaging_types)) return data.packaging_types;
  if (Array.isArray(data?.packaging_inventory)) return data.packaging_inventory;
  if (Array.isArray(data?.reorder_rules)) return data.reorder_rules;
  if (Array.isArray(data?.goods_receipts)) return data.goods_receipts;
  if (Array.isArray(data?.transfers)) return data.transfers;

  return fallback;
};

export const unwrapMeta = (response, fallback = null) => {
  if (response?.meta !== undefined) return response.meta;
  if (response?.data?.meta !== undefined) return response.data.meta;
  return fallback;
};

export const unwrapObject = (response, fallback = {}) => {
  const data = unwrapData(response, response);
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  return fallback;
};
