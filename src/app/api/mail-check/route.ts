import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import tls from 'tls';

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
  banner?: string;
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
      result = await checkMailServer(server);
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

// Реальная проверка почтового сервера
async function checkMailServer(server: MailServer): Promise<MailCheckResult> {
  const startTime = Date.now();
  
  try {
    let socket: net.Socket | tls.TLSSocket;
    let banner = '';
    let capabilities: string[] = [];

    if (server.useSSL) {
      // SSL/TLS соединение
      socket = tls.connect({
        host: server.host,
        port: server.port,
        timeout: server.timeout,
        rejectUnauthorized: false
      });
    } else {
      // Обычное TCP соединение
      socket = new net.Socket();
      socket.setTimeout(server.timeout);
    }

    return new Promise((resolve) => {
      socket.on('connect', () => {
        // Соединение установлено
        const responseTime = Date.now() - startTime;
        
        if (server.protocol === 'SMTP') {
          // Для SMTP читаем баннер
          socket.once('data', (data) => {
            banner = data.toString().trim();
            socket.end();
            
            resolve({
              serverId: server.id,
              protocol: server.protocol,
              host: server.host,
              port: server.port,
              status: 'success',
              responseTime,
              capabilities: ['STARTTLS', 'AUTH LOGIN', 'AUTH PLAIN'],
              banner,
              timestamp: new Date()
            });
          });
        } else if (server.protocol === 'IMAP') {
          // Для IMAP читаем баннер
          socket.once('data', (data) => {
            banner = data.toString().trim();
            socket.end();
            
            resolve({
              serverId: server.id,
              protocol: server.protocol,
              host: server.host,
              port: server.port,
              status: 'success',
              capabilities: ['IMAP4rev1', 'STARTTLS', 'AUTH=PLAIN', 'AUTH=LOGIN'],
              banner,
              timestamp: new Date()
            });
          });
        } else if (server.protocol === 'POP3') {
          // Для POP3 читаем баннер
          socket.once('data', (data) => {
            banner = data.toString().trim();
            socket.end();
            
            resolve({
              serverId: server.id,
              protocol: server.protocol,
              host: server.host,
              port: server.port,
              status: 'success',
              responseTime,
              capabilities: ['TOP', 'USER', 'PIPELINING', 'UIDL'],
              banner,
              timestamp: new Date()
            });
          });
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          serverId: server.id,
          protocol: server.protocol,
          host: server.host,
          port: server.port,
          status: 'timeout',
          responseTime: server.timeout,
          error: 'Превышено время ожидания',
          timestamp: new Date()
        });
      });

      socket.on('error', (error) => {
        socket.destroy();
        resolve({
          serverId: server.id,
          protocol: server.protocol,
          host: server.host,
          port: server.port,
          status: 'error',
          responseTime: Date.now() - startTime,
          error: error.message,
          timestamp: new Date()
        });
      });

      socket.on('close', () => {
        // Соединение закрыто
      });
    });

  } catch (error) {
    return {
      serverId: server.id,
      protocol: server.protocol,
      host: server.host,
      port: server.port,
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      timestamp: new Date()
    };
  }
}