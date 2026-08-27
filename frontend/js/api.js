// TechZone Mobile Accessories - Real Backend REST API Client

const BASE_URL = '/api';
const TOKEN_KEY = 'tz_token';

// Helper to get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API Client Wrapper
const api = {
  // Authentication services
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      return data.admin;
    },

    me: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders()
          }
        });
        const data = await res.json();
        if (!res.ok) {
          localStorage.removeItem(TOKEN_KEY);
          return null;
        }
        return data.admin;
      } catch (err) {
        console.error(err);
        return null;
      }
    },

    logout: async () => {
      try {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders()
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  },

  // Products CRUD API
  products: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.inStock) params.append('inStock', filters.inStock);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.all) params.append('all', filters.all);

      const res = await fetch(`${BASE_URL}/products?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading products.');
      return data.products;
    },

    getById: async (id) => {
      const res = await fetch(`${BASE_URL}/products/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Product not found.');
      return data.product;
    },

    create: async (productData) => {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error creating product.');
      return data.product;
    },

    update: async (id, productData) => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating product.');
      return data.product;
    },

    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting product.');
      return data;
    },

    save: async (productData) => {
      const id = productData.id || productData._id;
      if (id) {
        return await api.products.update(id, productData);
      } else {
        return await api.products.create(productData);
      }
    }
  },

  // Categories CRUD API
  categories: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.all) params.append('all', filters.all);

      const res = await fetch(`${BASE_URL}/categories?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading categories.');
      return data.categories;
    },

    create: async (categoryData) => {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(categoryData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error creating category.');
      return data.category;
    },

    update: async (id, categoryData) => {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(categoryData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating category.');
      return data.category;
    },

    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting category.');
      return data;
    },

    save: async (categoryData) => {
      const id = categoryData.id || categoryData._id;
      if (id) {
        return await api.categories.update(id, categoryData);
      } else {
        return await api.categories.create(categoryData);
      }
    }
  },

  // Banners CRUD API
  banners: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.all) params.append('all', filters.all);

      const res = await fetch(`${BASE_URL}/banners?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading banners.');
      return data.banners;
    },

    create: async (bannerData) => {
      const res = await fetch(`${BASE_URL}/banners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(bannerData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error creating banner.');
      return data.banner;
    },

    update: async (id, bannerData) => {
      const res = await fetch(`${BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(bannerData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating banner.');
      return data.banner;
    },

    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/banners/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting banner.');
      return data;
    },

    save: async (bannerData) => {
      const id = bannerData.id || bannerData._id;
      if (id) {
        return await api.banners.update(id, bannerData);
      } else {
        return await api.banners.create(bannerData);
      }
    }
  },

  // Orders Checkout and Status Management API
  orders: {
    getAll: async () => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading orders.');
      return data.orders;
    },

    getById: async (id) => {
      const res = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order not found.');
      return data.order;
    },

    create: async (orderData) => {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error placing order.');
      return data.order;
    },

    updateStatus: async (id, status) => {
      const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating order status.');
      return data.order;
    }
  },

  // Store settings management
  settings: {
    get: async () => {
      const res = await fetch(`${BASE_URL}/settings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading settings.');
      return data.settings;
    },

    save: async (settingsData) => {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settingsData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error saving settings.');
      return data.settings;
    }
  },

  // Reviews Testimonials API
  reviews: {
    getAll: async () => {
      const res = await fetch(`${BASE_URL}/reviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading reviews.');
      return data.reviews;
    },

    create: async (reviewData) => {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error posting review.');
      return data.review;
    }
  },

  // Image Upload helper (converts to base64 DataURI to upload on save)
  uploadImage: async (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('Image file is too large (maximum size 2MB)'));
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};

// Bind to window context
window.api = api;
