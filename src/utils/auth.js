// Authentication utilities
import { jwtDecode } from 'jwt-decode';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Auth utilities
export const auth = {
    // Set auth token and user info
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
        try {
            const decoded = jwtDecode(token);
            this.setUser(decoded);
            return true;
        } catch (error) {
            console.error('Failed to decode token:', error);
            return false;
        }
    },

    // Get the current token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Set user info
    setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Get the current user
    getUser() {
        const userJson = localStorage.getItem(USER_KEY);
        if (!userJson) return null;

        try {
            return JSON.parse(userJson);
        } catch (err) {
            console.error('Failed to parse user data:', err);
            return null;
        }
    },

    // Check if user is logged in
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // Check if token is expired
            return decoded.exp > currentTime;
        } catch {
            return false;
        }
    },

    // Log out user
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Get auth header for API requests
    getAuthHeader() {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
};