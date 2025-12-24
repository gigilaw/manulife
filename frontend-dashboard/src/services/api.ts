import { auth } from "@/utils/auth";

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
  }

  // Main request method with auto-refresh
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // First attempt with current token
      const response = await this.makeRequest(endpoint, options);

      if (response.ok) {
        return (await response.json()) as T;
      }

      // If 401, try to refresh token and retry
      if (response.status === 401) {
        return await this.handleUnauthorized<T>(endpoint, options);
      }

      // Other errors
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed: ${response.status}`
      );
    } catch (error) {
      throw error;
    }
  }

  // Make actual fetch request
  private async makeRequest(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    // Get auth headers
    const token = auth.getAccessToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    } as Record<string, string>;

    // Add Authorization header if we have a token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });
  }

  // Handle 401 by refreshing token and retrying
  private async handleUnauthorized<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    try {
      // Try to refresh the token
      await auth.refreshAccessToken();

      // Retry the request with new token
      const retryResponse = await this.makeRequest(endpoint, options);

      if (retryResponse.ok) {
        return (await retryResponse.json()) as T;
      }

      // If still 401 after refresh, clear auth
      if (retryResponse.status === 401) {
        auth.clearAuth();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(`Request failed after refresh: ${retryResponse.status}`);
    } catch (error) {
      // If refresh fails, clear auth and redirect
      auth.clearAuth();
      window.location.href = "/login";
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
