// TechZone Mobile Accessories - Real Backend REST API Client

const BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : '/api';
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
      try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Authentication failed (${res.status}).`);
        }
        if (!data.token) {
          throw new Error('Authentication response did not return a valid token.');
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        return data.admin;
      } catch (err) {
        if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
          throw new Error('Unable to connect to backend server. Please verify network connection or server status.');
        }
        throw err;
      }
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
      const sortByVal = filters.sortBy || filters.sort;
      if (sortByVal) params.append('sortBy', sortByVal);
      if (filters.featured) params.append('featured', filters.featured);
      if (filters.newArrival) params.append('newArrival', filters.newArrival);
      if (filters.bestseller) params.append('bestseller', filters.bestseller);
      if (filters.status) params.append('status', filters.status);
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

    bulkUpload: async (productsList) => {
      const res = await fetch(`${BASE_URL}/products/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ products: productsList })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk upload failed.');
      return data;
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
    },

    updateDetails: async (id, orderData) => {
      const res = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error updating order details.');
      return data.order;
    },

    delete: async (id) => {
      const res = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting order.');
      return data;
    },

    sendPaymentEmail: async (id, email) => {
      const res = await fetch(`${BASE_URL}/orders/${id}/send-payment-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error sending payment email.');
      return data;
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

  // Image Upload helper (resizes and compresses images to JPEG base64 DataURI to prevent payload overflow)
  uploadImage: async (file, maxWidth = 1200, maxHeight = 650, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return reject(new Error('Please select a valid image file.'));
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Scale down maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG at specified quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };

        img.onerror = () => reject(new Error('Failed to parse image file.'));
        img.src = e.target.result;
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};

// Bind to window context
window.api = api;
