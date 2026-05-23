/* eslint-disable @typescript-eslint/no-explicit-any */

// Respuesta estándar de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos de usuario
export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  createdAt?: string;
  updatedAt?: string;
}

// Tipos para el Kanban
export interface Task {
  id: string;
  title: string;
  description?: string;
  order: number;
  columnId: string;
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  columns: Column[];
  createdAt?: string;
  updatedAt?: string;
}

// Estado de autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Props para componentes
export interface ChildrenProps {
  children: React.ReactNode;
}

// Estado del kanban
export interface KanbanState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
}


