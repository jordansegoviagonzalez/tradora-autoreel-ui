const STORAGE_KEY_URL = 'autoreel_engine_url';
const STORAGE_KEY_API_KEY = 'autoreel_api_key';

// Default config
const DEFAULT_URL = 'http://localhost:8000';

export const Config = {
  getEngineUrl: () => localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL,
  getApiKey: () => localStorage.getItem(STORAGE_KEY_API_KEY) || '',
  
  save: (url, key) => {
    localStorage.setItem(STORAGE_KEY_URL, url.replace(/\/$/, '')); // Remove trailing slash
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

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: response.statusText };
      }
      throw new ApiError(errorData.message || 'API Request Failed', response.status, errorData);
    }

    // Return JSON if content-type is json, otherwise blob or text? 
    // For this app, mostly JSON.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response; // Return raw response for blobs/downloads if needed manually
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

export const Api = {
  createJob: async (files, instructions = "") => {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    formData.append('instructions', instructions);

    // Upload can take time, maybe increase timeout if we had an abort controller, 
    // but fetch default is usually generous.
    return await request('/v1/jobs', {
      method: 'POST',
      body: formData
      // Note: Content-Type header not set manually for FormData, browser handles it + boundary
    });
  },

  getJob: async (jobId) => {
    return await request(`/v1/jobs/${jobId}`);
  },

  // Helper to construct full artifact URL for use in hrefs/src attributes
  getArtifactUrl: (jobId, filename) => {
    const baseUrl = Config.getEngineUrl();
    const apiKey = Config.getApiKey();
    return `${baseUrl}/v1/artifacts/${jobId}/${filename}`; 
  },

  chat: async (messages) => {
    // Expects messages: [{ role: 'user', content: '...' }, ...]
    return await request('/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
  },

  testConnection: async () => {
    try {
      // We expect 405 Method Not Allowed (since it's a POST endpoint)
      // or 200 OK if the engine implements GET listing.
      // Any response from the server means it is reachable.
      const response = await request('/v1/jobs', { method: 'GET' });
      return true; // If request succeeds (even if 405 handled inside request wrapper?), wait.
      // request() wrapper throws on !ok. 
      // We need to catch specific status inside or handle it here.
    } catch (err) {
      // 405 is actually "Success" for reachability here
      if (err.status === 405) return true;
      throw err;
    }
  }
};
