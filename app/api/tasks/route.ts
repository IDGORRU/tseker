import { NextRequest, NextResponse } from 'next/server';

// Типы данных
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Моковые данные
let tasks: Task[] = [
  {
    id: '1',
    title: 'Создать API',
    description: 'Разработать REST API для приложения',
    status: 'completed',
    priority: 'high',
    assignedTo: 'admin@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Тестирование',
    description: 'Написать тесты для всех компонентов',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'user@example.com',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20')
  }
];

// GET - получить все задачи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let filteredTasks = tasks;

    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }

    return NextResponse.json({ 
      tasks: filteredTasks, 
      count: filteredTasks.length,
      total: tasks.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении задач' },
      { status: 500 }
    );
  }
}

// POST - создать новую задачу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = 'medium', assignedTo } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Заголовок и описание обязательны' },
        { status: 400 }
      );
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status: 'pending',
      priority,
      assignedTo,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    tasks.push(newTask);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при создании задачи' },
      { status: 500 }
    );
  }
}