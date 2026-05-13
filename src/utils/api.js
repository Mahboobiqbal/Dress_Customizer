// API utility functions for backend communication
const API_BASE_URL = "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add JWT token if available
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || "API request failed", response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("Network error", 0);
  }
};

export const authAPI = {
  signup: (userData) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  signin: (credentials) =>
    apiRequest("/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  verify: () => apiRequest("/auth/verify"),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user-name");
  },
};

export const accountsAPI = {
  getProfile: () => apiRequest("/accounts/profile"),

  updateProfile: (profileData) =>
    apiRequest("/accounts/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),
};

export const gownDesignsAPI = {
  getAll: () => apiRequest("/gown-designs"),

  create: (designData) =>
    apiRequest("/gown-designs", {
      method: "POST",
      body: JSON.stringify(designData),
    }),

  getById: (id) => apiRequest(`/gown-designs/${id}`),

  update: (id, designData) =>
    apiRequest(`/gown-designs/${id}`, {
      method: "PUT",
      body: JSON.stringify(designData),
    }),

  delete: (id) =>
    apiRequest(`/gown-designs/${id}`, {
      method: "DELETE",
    }),
};

export const designsAPI = {
  getAll: () => apiRequest("/designs"),

  create: (designData) =>
    apiRequest("/designs", {
      method: "POST",
      body: JSON.stringify(designData),
    }),

  getById: (id) => apiRequest(`/designs/${id}`),

  update: (id, designData) =>
    apiRequest(`/designs/${id}`, {
      method: "PUT",
      body: JSON.stringify(designData),
    }),

  delete: (id) =>
    apiRequest(`/designs/${id}`, {
      method: "DELETE",
    }),

  generateImage: (prompt) =>
    apiRequest("/designs/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};

export const bodyProfilesAPI = {
  getAll: () => apiRequest("/body-profiles"),

  create: (profileData) =>
    apiRequest("/body-profiles", {
      method: "POST",
      body: JSON.stringify(profileData),
    }),

  update: (profileData) =>
    apiRequest("/body-profiles", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),
};

export const profilesAPI = {
  // Get current user's complete profile
  getCurrent: () => apiRequest("/profiles/me"),

  // Get specific user's profile (by ID)
  getById: (accountId) => apiRequest(`/profiles/${accountId}`),

  // Update current user's profile
  updateCurrent: (profileData) =>
    apiRequest("/profiles/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  // Update specific user's profile
  updateById: (accountId, profileData) =>
    apiRequest(`/profiles/${accountId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  // Delete current user's profile and account
  deleteCurrent: () =>
    apiRequest("/profiles/me", {
      method: "DELETE",
    }),

  // Delete specific user's profile
  deleteById: (accountId) =>
    apiRequest(`/profiles/${accountId}`, {
      method: "DELETE",
    }),

  // Body profile specific operations
  bodyProfile: {
    // Get current user's body profile
    getCurrent: () => apiRequest("/profiles/me/body"),

    // Update current user's body profile
    updateCurrent: (bodyData) =>
      apiRequest("/profiles/me/body", {
        method: "PUT",
        body: JSON.stringify(bodyData),
      }),

    // Reset body profile to defaults
    reset: () =>
      apiRequest("/profiles/me/body", {
        method: "DELETE",
      }),
  },
};

export const aiAPI = {
  listModels: () => apiRequest("/ai/models"),

  generateImage: (prompt, params, model) =>
    apiRequest("/ai/generate-image", {
      method: "POST",
      body: JSON.stringify({ prompt, params, model }),
    }),

  generateImageText: (prompt) =>
    apiRequest("/ai/generate-image-text", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};

export default apiRequest;
