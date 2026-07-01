import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';

export const notificationService = {
  async create(input: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    message: string;
    link?: string;
  }) {
    return prisma.notification
      .create({ data: input })
      .catch(() => undefined); // best-effort
  },

  async list(userId: string, page: PageParams) {
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.limit,
        include: { actor: { select: { id: true, username: true, name: true, avatarUrl: true } } },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);
    return { items, meta: { ...buildPageMeta(total, page), unread } };
  },

  async markRead(userId: string, id: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) throw AppError.notFound('Notification not found');
    return prisma.notification.update({ where: { id }, data: { read: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },
};
