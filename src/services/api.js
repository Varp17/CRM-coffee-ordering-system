/* ============================================
   BASE API SERVICE — Digital Coffee Platform
   Real HTTP client with JWT auth, error handling,
   and auto-logout on 401.
   ============================================ */

const BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('vercel.app')
  ? 'https://coffee-ordering-system-backend.onrender.com/api/v1'
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api/v1'
    : '/api/v1');

class ApiClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  getToken() {
    return localStorage.getItem('dc_token') || null;
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('dc_token', token);
    } else {
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      localStorage.removeItem('dc_refresh_token');
      localStorage.removeItem('dc_role');
    }
  }

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('dc_refresh_token');
    if (!refreshToken) return null;

    const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);

    if (!response?.ok) return null;

    const payload = await response.json().catch(() => ({}));
    const token = payload.data?.accessToken || payload.accessToken || payload.token;
    if (token) this.setToken(token);
    return token || null;
  }

  async request(endpoint, options = {}, hasRetriedAuth = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add session/store headers if present
    const sessionId = localStorage.getItem('dc_session_id');
    if (sessionId) headers['X-Session-Id'] = sessionId;
    const storeId = localStorage.getItem('dc_store_id');
    if (storeId) headers['X-Store-Id'] = storeId;

    const config = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    // Don't send body for GET/HEAD
    if (options.body && config.method !== 'GET' && config.method !== 'HEAD') {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 — auto logout
      if (response.status === 401) {
        if (!hasRetriedAuth) {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            return this.request(endpoint, options, true);
          }
        }

        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        const errData = await response.json().catch(() => ({}));
        throw new ApiError('Session expired. Please login again.', 401, errData);
      }

      // Handle other errors
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let message = errData.message || errData.error || `Request failed with status ${response.status}`;
        
        // If it is a validation error containing field details, construct a friendly message
        const valErrors = errData.errors || errData.error;
        if (Array.isArray(valErrors) && valErrors.length > 0) {
          const detail = valErrors.map(e => `${e.field}: ${e.message}`).join(', ');
          message = `Validation failed (${detail})`;
        } else if (typeof valErrors === 'object' && valErrors !== null) {
          // If error details is a key-value object
          const detail = Object.entries(valErrors).map(([f, msg]) => `${f}: ${msg}`).join(', ');
          if (detail) {
            message = `Validation failed (${detail})`;
          }
        }
        
        throw new ApiError(message, response.status, errData);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') throw err;
      if (err.code === 20 && err.message?.includes('abort')) throw err;
      throw new ApiError('Network error. Please check your connection.', 0, { originalError: err.message });
    }
  }

  // HTTP Method wrappers
  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    }
    const qs = query.toString();
    return this.request(`${endpoint}${qs ? '?' + qs : ''}`, { method: 'GET' });
  }

  post(endpoint, data, opts = {}) {
    return this.request(endpoint, { method: 'POST', body: data, ...opts });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }

  patch(endpoint, data) {
    return this.request(endpoint, { method: 'PATCH', body: data });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = new ApiClient();
export { ApiError };
