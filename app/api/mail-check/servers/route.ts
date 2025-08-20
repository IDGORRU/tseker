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
  description?: string;
  isActive: boolean;
  lastCheck?: Date;
  checkInterval: number; // в минутах
}

// Глобальное хранилище серверов (в реальном проекте - база данных)
let mailServers: MailServer[] = [
  {
    id: '1',
    name: 'Gmail SMTP',
    host: 'smtp.gmail.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@gmail.com',
    useSSL: false,
    timeout: 10000,
    description: 'Gmail SMTP сервер для отправки почты',
    isActive: true,
    checkInterval: 5
  },
  {
    id: '2',
    name: 'Gmail IMAP',
    host: 'imap.gmail.com',
    port: 993,
    protocol: 'IMAP',
    username: 'test@gmail.com',
    useSSL: true,
    timeout: 10000,
    description: 'Gmail IMAP сервер для получения почты',
    isActive: true,
    checkInterval: 5
  },
  {
    id: '3',
    name: 'Gmail POP3',
    host: 'pop.gmail.com',
    port: 995,
    protocol: 'POP3',
    username: 'test@gmail.com',
    useSSL: true,
    timeout: 10000,
    description: 'Gmail POP3 сервер для получения почты',
    isActive: true,
    checkInterval: 5
  },
  {
    id: '4',
    name: 'Outlook SMTP',
    host: 'smtp-mail.outlook.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@outlook.com',
    useSSL: false,
    timeout: 10000,
    description: 'Outlook SMTP сервер для отправки почты',
    isActive: true,
    checkInterval: 10
  },
  {
    id: '5',
    name: 'Yahoo SMTP',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    protocol: 'SMTP',
    username: 'test@yahoo.com',
    useSSL: false,
    timeout: 10000,
    description: 'Yahoo SMTP сервер для отправки почты',
    isActive: true,
    checkInterval: 15
  }
];

// GET - получить все серверы
export async function GET() {
  try {
    return NextResponse.json({ 
      servers: mailServers,
      count: mailServers.length,
      activeCount: mailServers.filter(s => s.isActive).length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении серверов' },
      { status: 500 }
    );
  }
}

// POST - добавить новый сервер
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, host, port, protocol, username, password, useSSL, timeout, description, checkInterval } = body;

    // Валидация
    if (!name || !host || !port || !protocol) {
      return NextResponse.json(
        { error: 'Имя, хост, порт и протокол обязательны' },
        { status: 400 }
      );
    }

    if (!['POP3', 'SMTP', 'IMAP'].includes(protocol)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый протокол. Используйте POP3, SMTP или IMAP' },
        { status: 400 }
      );
    }

    if (port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Порт должен быть в диапазоне 1-65535' },
        { status: 400 }
      );
    }

    // Проверка на дубликаты
    const existingServer = mailServers.find(s => 
      s.host === host && s.port === port && s.protocol === protocol
    );

    if (existingServer) {
      return NextResponse.json(
        { error: 'Сервер с таким хостом, портом и протоколом уже существует' },
        { status: 409 }
      );
    }

    const newServer: MailServer = {
      id: Date.now().toString(),
      name,
      host,
      port,
      protocol,
      username,
      password,
      useSSL: useSSL || false,
      timeout: timeout || 10000,
      description: description || '',
      isActive: true,
      checkInterval: checkInterval || 5
    };

    mailServers.push(newServer);

    return NextResponse.json(newServer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при создании сервера' },
      { status: 500 }
    );
  }
}

// PUT - обновить сервер
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID сервера обязателен' },
        { status: 400 }
      );
    }

    const serverIndex = mailServers.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'Сервер не найден' },
        { status: 404 }
      );
    }

    // Обновляем сервер
    mailServers[serverIndex] = {
      ...mailServers[serverIndex],
      ...updateData,
      id // ID не изменяется
    };

    return NextResponse.json(mailServers[serverIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при обновлении сервера' },
      { status: 500 }
    );
  }
}

// DELETE - удалить сервер
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID сервера обязателен' },
        { status: 400 }
      );
    }

    const serverIndex = mailServers.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return NextResponse.json(
        { error: 'Сервер не найден' },
        { status: 404 }
      );
    }

    const deletedServer = mailServers.splice(serverIndex, 1)[0];

    return NextResponse.json({ 
      message: 'Сервер успешно удален',
      deletedServer 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при удалении сервера' },
      { status: 500 }
    );
  }
}