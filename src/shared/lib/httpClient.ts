import { API_CONFIG } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class HttpClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Convert snake_case to camelCase recursively
   */
  private toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }

    if (obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = this.toCamelCase(obj[key]);
        return result;
      }, {} as any);
    }

    return obj;
  }

  /**
   * Convert camelCase to snake_case recursively
   */
  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }

    if (obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = this.toSnakeCase(obj[key]);
        return result;
      }, {} as any);
    }

    return obj;
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorized(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return error instanceof TypeError ||
      (error.status && error.status >= 500);
  }

  /**
   * Delay for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main request method with error handling and transformation
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    const token = this.getToken();

    // Convert body to snake_case if present
    const body = options.body
      ? JSON.stringify(this.toSnakeCase(JSON.parse(options.body as string)))
      : undefined;

    const config: RequestInit = {
      ...options,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (response.status === 304) {
        console.log(`[HttpClient] 304 Not Modified for ${endpoint}`);
        // If 304 and we have no data in TanStack Query yet, this might return undefined
        // Ideally the browser should have substituted the body.
      }

      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - Please login again');
      }

      if (!response.ok && response.status !== 304) {
        let errorMsg = `Request failed with status ${response.status}`;
        let errorCode = undefined;
        try {
          // Attempt to parse the error response body
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg = typeof errorData.error === 'string' ? errorData.error : errorData.error.message;
            errorCode = errorData.error.code;
          }
        } catch (e) {
          // ignore parsing error if the response wasn't JSON
        }

        const error: any = new Error(errorMsg);
        error.status = response.status;
        error.code = errorCode;
        throw error;
      }

      try {
        // If it's a 304/204, try to check if there is content before parsing
        if (response.status === 204 || response.status === 304) {
          // Attempt to parse but don't fail if empty
          const text = await response.text();
          if (!text) return undefined as any;
          return this.toCamelCase(JSON.parse(text).data) as T;
        }

        const data: ApiResponse<T> = await response.json();
        if (!data.success) {
          const error: any = new Error(data.error?.message || 'Request failed');
          error.code = data.error?.code;
          throw error;
        }
        return this.toCamelCase(data.data) as T;
      } catch (error) {
        if (response.status === 304) return undefined as any; // Ignore parse error on 304
        throw error;
      }

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        if (retries > 0) {
          console.warn(`Network error, retrying... (${retries} attempts left)`);
          await this.delay(1000);
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error('Network error - Check your connection');
      }

      // Retry on server errors
      if (retries > 0 && this.isRetryable(error)) {
        console.warn(`Server error, retrying... (${retries} attempts left)`);
        await this.delay(1000);
        return this.request<T>(endpoint, options, retries - 1);
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
