'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, CheckCircle, AlertCircle, Clock, Settings, Trash2, Edit } from 'lucide-react';
import { mailService, protocolUtils, MailServer, MailCheckResult } from '@/services/mailService';

interface MailServersListProps {
  className?: string;
}

export function MailServersList({ className }: MailServersListProps) {
  const [servers, setServers] = useState<MailServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProtocol, setFilterProtocol] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [checkResults, setCheckResults] = useState<Record<string, MailCheckResult>>({});
  const [checkingServers, setCheckingServers] = useState<Set<string>>(new Set());

  // Состояние для диалога добавления/редактирования
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MailServer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    protocol: 'SMTP' as 'POP3' | 'SMTP' | 'IMAP',
    username: '',
    password: '',
    useSSL: false,
    timeout: '10000',
    description: '',
    checkInterval: '5'
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await mailService.getServers();
      setServers(response.servers);
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
      const result = await mailService.checkServer(serverId);
      setCheckResults(prev => ({ ...prev, [serverId]: result }));
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

  const handleBulkCheck = async () => {
    try {
      const results = await mailService.bulkCheck();
      const resultsMap: Record<string, MailCheckResult> = {};
      results.results.forEach(result => {
        resultsMap[result.serverId] = result;
      });
      setCheckResults(resultsMap);
    } catch (error) {
      console.error('Ошибка при массовой проверке:', error);
    }
  };

  const handleAddServer = async () => {
    try {
      const serverData = {
        ...formData,
        port: parseInt(formData.port),
        timeout: parseInt(formData.timeout),
        checkInterval: parseInt(formData.checkInterval)
      };
      
      await mailService.addServer(serverData);
      setIsDialogOpen(false);
      resetForm();
      loadServers();
    } catch (error) {
      console.error('Ошибка при добавлении сервера:', error);
    }
  };

  const handleUpdateServer = async () => {
    if (!editingServer) return;

    try {
      const serverData = {
        id: editingServer.id,
        ...formData,
        port: parseInt(formData.port),
        timeout: parseInt(formData.timeout),
        checkInterval: parseInt(formData.checkInterval)
      };
      
      await mailService.updateServer(serverData);
      setIsDialogOpen(false);
      setEditingServer(null);
      resetForm();
      loadServers();
    } catch (error) {
      console.error('Ошибка при обновлении сервера:', error);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот сервер?')) return;

    try {
      await mailService.deleteServer(serverId);
      loadServers();
    } catch (error) {
      console.error('Ошибка при удалении сервера:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '',
      protocol: 'SMTP',
      username: '',
      password: '',
      useSSL: false,
      timeout: '10000',
      description: '',
      checkInterval: '5'
    });
  };

  const openEditDialog = (server: MailServer) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      host: server.host,
      port: server.port.toString(),
      protocol: server.protocol,
      username: server.username || '',
      password: server.password || '',
      useSSL: server.useSSL,
      timeout: server.timeout.toString(),
      description: server.description || '',
      checkInterval: server.checkInterval.toString()
    });
    setIsDialogOpen(true);
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.host.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProtocol = !filterProtocol || server.protocol === filterProtocol;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && server.isActive) ||
                         (filterStatus === 'inactive' && !server.isActive);
    
    return matchesSearch && matchesProtocol && matchesStatus;
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Почтовые серверы</CardTitle>
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
          <CardTitle>Почтовые серверы ({filteredServers.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleBulkCheck} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Проверить все
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить сервер
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingServer ? 'Редактировать сервер' : 'Добавить сервер'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Gmail SMTP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="host">Хост</Label>
                    <Input
                      id="host"
                      value={formData.host}
                      onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="port">Порт</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protocol">Протокол</Label>
                      <Select value={formData.protocol} onValueChange={(value: any) => setFormData(prev => ({ ...prev, protocol: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMTP">SMTP</SelectItem>
                          <SelectItem value="IMAP">IMAP</SelectItem>
                          <SelectItem value="POP3">POP3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Email</Label>
                      <Input
                        id="username"
                        type="email"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Пароль</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="useSSL"
                      type="checkbox"
                      checked={formData.useSSL}
                      onChange={(e) => setFormData(prev => ({ ...prev, useSSL: e.target.checked }))}
                    />
                    <Label htmlFor="useSSL">Использовать SSL/TLS</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeout">Таймаут (мс)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={formData.timeout}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeout: e.target.value }))}
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkInterval">Интервал проверки (мин)</Label>
                      <Input
                        id="checkInterval"
                        type="number"
                        value={formData.checkInterval}
                        onChange={(e) => setFormData(prev => ({ ...prev, checkInterval: e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Описание сервера"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editingServer ? handleUpdateServer : handleAddServer} className="flex-1">
                      {editingServer ? 'Обновить' : 'Добавить'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingServer(null);
                      resetForm();
                    }}>
                      Отмена
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Фильтры */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск серверов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterProtocol} onValueChange={setFilterProtocol}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Протокол" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все</SelectItem>
              <SelectItem value="SMTP">SMTP</SelectItem>
              <SelectItem value="IMAP">IMAP</SelectItem>
              <SelectItem value="POP3">POP3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="inactive">Неактивные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Список серверов */}
        <div className="space-y-4">
          {filteredServers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Серверы не найдены
            </div>
          ) : (
            filteredServers.map((server) => {
              const checkResult = checkResults[server.id];
              const isChecking = checkingServers.has(server.id);
              
              return (
                <div
                  key={server.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{protocolUtils.getProtocolIcon(server.protocol)}</span>
                        <h3 className="font-medium">{server.name}</h3>
                        <Badge variant={server.isActive ? "default" : "secondary"}>
                          {server.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <Badge variant="outline">{server.protocol}</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <span>{server.host}:{server.port}</span>
                          <span>SSL: {server.useSSL ? 'Да' : 'Нет'}</span>
                          <span>Таймаут: {server.timeout}мс</span>
                          <span>Интервал: {server.checkInterval}мин</span>
                        </div>
                        {server.description && (
                          <p className="mt-1">{server.description}</p>
                        )}
                      </div>

                      {/* Результат проверки */}
                      {checkResult && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={protocolUtils.getStatusColor(checkResult.status)}>
                              {checkResult.status === 'success' ? 'Успешно' : 
                               checkResult.status === 'error' ? 'Ошибка' : 'Таймаут'}
                            </Badge>
                            <span className="text-sm">
                              Время ответа: {protocolUtils.formatResponseTime(checkResult.responseTime)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(checkResult.timestamp).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          
                          {checkResult.error && (
                            <p className="text-sm text-red-600">{checkResult.error}</p>
                          )}
                          
                          {checkResult.banner && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Баннер: {checkResult.banner}
                            </p>
                          )}
                          
                          {checkResult.capabilities && checkResult.capabilities.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-muted-foreground">Возможности: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
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

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleCheckServer(server.id)}
                        disabled={isChecking}
                        variant="outline"
                      >
                        {isChecking ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {isChecking ? 'Проверка...' : 'Проверить'}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => openEditDialog(server)}
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                        Изменить
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleDeleteServer(server.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}