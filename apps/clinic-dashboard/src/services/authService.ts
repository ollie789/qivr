// Mock authentication service for development
// Replace with real authentication service when implementing AWS Cognito

class AuthService {
  private mockToken = 'mock-jwt-token-for-development';

  getToken(): string | null {
    // In development, return a mock token
    if (import.meta.env.DEV) {
      return this.mockToken;
    }
    
    // In production, get the real token from localStorage
    return localStorage.getItem('accessToken');
  }

  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  clearToken(): void {
    localStorage.removeItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Mock login for development
  async login(email: string, password: string): Promise<{ token: string }> {
    console.log('Mock login:', { email });
    this.setToken(this.mockToken);
    return { token: this.mockToken };
  }

  logout(): void {
    this.clearToken();
  }
}

export default new AuthService();
