const STORAGE_KEY_URL = 'autoreel_engine_url';
const STORAGE_KEY_API_KEY = 'autoreel_api_key';

const DEFAULT_URL = 'http://localhost:8000';

export const Config = {
  getEngineUrl: () => localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL,
  getApiKey: () => localStorage.getItem(STORAGE_KEY_API_KEY) || '',
  save: (url, key) => {
    localStorage.setItem(STORAGE_KEY_URL, url.replace(/\/$/, ''));
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
  }
};

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const baseUrl = Config.getEngineUrl();
  const apiKey = Config.getApiKey();
  const headers = options.headers || {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  window.dispatchEvent(new CustomEvent('api-request', { detail: {
    type: options.method || 'GET',
    url: url,
    authState: apiKey ? 'API Key Present' : 'No API Key',
  }}));

  try {
    const response = await fetch(url, { ...options, headers });
    
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    }

    if (!response.ok) {
      const message = responseData?.message || responseData?.detail || responseData?.error || response.statusText;
      const error = new ApiError(message, response.status, responseData);
      window.dispatchEvent(new CustomEvent('api-response', { detail: {
        status: response.status,
        error: error.message,
      }}));
      throw error;
    }
    
    window.dispatchEvent(new CustomEvent('api-response', { detail: {
        status: response.status,
        error: null,
      }}));

    return responseData || response;
  } catch (err) {
    console.error('API Error:', err);
    if (!err.status) { // Network or other fetch error
        window.dispatchEvent(new CustomEvent('api-response', { detail: {
            status: 'Network Error',
            error: err.message,
        }}));
    }
    throw err;
  }
}

export const Api = {
  createJob: async (files, instructions = "") => {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    formData.append('instructions', instructions);
    return await request('/v1/jobs', { method: 'POST', body: formData });
  },
  getJob: async (jobId) => await request(`/v1/jobs/${jobId}`),
  getArtifactUrl: (jobId, filename) => `${Config.getEngineUrl()}/v1/artifacts/${jobId}/${filename}`,
  chat: async (messages) => await request('/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  }),
  testConnection: async () => {
    try {
      await request('/v1/jobs', { method: 'GET' });
      return true;
    } catch (err) {
      if (err.status === 405) return true; // Method Not Allowed is a success for connectivity test
      throw err;
    }
  }
};
