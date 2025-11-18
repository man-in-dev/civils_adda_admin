const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Get auth token from localStorage
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
};

// Set auth token in localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', token);
  }
};

// Remove auth token from localStorage
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
};

// API request wrapper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized - clear token and redirect to login
      if (response.status === 401 || response.status === 403) {
        removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// API methods
export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return response;
    },

    getMe: async () => {
      const response = await apiRequest<{ user: any }>('/auth/me');
      return response;
    },
  },

  // Admin Tests
  admin: {
    tests: {
      getAll: async () => {
        const response = await apiRequest<Array<any>>('/admin/tests');
        return response;
      },

      getById: async (id: string) => {
        const response = await apiRequest<{ data: any }>(`/admin/tests/${id}`);
        return response;
      },

      create: async (testData: any) => {
        const response = await apiRequest<{ data: any }>('/admin/tests', {
          method: 'POST',
          body: JSON.stringify(testData),
        });
        return response;
      },

      update: async (id: string, testData: any) => {
        const response = await apiRequest<{ data: any }>(`/admin/tests/${id}`, {
          method: 'PUT',
          body: JSON.stringify(testData),
        });
        return response;
      },

      delete: async (id: string) => {
        const response = await apiRequest<{ message: string }>(`/admin/tests/${id}`, {
          method: 'DELETE',
        });
        return response;
      },
    },

    stats: {
      get: async () => {
        const response = await apiRequest<any>('/admin/stats');
        return response;
      },
    },
  },
};

