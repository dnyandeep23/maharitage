const API_BASE_URL = "/api";

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
};

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("auth-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async login(email, password, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await handleResponse(response);
      if (data.data?.token) {
        localStorage.setItem("auth-token", data.data.token);
      }
      return data.data;
    } catch (error) {
      throw error;
    }
  },

  async register(username, email, password, role) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "An error occurred");
    }

    return data.data;
  },

  // Helper method to set auth token in localStorage
  setToken(token) {
    localStorage.setItem("authToken", token);
  },

  // Helper method to get auth token from localStorage
  getToken() {
    return localStorage.getItem("authToken");
  },

  // Helper method to remove auth token from localStorage
  removeToken() {
    localStorage.removeItem("authToken");
  },
};
