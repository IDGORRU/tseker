import { NextRequest, NextResponse } from 'next/server';

// Типы данных
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Моковые данные (в реальном проекте здесь будет база данных)
let users: User[] = [
  {
    id: '1',
    name: 'Администратор',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Пользователь',
    email: 'user@example.com',
    role: 'user',
    createdAt: new Date()
  }
];

// GET - получить всех пользователей
export async function GET() {
  try {
    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    );
  }
}

// POST - создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role = 'user' } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Имя и email обязательны' },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      createdAt: new Date()
    };

    users.push(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при создании пользователя' },
      { status: 500 }
    );
  }
}