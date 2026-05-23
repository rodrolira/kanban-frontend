import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";
import type { Task } from "../types";

// Configuración base
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para añadir token a cada request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Manejo específico por código de error
      switch (status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
          break;
        case 403:
          toast.error("No tienes permiso para realizar esta acción");
          break;
        case 404:
          toast.error(data.error || "Recurso no encontrado");
          break;
        case 422:
          toast.error(data.error || "Datos inválidos");
          break;
        case 500:
          toast.error("Error del servidor. Intenta más tarde.");
          break;
        default:
          toast.error(data.error || "Ocurrió un error");
      }
    } else if (error.request) {
      toast.error("Error de conexión. Verifica tu internet.");
    } else {
      toast.error(error.message || "Error desconocido");
    }

    return Promise.reject(error);
  },
);

// Servicios de autenticación
export const authService = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      name,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// Servicios de tableros
export const boardService = {
  getAll: async () => {
    const response = await api.get("/boards");
    return response.data;
  },

  getById: async (boardId: string) => {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },

  create: async (name: string) => {
    const response = await api.post("/boards", { name });
    return response.data;
  },

  update: async (boardId: string, name: string) => {
    const response = await api.put(`/boards/${boardId}`, { name });
    return response.data;
  },

  delete: async (boardId: string) => {
    const response = await api.delete(`/boards/${boardId}`);
    return response.data;
  },
};

// Servicios de columnas
export const columnService = {
  create: async (boardId: string, title: string, order?: number) => {
    const response = await api.post(`/columns/boards/${boardId}/columns`, {
      title,
      order,
    });
    return response.data;
  },

  update: async (columnId: string, title: string, order?: number) => {
    const response = await api.put(`/columns/columns/${columnId}`, {
      title,
      order,
    });
    return response.data;
  },

  delete: async (columnId: string) => {
    const response = await api.delete(`/columns/columns/${columnId}`);
    return response.data;
  },
};

// Servicios de tareas
export const taskService = {
  create: async (
    columnId: string,
    title: string,
    description?: string,
    assigneeId?: string,
  ) => {
    const response = await api.post(`/tasks/columns/${columnId}/tasks`, {
      title,
      description,
      assigneeId,
    });
    return response.data;
  },

  update: async (taskId: string, data: Partial<Task>) => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  delete: async (taskId: string) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  reorder: async (columnId: string, taskIds: string[]) => {
    const response = await api.post("/tasks/reorder", { columnId, taskIds });
    return response.data;
  },
  moveBetweenColumns: async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number,
  ) => {
    const response = await api.put(`/tasks/${taskId}`, {
      columnId: destinationColumnId,
      order: newOrder,
    });
    return response.data;
  },

  updateOrder: async (taskId: string, order: number) => {
    const response = await api.put(`/tasks/${taskId}`, { order });
    return response.data;
  },
};

export default api;
