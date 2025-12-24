export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  // Store auth data
  setAuthData(response: LoginResponse): void {
    localStorage.setItem("accessToken", response.tokens.accessToken);
    localStorage.setItem("refreshToken", response.tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.user));
  }

  // Get tokens
  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  // Get user
  getUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Refresh access token
  async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearAuth();
      throw new Error("No refresh token");
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) {
      this.clearAuth();
      throw new Error("Failed to refresh token");
    }

    const data = (await response.json()) as AuthTokens;

    // Update tokens
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken || refreshToken);
  }

  // Clear auth data
  clearAuth(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async logout(): Promise<void> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    console.log(refreshToken);
    if (accessToken && refreshToken) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken,
          }),
        });
      } catch (error) {
        console.warn("Logout API call failed:", error);
      }

      this.clearAuth();
    }
  }
}

export const auth = new AuthService();
export default auth;
