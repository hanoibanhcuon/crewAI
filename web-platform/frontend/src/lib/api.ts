import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// Create axios instance with optimized settings
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout to prevent hanging requests
  timeout: 30000,
});

// Request queue for rate limiting
let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If it's a network error or timeout, don't try to refresh
    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        const refreshResponse = await api.post("/auth/refresh");
        const { access_token } = refreshResponse.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access_token);
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);

        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          // Only redirect if not already on login page
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (email: string, password: string, full_name?: string) =>
    api.post("/auth/register", { email, password, full_name }),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
};

// Users API
export const usersApi = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data: any) => api.patch("/users/me", data),
  changePassword: (data: any) => api.post("/users/me/password", data),
  getApiKeys: () => api.get("/users/me/api-keys"),
  setApiKey: (provider: string, api_key: string) =>
    api.post("/users/me/api-keys", { provider, api_key }),
  deleteApiKey: (provider: string) =>
    api.delete(`/users/me/api-keys/${provider}`),
};

// Agents API
export const agentsApi = {
  list: (params?: any) => api.get("/agents", { params }),
  get: (id: string) => api.get(`/agents/${id}`),
  create: (data: any) => api.post("/agents", data),
  update: (id: string, data: any) => api.patch(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
  duplicate: (id: string) => api.post(`/agents/${id}/duplicate`),
};

// Tasks API
export const tasksApi = {
  list: (params?: any) => api.get("/tasks", { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  duplicate: (id: string) => api.post(`/tasks/${id}/duplicate`),
};

// Crews API
export const crewsApi = {
  list: (params?: any) => api.get("/crews", { params }),
  get: (id: string) => api.get(`/crews/${id}`),
  create: (data: any) => api.post("/crews", data),
  update: (id: string, data: any) => api.patch(`/crews/${id}`, data),
  delete: (id: string) => api.delete(`/crews/${id}`),
  duplicate: (id: string) => api.post(`/crews/${id}/duplicate`),
  kickoff: (id: string, inputs: any = {}) =>
    api.post(`/crews/${id}/kickoff`, { inputs }),
  getInputs: (id: string) => api.get(`/crews/${id}/inputs`),
  deploy: (id: string, environment: string) =>
    api.post(`/crews/${id}/deploy`, null, { params: { environment } }),
};

// Flows API
export const flowsApi = {
  list: (params?: any) => api.get("/flows", { params }),
  get: (id: string) => api.get(`/flows/${id}`),
  create: (data: any) => api.post("/flows", data),
  update: (id: string, data: any) => api.patch(`/flows/${id}`, data),
  delete: (id: string) => api.delete(`/flows/${id}`),
  duplicate: (id: string) => api.post(`/flows/${id}/duplicate`),
  deploy: (id: string, environment: string = "production") =>
    api.post(`/flows/${id}/deploy`, null, { params: { environment } }),
  addStep: (flowId: string, data: any) =>
    api.post(`/flows/${flowId}/steps`, data),
  updateStep: (flowId: string, stepId: string, data: any) =>
    api.patch(`/flows/${flowId}/steps/${stepId}`, data),
  deleteStep: (flowId: string, stepId: string) =>
    api.delete(`/flows/${flowId}/steps/${stepId}`),
  addConnection: (flowId: string, data: any) =>
    api.post(`/flows/${flowId}/connections`, data),
  deleteConnection: (flowId: string, connectionId: string) =>
    api.delete(`/flows/${flowId}/connections/${connectionId}`),
  kickoff: (id: string, inputs: any = {}, initialState: any = {}) =>
    api.post(`/flows/${id}/kickoff`, { inputs, initial_state: initialState }),
};

// Tools API
export const toolsApi = {
  list: (params?: any) => api.get("/tools", { params }),
  getCategories: () => api.get("/tools/categories"),
  get: (id: string) => api.get(`/tools/${id}`),
  create: (data: any) => api.post("/tools", data),
  update: (id: string, data: any) => api.patch(`/tools/${id}`, data),
  delete: (id: string) => api.delete(`/tools/${id}`),
  test: (id: string, testInput: any) =>
    api.post(`/tools/${id}/test`, testInput),
};

// Executions API
export const executionsApi = {
  list: (params?: any) => api.get("/executions", { params }),
  get: (id: string) => api.get(`/executions/${id}`),
  cancel: (id: string) => api.post(`/executions/${id}/cancel`),
  getLogs: (id: string, params?: any) =>
    api.get(`/executions/${id}/logs`, { params }),
  getTraces: (id: string) => api.get(`/executions/${id}/traces`),
  submitFeedback: (id: string, feedback: any) =>
    api.post(`/executions/${id}/human-feedback`, feedback),
};

// Triggers API
export const triggersApi = {
  list: (params?: any) => api.get("/triggers", { params }),
  get: (id: string) => api.get(`/triggers/${id}`),
  create: (data: any) => api.post("/triggers", data),
  update: (id: string, data: any) => api.patch(`/triggers/${id}`, data),
  delete: (id: string) => api.delete(`/triggers/${id}`),
};

// Templates API
export const templatesApi = {
  list: (params?: any) => api.get("/templates", { params }),
  getCategories: () => api.get("/templates/categories"),
  getMy: (params?: any) => api.get("/templates/my", { params }),
  get: (id: string) => api.get(`/templates/${id}`),
  create: (data: any) => api.post("/templates", data),
  update: (id: string, data: any) => api.patch(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  use: (id: string) => api.post(`/templates/${id}/use`),
  like: (id: string) => api.post(`/templates/${id}/like`),
  rate: (id: string, rating: number) =>
    api.post(`/templates/${id}/rate`, null, { params: { rating } }),
};

// Teams API
export const teamsApi = {
  list: () => api.get("/teams"),
  get: (id: string) => api.get(`/teams/${id}`),
  create: (data: any) => api.post("/teams", data),
  update: (id: string, data: any) => api.patch(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  invite: (teamId: string, data: any) =>
    api.post(`/teams/${teamId}/invite`, data),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// Knowledge Sources API
export const knowledgeApi = {
  list: (params?: any) => api.get("/knowledge", { params }),
  get: (id: string) => api.get(`/knowledge/${id}`),
  create: (data: FormData) =>
    api.post("/knowledge", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: any) => api.patch(`/knowledge/${id}`, data),
  delete: (id: string) => api.delete(`/knowledge/${id}`),
  upload: (id: string, file: FormData) =>
    api.post(`/knowledge/${id}/upload`, file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  reprocess: (id: string) => api.post(`/knowledge/${id}/reprocess`),
  getChunks: (id: string, params?: any) =>
    api.get(`/knowledge/${id}/chunks`, { params }),
};
