// lib/auth.ts
import api, { handleApiError } from './api';
import { User, LoginCredentials, SignupData, TokenResponse } from '@/types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      const response = await api.post<TokenResponse>('/auth/login/', credentials);
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Signup
  async signup(data: SignupData): Promise<User> {
    try {
      const response = await api.post<User>('/api/users/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/api/users/me/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  // Get stored tokens
  getTokens(): { access: string | null; refresh: string | null } {
    return {
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    };
  },
};