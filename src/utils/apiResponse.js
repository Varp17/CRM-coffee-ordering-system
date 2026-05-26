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
