import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') return res.status(405).end();
  // Get total earnings (sum of delivered orders)
  const delivered = await prisma.userRequest.findMany({
    where: { status: 'DELIVERED' },
    include: { pricing: true },
  });
  const totalEarnings = delivered.reduce((sum, r) => sum + (r.pricing?.total || 0), 0);
  // Count by status
  const deliveredCount = delivered.length;
  const pendingCount = await prisma.userRequest.count({ where: { status: { not: 'DELIVERED' } } });
  // Recent orders
  const recentOrders = await prisma.userRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { pricing: true },
  });
  res.json({
    totalEarnings,
    deliveredCount,
    pendingCount,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      name: o.name,
      status: o.status,
      total: o.pricing?.total || 0,
    })),
  });
}
