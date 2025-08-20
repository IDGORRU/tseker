import { NextResponse } from 'next/server';

// GET - получить статистику
export async function GET() {
  try {
    // В реальном проекте здесь будет запрос к базе данных
    const stats = {
      totalUsers: 156,
      activeUsers: 89,
      totalTasks: 342,
      completedTasks: 198,
      pendingTasks: 89,
      inProgressTasks: 55,
      systemHealth: 'excellent',
      uptime: '99.9%',
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}