'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckSquare, 
  Activity, 
  Server, 
  Database, 
  Shield,
  Settings,
  BarChart3,
  Clock,
  AlertCircle
} from 'lucide-react';
import { StatsCard, UsersStatsCard, TasksStatsCard, SystemHealthCard } from '@/components/StatsCard';
import { TasksList } from '@/components/TasksList';
import { UsersList } from '@/components/UsersList';
import { statsAPI, Stats } from '@/services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsAPI.get();
      setStats(data);
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const systemMetrics = [
    {
      title: 'CPU',
      value: '23%',
      status: 'normal',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Память',
      value: '67%',
      status: 'warning',
      icon: Database,
      color: 'text-yellow-600'
    },
    {
      title: 'Диск',
      value: '45%',
      status: 'normal',
      icon: Server,
      color: 'text-green-600'
    },
    {
      title: 'Сеть',
      value: '89%',
      status: 'normal',
      icon: Activity,
      color: 'text-green-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: 'Новый пользователь зарегистрирован',
      user: 'user@example.com',
      time: '2 минуты назад',
      type: 'user'
    },
    {
      id: 2,
      action: 'Задача "Тестирование API" завершена',
      user: 'admin@example.com',
      time: '15 минут назад',
      type: 'task'
    },
    {
      id: 3,
      action: 'Система обновлена',
      user: 'system',
      time: '1 час назад',
      type: 'system'
    },
    {
      id: 4,
      action: 'Новая задача создана',
      user: 'user@example.com',
      time: '2 часа назад',
      type: 'task'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'task': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Загрузка дашборда...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Заголовок */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Серверное приложение</h1>
              <p className="text-muted-foreground mt-2">
                Панель управления и мониторинг системы
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Сервер активен
              </Badge>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats && (
            <>
              <UsersStatsCard users={stats.totalUsers} activeUsers={stats.activeUsers} />
              <TasksStatsCard total={stats.totalTasks} completed={stats.completedTasks} />
              <SystemHealthCard health={stats.systemHealth} uptime={stats.uptime} />
              <StatsCard
                title="Активность"
                value="89%"
                description="Высокая активность"
                icon={<BarChart3 className="h-4 w-4" />}
                trend="up"
              />
            </>
          )}
        </div>

        {/* Метрики системы */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {systemMetrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: metric.value }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Основной контент */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Последние действия */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Последние действия
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{activity.user}</span>
                            <span>•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Состояние системы */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Состояние системы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Веб-сервер</span>
                      <Badge className="bg-green-100 text-green-800">Активен</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">База данных</span>
                      <Badge className="bg-green-100 text-green-800">Подключена</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Кэш</span>
                      <Badge className="bg-green-100 text-green-800">Работает</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Файловое хранилище</span>
                      <Badge className="bg-green-100 text-green-800">Доступно</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UsersList />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TasksList />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Мониторинг в реальном времени
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Мониторинг в разработке</h3>
                  <p className="text-muted-foreground">
                    Здесь будет отображаться график производительности системы в реальном времени
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
