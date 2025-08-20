// Базовый URL для API
const API_BASE_URL = '/api';

// Типы данных
export interface MailServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'POP3' | 'SMTP' | 'IMAP';
  username?: string;
  password?: string;
  useSSL: boolean;
  timeout: number;
  description?: string;
  isActive: boolean;
  lastCheck?: Date;
  checkInterval: number;
}

export interface MailCheckResult {
  serverId: string;
  protocol: string;
  host: string;
  port: number;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  error?: string;
  capabilities?: string[];
  timestamp: Date;
  banner?: string;
}

export interface AdvancedCheckResult {
  serverId: string;
  protocol: string;
  host: string;
  port: number;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  error?: string;
  banner?: string;
  capabilities: string[];
  authMethods: string[];
  sslInfo?: {
    version: string;
    cipher: string;
    authorized: boolean;
  };
  timestamp: Date;
}

export interface BulkCheckResult {
  totalServers: number;
  successfulChecks: number;
  failedChecks: number;
  timeoutChecks: number;
  results: MailCheckResult[];
  totalTime: number;
  timestamp: Date;
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

// API для почтовых серверов
export const mailService = {
  // Получить все серверы
  getServers: () => fetchAPI<{ servers: MailServer[]; count: number; activeCount: number }>('/mail-check/servers'),
  
  // Добавить новый сервер
  addServer: (serverData: Omit<MailServer, 'id' | 'lastCheck'>) => 
    fetchAPI<MailServer>('/mail-check/servers', {
      method: 'POST',
      body: JSON.stringify(serverData),
    }),
  
  // Обновить сервер
  updateServer: (serverData: Partial<MailServer> & { id: string }) => 
    fetchAPI<MailServer>('/mail-check/servers', {
      method: 'PUT',
      body: JSON.stringify(serverData),
    }),
  
  // Удалить сервер
  deleteServer: (id: string) => 
    fetchAPI<{ message: string; deletedServer: MailServer }>(`/mail-check/servers?id=${id}`, {
      method: 'DELETE',
    }),

  // Простая проверка сервера
  checkServer: (serverId: string) => 
    fetchAPI<MailCheckResult>('/mail-check', {
      method: 'POST',
      body: JSON.stringify({ serverId, action: 'check' }),
    }),

  // Расширенная проверка сервера
  advancedCheck: (serverId: string) => 
    fetchAPI<AdvancedCheckResult>('/mail-check/advanced', {
      method: 'POST',
      body: JSON.stringify({ serverId }),
    }),

  // Массовая проверка всех серверов
  bulkCheck: () => 
    fetchAPI<BulkCheckResult>('/mail-check/bulk', {
      method: 'POST',
    }),
};

// Утилиты для работы с протоколами
export const protocolUtils = {
  // Получить стандартные порты для протоколов
  getDefaultPorts: (protocol: string, useSSL: boolean) => {
    switch (protocol) {
      case 'SMTP':
        return useSSL ? 465 : 587;
      case 'IMAP':
        return useSSL ? 993 : 143;
      case 'POP3':
        return useSSL ? 995 : 110;
      default:
        return 0;
    }
  },

  // Получить цвет для статуса
  getStatusColor: (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  // Получить иконку для протокола
  getProtocolIcon: (protocol: string) => {
    switch (protocol) {
      case 'SMTP': return '📤';
      case 'IMAP': return '📥';
      case 'POP3': return '📬';
      default: return '📧';
    }
  },

  // Форматировать время ответа
  formatResponseTime: (time: number) => {
    if (time < 1000) {
      return `${time}ms`;
    } else {
      return `${(time / 1000).toFixed(2)}s`;
    }
  },

  // Проверить валидность хоста
  isValidHost: (host: string) => {
    const hostRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostRegex.test(host);
  },

  // Проверить валидность порта
  isValidPort: (port: number) => {
    return port >= 1 && port <= 65535;
  },

  // Проверить валидность email
  isValidEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};