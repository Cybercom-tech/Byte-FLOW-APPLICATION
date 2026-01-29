// API Service Utility
// Handles all HTTP requests to the backend API with JWT token management

import API_BASE_URL from '../config/api';

const TOKEN_STORAGE_KEY = 'auth_token';

/**
 * Get stored JWT token
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Store JWT token
 */
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return true;
  } catch (error) {
    console.error('Error setting token:', error);
    return false;
  }
};

/**
 * Remove JWT token
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

/**
 * Get headers for API requests
 */
const getHeaders = (includeAuth = true, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Handle error responses
    const error = {
      message: data.message || data.error || `HTTP error! status: ${response.status}`,
      status: response.status,
      data: data
    };
    // Don't log 400 errors for student profile creation (expected when profile exists)
    // The calling code will handle it appropriately
    throw error;
  }

  return data;
};

/**
 * Make API request with configurable timeout
 * Default timeout: 8 seconds (prevents UI from hanging forever)
 */
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    includeAuth = true,
    headers: customHeaders = {},
    timeout = 8000 // 8 second default timeout
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method,
    headers: getHeaders(includeAuth, customHeaders)
  };

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);
      return await handleResponse(response);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Handle timeout/abort errors
    if (error.name === 'AbortError') {
      const timeoutError = {
        message: `Request timeout after ${timeout/1000}s: ${endpoint}`,
        status: 0,
        isTimeout: true,
        data: {
          message: 'Request timed out. The server may be slow or unreachable.'
        }
      };
      throw timeoutError;
    }
    
    // Handle network errors (fetch failures before response)
    // Network errors don't have a status property
    if (!error.status && (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError')) {
      // Enhance error object with network error information
      const networkError = {
        message: error.message || 'Network error: Unable to connect to server',
        status: 0, // 0 indicates network error
        isNetworkError: true,
        data: {
          message: 'Network error: Unable to connect to the backend server. Please ensure the server is running and accessible.'
        }
      };
      throw networkError;
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      // Unauthorized - token expired or invalid
      removeToken();
      window.dispatchEvent(new Event('userLogout'));
    }
    
    // Handle ban errors
    if (error.status === 403 && error.data?.banned) {
      // User is banned - trigger ban event
      window.dispatchEvent(new CustomEvent('userBanned', { detail: { message: error.message || error.data?.message } }));
    }
    
    throw error;
  }
};

/**
 * Convenience methods for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body })
};

export default api;

