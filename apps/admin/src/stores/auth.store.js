import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('adminUser') || 'null'),
    accessToken: localStorage.getItem('adminAccessToken') || null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isSuperAdmin: (state) => state.user?.role === 'superadmin',
    isAdmin: (state) => ['admin', 'superadmin'].includes(state.user?.role),
  },

  actions: {
    async login(email, password) {
      this.isLoading = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/login`, { email, password }, {
          withCredentials: true,
        });

        if (!['admin', 'superadmin'].includes(data.data.user.role)) {
          throw new Error('Access denied. Admin privileges required.');
        }

        this.user = data.data.user;
        this.accessToken = data.data.accessToken;
        localStorage.setItem('adminUser', JSON.stringify(this.user));
        localStorage.setItem('adminAccessToken', this.accessToken);

        return data;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.user = null;
      this.accessToken = null;
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminAccessToken');
    },

    updateUser(userData) {
      this.user = { ...this.user, ...userData };
      localStorage.setItem('adminUser', JSON.stringify(this.user));
    },
  },
});
