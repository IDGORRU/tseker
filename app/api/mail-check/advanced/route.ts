import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import tls from 'tls';

interface AdvancedCheckResult {
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

// POST - расширенная проверка сервера
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: 'ID сервера обязателен' },
        { status: 400 }
      );
    }

    // Получаем информацию о сервере
    const serversResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mail-check`);
    const { servers } = await serversResponse.json();
    
    const server = servers.find((s: any) => s.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: 'Сервер не найден' },
        { status: 404 }
      );
    }

    const result = await performAdvancedCheck(server);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при расширенной проверке' },
      { status: 500 }
    );
  }
}

// Расширенная проверка с реальными командами протоколов
async function performAdvancedCheck(server: any): Promise<AdvancedCheckResult> {
  const startTime = Date.now();
  
  try {
    let socket: net.Socket | tls.TLSSocket;
    let banner = '';
    let capabilities: string[] = [];
    let authMethods: string[] = [];
    let sslInfo: any = undefined;

    if (server.useSSL) {
      // SSL/TLS соединение
      socket = tls.connect({
        host: server.host,
        port: server.port,
        timeout: server.timeout,
        rejectUnauthorized: false
      });

      socket.on('secureConnect', () => {
        const tlsSocket = socket as tls.TLSSocket;
        sslInfo = {
          version: tlsSocket.getProtocol(),
          cipher: tlsSocket.getCipher().name,
          authorized: tlsSocket.authorized
        };
      });
    } else {
      // Обычное TCP соединение
      socket = new net.Socket();
      socket.setTimeout(server.timeout);
    }

    return new Promise((resolve) => {
      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;
        
        if (server.protocol === 'SMTP') {
          performSMTPCheck(socket, server, responseTime, sslInfo, resolve);
        } else if (server.protocol === 'IMAP') {
          performIMAPCheck(socket, server, responseTime, sslInfo, resolve);
        } else if (server.protocol === 'POP3') {
          performPOP3Check(socket, server, responseTime, sslInfo, resolve);
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
          capabilities: [],
          authMethods: [],
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
          capabilities: [],
          authMethods: [],
          timestamp: new Date()
        });
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
      capabilities: [],
      authMethods: [],
      timestamp: new Date()
    };
  }
}

// Проверка SMTP сервера
function performSMTPCheck(socket: net.Socket | tls.TLSSocket, server: any, responseTime: number, sslInfo: any, resolve: Function) {
  let banner = '';
  let capabilities: string[] = [];
  let authMethods: string[] = [];
  let step = 0;

  socket.on('data', (data) => {
    const response = data.toString().trim();
    
    if (step === 0) {
      // Читаем баннер
      banner = response;
      step++;
      
      // Отправляем EHLO
      socket.write('EHLO test.com\r\n');
    } else if (step === 1) {
      // Читаем ответ на EHLO
      const lines = response.split('\n');
      lines.forEach(line => {
        if (line.includes('AUTH')) {
          const authLine = line.trim();
          if (authLine.includes('LOGIN')) authMethods.push('LOGIN');
          if (authLine.includes('PLAIN')) authMethods.push('PLAIN');
          if (authLine.includes('CRAM-MD5')) authMethods.push('CRAM-MD5');
        }
        if (line.includes('STARTTLS')) capabilities.push('STARTTLS');
        if (line.includes('SIZE')) capabilities.push('SIZE');
        if (line.includes('8BITMIME')) capabilities.push('8BITMIME');
        if (line.includes('PIPELINING')) capabilities.push('PIPELINING');
      });
      
      // Отправляем QUIT
      socket.write('QUIT\r\n');
      step++;
    } else if (step === 2) {
      // Читаем ответ на QUIT и закрываем
      socket.end();
      
      resolve({
        serverId: server.id,
        protocol: server.protocol,
        host: server.host,
        port: server.port,
        status: 'success',
        responseTime,
        banner,
        capabilities,
        authMethods,
        sslInfo,
        timestamp: new Date()
      });
    }
  });
}

// Проверка IMAP сервера
function performIMAPCheck(socket: net.Socket | tls.TLSSocket, server: any, responseTime: number, sslInfo: any, resolve: Function) {
  let banner = '';
  let capabilities: string[] = [];
  let authMethods: string[] = [];
  let step = 0;

  socket.on('data', (data) => {
    const response = data.toString().trim();
    
    if (step === 0) {
      // Читаем баннер
      banner = response;
      step++;
      
      // Отправляем CAPABILITY
      socket.write('a001 CAPABILITY\r\n');
    } else if (step === 1) {
      // Читаем возможности
      const lines = response.split('\n');
      lines.forEach(line => {
        if (line.includes('CAPABILITY')) {
          if (line.includes('IMAP4rev1')) capabilities.push('IMAP4rev1');
          if (line.includes('STARTTLS')) capabilities.push('STARTTLS');
          if (line.includes('AUTH=PLAIN')) authMethods.push('PLAIN');
          if (line.includes('AUTH=LOGIN')) authMethods.push('LOGIN');
          if (line.includes('IDLE')) capabilities.push('IDLE');
          if (line.includes('CONDSTORE')) capabilities.push('CONDSTORE');
        }
      });
      
      // Отправляем LOGOUT
      socket.write('a002 LOGOUT\r\n');
      step++;
    } else if (step === 2) {
      // Читаем ответ на LOGOUT и закрываем
      socket.end();
      
      resolve({
        serverId: server.id,
        protocol: server.protocol,
        host: server.host,
        port: server.port,
        status: 'success',
        responseTime,
        banner,
        capabilities,
        authMethods,
        sslInfo,
        timestamp: new Date()
      });
    }
  });
}

// Проверка POP3 сервера
function performPOP3Check(socket: net.Socket | tls.TLSSocket, server: any, responseTime: number, sslInfo: any, resolve: Function) {
  let banner = '';
  let capabilities: string[] = [];
  let authMethods: string[] = [];
  let step = 0;

  socket.on('data', (data) => {
    const response = data.toString().trim();
    
    if (step === 0) {
      // Читаем баннер
      banner = response;
      step++;
      
      // Отправляем CAPA
      socket.write('CAPA\r\n');
    } else if (step === 1) {
      // Читаем возможности
      const lines = response.split('\n');
      lines.forEach(line => {
        if (line.includes('TOP')) capabilities.push('TOP');
        if (line.includes('USER')) capabilities.push('USER');
        if (line.includes('PIPELINING')) capabilities.push('PIPELINING');
        if (line.includes('UIDL')) capabilities.push('UIDL');
        if (line.includes('STLS')) capabilities.push('STLS');
      });
      
      // Отправляем QUIT
      socket.write('QUIT\r\n');
      step++;
    } else if (step === 2) {
      // Читаем ответ на QUIT и закрываем
      socket.end();
      
      resolve({
        serverId: server.id,
        protocol: server.protocol,
        host: server.host,
        port: server.port,
        status: 'success',
        responseTime,
        banner,
        capabilities,
        authMethods,
        sslInfo,
        timestamp: new Date()
      });
    }
  });
}