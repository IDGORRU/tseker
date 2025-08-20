'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Mail, Server } from 'lucide-react';

interface MailServer {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'POP3' | 'SMTP' | 'IMAP';
  username?: string;
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

export default function HomePage() {
  const [servers, setServers] = useState<MailServer[]>([]);
  const [checkResults, setCheckResults] = useState<Record<string, MailCheckResult>>({});
  const [checkingServers, setCheckingServers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mail-check');
      const data = await response.json();
      setServers(data.servers);
    } catch (error) {
      console.error('Ошибка при загрузке серверов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckServer = async (serverId: string) => {
    if (checkingServers.has(serverId)) return;

    try {
      setCheckingServers(prev => new Set(prev).add(serverId));
      const response = await fetch('/api/mail-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, action: 'check' })
      });
      
      if (response.ok) {
        const result = await response.json();
        setCheckResults(prev => ({ ...prev, [serverId]: result }));
      }
    } catch (error) {
      console.error('Ошибка при проверке сервера:', error);
    } finally {
      setCheckingServers(prev => {
        const newSet = new Set(prev);
        newSet.delete(serverId);
        return newSet;
      });
    }
  };

  const handleCheckAll = async () => {
    for (const server of servers) {
      await handleCheckServer(server.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Успешно';
      case 'error': return 'Ошибка';
      case 'timeout': return 'Таймаут';
      default: return status;
    }
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'SMTP': return '📤';
      case 'IMAP': return '📥';
      case 'POP3': return '📬';
      default: return '📧';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Загрузка почтовых серверов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              📧 Проверка почтовых серверов
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Реальная проверка POP3, SMTP и IMAP серверов с поддержкой SSL/TLS
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Статистика */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-600">
                {servers.length}
              </CardTitle>
              <p className="text-sm text-gray-600">Всего серверов</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">
                {servers.filter(s => s.useSSL).length}
              </CardTitle>
              <p className="text-sm text-gray-600">SSL/TLS серверов</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-purple-600">
                {servers.filter(s => s.protocol === 'SMTP').length}
              </CardTitle>
              <p className="text-sm text-gray-600">SMTP серверов</p>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-orange-600">
                {servers.filter(s => s.protocol === 'IMAP' || s.protocol === 'POP3').length}
              </CardTitle>
              <p className="text-sm text-gray-600">Серверов получения</p>
            </CardHeader>
          </Card>
        </div>

        {/* Кнопки управления */}
        <div className="flex justify-center mb-8">
          <Button onClick={handleCheckAll} size="lg" className="mr-4">
            <CheckCircle className="h-5 w-5 mr-2" />
            Проверить все серверы
          </Button>
        </div>

        {/* Список серверов */}
        <div className="space-y-6">
          {servers.map((server) => {
            const checkResult = checkResults[server.id];
            const isChecking = checkingServers.has(server.id);
            
            return (
              <Card key={server.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{getProtocolIcon(server.protocol)}</span>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{server.protocol}</Badge>
                            <Badge variant={server.useSSL ? "default" : "secondary"}>
                              {server.useSSL ? 'SSL/TLS' : 'Без SSL'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-gray-600 mb-4">
                        <p><strong>Хост:</strong> {server.host}:{server.port}</p>
                        <p><strong>Таймаут:</strong> {server.timeout}мс</p>
                        {server.username && <p><strong>Email:</strong> {server.username}</p>}
                      </div>

                      {/* Результат проверки */}
                      {checkResult && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={getStatusColor(checkResult.status)}>
                              {getStatusText(checkResult.status)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Время ответа: {checkResult.responseTime}мс
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(checkResult.timestamp).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          
                          {checkResult.error && (
                            <p className="text-sm text-red-600 mb-2">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              {checkResult.error}
                            </p>
                          )}
                          
                          {checkResult.banner && (
                            <p className="text-xs text-gray-600 mb-2">
                              <strong>Баннер:</strong> {checkResult.banner}
                            </p>
                          )}
                          
                          {checkResult.capabilities && checkResult.capabilities.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1"><strong>Возможности:</strong></p>
                              <div className="flex flex-wrap gap-1">
                                {checkResult.capabilities.map((cap, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      <Button
                        onClick={() => handleCheckServer(server.id)}
                        disabled={isChecking}
                        variant="outline"
                        size="lg"
                      >
                        {isChecking ? (
                          <>
                            <Clock className="h-5 w-5 mr-2 animate-spin" />
                            Проверка...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Проверить
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Информация о протоколах */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              📋 Поддерживаемые протоколы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📤</div>
                <h3 className="text-lg font-semibold mb-2">SMTP</h3>
                <p className="text-sm text-gray-600">
                  Протокол отправки почты. Стандартные порты: 25, 587, 465
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📥</div>
                <h3 className="text-lg font-semibold mb-2">IMAP</h3>
                <p className="text-sm text-gray-600">
                  Протокол получения почты. Стандартные порты: 143, 993
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📬</div>
                <h3 className="text-lg font-semibold mb-2">POP3</h3>
                <p className="text-sm text-gray-600">
                  Протокол получения почты. Стандартные порты: 110, 995
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}