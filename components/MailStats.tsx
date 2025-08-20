'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Server, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  Activity,
  RefreshCw
} from 'lucide-react';
import { mailService, protocolUtils } from '@/services/mailService';

interface MailStatsProps {
  className?: string;
}

export function MailStats({ className }: MailStatsProps) {
  const [stats, setStats] = useState({
    totalServers: 0,
    activeServers: 0,
    inactiveServers: 0,
    smtpServers: 0,
    imapServers: 0,
    pop3Servers: 0,
    sslServers: 0,
    nonSslServers: 0,
    lastCheck: null as Date | null,
    checkResults: {
      success: 0,
      error: 0,
      timeout: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await mailService.getServers();
      
      const servers = response.servers;
      const newStats = {
        totalServers: servers.length,
        activeServers: servers.filter(s => s.isActive).length,
        inactiveServers: servers.filter(s => !s.isActive).length,
        smtpServers: servers.filter(s => s.protocol === 'SMTP').length,
        imapServers: servers.filter(s => s.protocol === 'IMAP').length,
        pop3Servers: servers.filter(s => s.protocol === 'POP3').length,
        sslServers: servers.filter(s => s.useSSL).length,
        nonSslServers: servers.filter(s => !s.useSSL).length,
        lastCheck: null,
        checkResults: {
          success: 0,
          error: 0,
          timeout: 0
        }
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getProtocolStats = () => {
    const total = stats.totalServers;
    if (total === 0) return [];
    
    return [
      { protocol: 'SMTP', count: stats.smtpServers, percentage: (stats.smtpServers / total) * 100, color: 'bg-blue-500' },
      { protocol: 'IMAP', count: stats.imapServers, percentage: (stats.imapServers / total) * 100, color: 'bg-green-500' },
      { protocol: 'POP3', count: stats.pop3Servers, percentage: (stats.pop3Servers / total) * 100, color: 'bg-purple-500' }
    ];
  };

  const getSSLStats = () => {
    const total = stats.totalServers;
    if (total === 0) return [];
    
    return [
      { type: 'SSL/TLS', count: stats.sslServers, percentage: (stats.sslServers / total) * 100, color: 'bg-green-500' },
      { type: 'Без SSL', count: stats.nonSslServers, percentage: (stats.nonSslServers / total) * 100, color: 'bg-yellow-500' }
    ];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Статистика почтовых серверов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Статистика почтовых серверов</CardTitle>
          <Button onClick={refreshStats} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Общая статистика */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalServers}</div>
              <div className="text-sm text-muted-foreground">Всего серверов</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Активных</span>
                <Badge variant="default">{stats.activeServers}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Неактивных</span>
                <Badge variant="secondary">{stats.inactiveServers}</Badge>
              </div>
            </div>
          </div>

          {/* Статистика по протоколам */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.smtpServers + stats.imapServers + stats.pop3Servers}</div>
              <div className="text-sm text-muted-foreground">По протоколам</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>SMTP</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats.smtpServers}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>IMAP</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats.imapServers}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>POP3</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {stats.pop3Servers}
                </Badge>
              </div>
            </div>
          </div>

          {/* Статистика SSL */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.sslServers}</div>
              <div className="text-sm text-muted-foreground">SSL/TLS серверов</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>С SSL</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats.sslServers}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Без SSL</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {stats.nonSslServers}
                </Badge>
              </div>
            </div>
          </div>

          {/* Последняя проверка */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.lastCheck ? '✓' : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Последняя проверка</div>
            </div>
            
            {stats.lastCheck && (
              <div className="text-xs text-center text-muted-foreground">
                {stats.lastCheck.toLocaleString('ru-RU')}
              </div>
            )}
          </div>
        </div>

        {/* Графики распределения */}
        <div className="mt-8 space-y-6">
          {/* Распределение по протоколам */}
          <div>
            <h3 className="text-lg font-medium mb-4">Распределение по протоколам</h3>
            <div className="space-y-3">
              {getProtocolStats().map((stat) => (
                <div key={stat.protocol} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{protocolUtils.getProtocolIcon(stat.protocol)}</span>
                      {stat.protocol}
                    </span>
                    <span className="font-medium">{stat.count} ({stat.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Распределение по SSL */}
          <div>
            <h3 className="text-lg font-medium mb-4">Распределение по SSL/TLS</h3>
            <div className="space-y-3">
              {getSSLStats().map((stat) => (
                <div key={stat.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {stat.type}
                    </span>
                    <span className="font-medium">{stat.count} ({stat.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Статус активности */}
          <div>
            <h3 className="text-lg font-medium mb-4">Статус активности</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.activeServers}</div>
                <div className="text-sm text-green-700">Активные серверы</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.inactiveServers}</div>
                <div className="text-sm text-gray-700">Неактивные серверы</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}