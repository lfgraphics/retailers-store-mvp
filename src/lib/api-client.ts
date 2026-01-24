/**
 * Centralized API client with automatic token refresh
 * Handles authentication, token refresh, and request retries
 */

type RefreshTokenCallback = () => Promise<{ accessToken: string; refreshToken: string }>;
type LogoutCallback = () => void;

class ApiClient {
  private refreshTokenCallback: RefreshTokenCallback | null = null;
  private logoutCallback: LogoutCallback | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  /**
   * Initialize the API client with auth callbacks
   */
  initialize(refreshToken: RefreshTokenCallback, logout: LogoutCallback) {
    this.refreshTokenCallback = refreshToken;
    this.logoutCallback = logout;
  }

  /**
   * Get the current access token from localStorage
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshTokenCallback) {
      throw new Error('API client not initialized');
    }

    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshQueue.push((token: string) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const { accessToken } = await this.refreshTokenCallback();

      // Resolve all queued requests with the new token
      this.refreshQueue.forEach((callback) => callback(accessToken));
      this.refreshQueue = [];

      return accessToken;
    } catch (error) {
      // Refresh failed, logout user
      console.error('Token refresh failed:', error);
      if (this.logoutCallback) {
        this.logoutCallback();
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Enhanced fetch with automatic token refresh
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = this.getAccessToken();

    // Add authorization header if token exists
    const headers = new Headers(options.headers);
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 and we have a refresh callback, try to refresh token
    if (response.status === 401 && this.refreshTokenCallback) {
      try {
        const newAccessToken = await this.refreshAccessToken();

        // Retry the request with the new token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        // Return the original 401 response if refresh fails
        return response;
      }
    }

    return response;
  }

  /**
   * Convenience method for JSON requests
   */
  async fetchJSON<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * POST request helper
   */
  async post<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.fetchJSON<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(url: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.fetchJSON<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    return this.fetchJSON<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * GET request helper
   */
  async get<T = any>(url: string, options: RequestInit = {}): Promise<T> {
    return this.fetchJSON<T>(url, options);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
