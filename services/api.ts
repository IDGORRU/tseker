// Базовый URL для API
const API_BASE_URL = '/api';

// Типы данных
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  systemHealth: string;
  uptime: string;
  lastUpdated: string;
}

// Утилита для HTTP запросов
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API для пользователей
export const usersAPI = {
  getAll: () => fetchAPI<{ users: User[]; count: number }>('/users'),
  create: (userData: Omit<User, 'id' | 'createdAt'>) => 
    fetchAPI<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// API для задач
export const tasksAPI = {
  getAll: (filters?: { status?: string; priority?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const query = params.toString();
    return fetchAPI<{ tasks: Task[]; count: number; total: number }>(
      `/tasks${query ? `?${query}` : ''}`
    );
  },
  create: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => 
    fetchAPI<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
};

// API для статистики
export const statsAPI = {
  get: () => fetchAPI<Stats>('/stats'),
};