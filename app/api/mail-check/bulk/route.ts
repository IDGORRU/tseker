import { NextResponse } from 'next/server';

// Типы для массовой проверки
interface BulkCheckResult {
  totalServers: number;
  successfulChecks: number;
  failedChecks: number;
  timeoutChecks: number;
  results: any[];
  totalTime: number;
  timestamp: Date;
}

// POST - массовая проверка всех серверов
export async function POST() {
  try {
    const startTime = Date.now();
    
    // Получаем список серверов
    const serversResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mail-check`);
    const { servers } = await serversResponse.json();
    
    if (!servers || servers.length === 0) {
      return NextResponse.json(
        { error: 'Серверы не найдены' },
        { status: 404 }
      );
    }

    // Проверяем все серверы параллельно
    const checkPromises = servers.map(async (server: any) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mail-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverId: server.id,
            action: 'check'
          })
        });
        
        if (response.ok) {
          return await response.json();
        } else {
          return {
            serverId: server.id,
            protocol: server.protocol,
            host: server.host,
            port: server.port,
            status: 'error',
            responseTime: 0,
            error: 'Ошибка при проверке',
            timestamp: new Date()
          };
        }
      } catch (error) {
        return {
          serverId: server.id,
          protocol: server.protocol,
          host: server.host,
          port: server.port,
          status: 'error',
          responseTime: 0,
          error: 'Ошибка сети',
          timestamp: new Date()
        };
      }
    });

    const results = await Promise.all(checkPromises);
    const totalTime = Date.now() - startTime;

    // Подсчитываем статистику
    const successfulChecks = results.filter(r => r.status === 'success').length;
    const failedChecks = results.filter(r => r.status === 'error').length;
    const timeoutChecks = results.filter(r => r.status === 'timeout').length;

    const bulkResult: BulkCheckResult = {
      totalServers: servers.length,
      successfulChecks,
      failedChecks,
      timeoutChecks,
      results,
      totalTime,
      timestamp: new Date()
    };

    return NextResponse.json(bulkResult);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при массовой проверке' },
      { status: 500 }
    );
  }
}