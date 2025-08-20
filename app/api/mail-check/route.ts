import { NextRequest, NextResponse } from 'next/server';

// Типы для почтовых серверов
interface MailServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'POP3' | 'SMTP' | 'IMAP';
  username?: string;
  password?: string;
  useSSL: boolean;
  timeout: number;
}

interface MailCheckResult {
  serverId: string;
  protocol: string;
  host: string;
  port: number;
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  error?: string;
  capabilities?: string[];
  timestamp: Date;
}

// Моковые данные серверов
const mailServers: MailServer[] = [
  {
    id: '1',
    name: 'Gmail SMTP',
    host: 'smtp.gmail.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@gmail.com',
    useSSL: false,
    timeout: 10000
  },
  {
    id: '2',
    name: 'Gmail IMAP',
    host: 'imap.gmail.com',
    port: 993,
    protocol: 'IMAP',
    username: 'test@gmail.com',
    useSSL: true,
    timeout: 10000
  },
  {
    id: '3',
    name: 'Gmail POP3',
    host: 'pop.gmail.com',
    port: 995,
    protocol: 'POP3',
    username: 'test@gmail.com',
    useSSL: true,
    timeout: 10000
  },
  {
    id: '4',
    name: 'Outlook SMTP',
    host: 'smtp-mail.outlook.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@outlook.com',
    useSSL: false,
    timeout: 10000
  },
  {
    id: '5',
    name: 'Yahoo SMTP',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@yahoo.com',
    useSSL: false,
    timeout: 10000
  }
];

// GET - получить список серверов
export async function GET() {
  try {
    return NextResponse.json({ 
      servers: mailServers,
      count: mailServers.length 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении списка серверов' },
      { status: 500 }
    );
  }
}

// POST - проверить сервер
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, action } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'ID сервера обязателен' },
        { status: 400 }
      );
    }

    const server = mailServers.find(s => s.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Сервер не найден' },
        { status: 404 }
      );
    }

    let result: MailCheckResult;

    if (action === 'check') {
      // Симуляция проверки сервера
      result = await simulateMailServerCheck(server);
    } else {
      return NextResponse.json(
        { error: 'Неизвестное действие' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при проверке сервера' },
      { status: 500 }
    );
  }
}

// Симуляция проверки почтового сервера
async function simulateMailServerCheck(server: MailServer): Promise<MailCheckResult> {
  const startTime = Date.now();
  
  // Имитация задержки сети
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  const responseTime = Date.now() - startTime;
  
  // Симуляция различных результатов
  const random = Math.random();
  
  if (random > 0.8) {
    // Ошибка
    return {
      serverId: server.id,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      status: 'error',
      responseTime,
      error: 'Соединение отклонено сервером',
      timestamp: new Date()
    };
  } else if (random > 0.6) {
    // Таймаут
    return {
      serverId: server.id,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      status: 'timeout',
      responseTime: server.timeout,
      error: 'Превышено время ожидания',
      timestamp: new Date()
    };
  } else {
    // Успех
    const capabilities = getCapabilities(server.protocol);
    return {
      serverId: server.id,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      status: 'success',
      responseTime,
      capabilities,
      timestamp: new Date()
    };
  }
}

// Получение возможностей протокола
function getCapabilities(protocol: string): string[] {
  switch (protocol) {
    case 'SMTP':
      return ['STARTTLS', 'AUTH LOGIN', 'AUTH PLAIN', 'SIZE', '8BITMIME'];
    case 'IMAP':
      return ['IMAP4rev1', 'STARTTLS', 'AUTH=PLAIN', 'AUTH=LOGIN', 'IDLE'];
    case 'POP3':
      return ['TOP', 'USER', 'PIPELINING', 'UIDL'];
    default:
      return [];
  }
}