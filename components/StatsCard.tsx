'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className 
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down') return <TrendingUp className="h-4 w-4 rotate-180" />;
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {trend === 'up' ? '+12%' : trend === 'down' ? '-8%' : '0%'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Специализированные карточки статистики
export function UsersStatsCard({ users, activeUsers }: { users: number; activeUsers: number }) {
  return (
    <StatsCard
      title="Пользователи"
      value={users}
      description={`${activeUsers} активных`}
      icon={<Users className="h-4 w-4" />}
      trend="up"
    />
  );
}

export function TasksStatsCard({ total, completed }: { total: number; completed: number }) {
  const percentage = Math.round((completed / total) * 100);
  
  return (
    <StatsCard
      title="Задачи"
      value={total}
      description={`${completed} завершено (${percentage}%)`}
      icon={<CheckCircle className="h-4 w-4" />}
      trend="up"
    />
  );
}

export function SystemHealthCard({ health, uptime }: { health: string; uptime: string }) {
  const getHealthColor = () => {
    switch (health) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StatsCard
      title="Состояние системы"
      value={
        <Badge className={getHealthColor()}>
          {health === 'excellent' ? 'Отлично' : 
           health === 'good' ? 'Хорошо' : 
           health === 'warning' ? 'Внимание' : 
           health === 'critical' ? 'Критично' : health}
        </Badge>
      }
      description={`Uptime: ${uptime}`}
      icon={<AlertCircle className="h-4 w-4" />}
    />
  );
}