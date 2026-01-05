import prisma from '../../../lib/prisma';
import { getAdminFromRequest } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') return res.status(405).end();
  
  // Get admin ID from token
  const admin = getAdminFromRequest(req);
  const adminId = admin?.id;

  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get orders assigned to this admin
  const adminOrders = await prisma.order.findMany({
    where: { assignedAdminId: adminId },
    include: { 
      request: { 
        include: { pricing: true } 
      } 
    }
  });

  // Filter delivered orders for this admin
  const delivered = adminOrders.filter(o => o.request?.status === 'DELIVERED');
  const totalEarnings = delivered.reduce((sum, o) => sum + (o.request?.pricing?.total || 0), 0);
  
  // Count by status for this admin
  const deliveredCount = delivered.length;
  const pendingCount = adminOrders.filter(o => o.request?.status !== 'DELIVERED').length;
  
  // Recent orders for this admin
  const recentOrders = adminOrders
    .filter(o => o.request)
    .sort((a, b) => new Date(b.request.createdAt) - new Date(a.request.createdAt))
    .slice(0, 5)
    .map(o => ({
      id: o.request.id,
      name: o.request.name,
      status: o.request.status,
      total: o.request.pricing?.total || 0,
    }));

  res.json({
    totalEarnings,
    deliveredCount,
    pendingCount,
    recentOrders,
  });
}
