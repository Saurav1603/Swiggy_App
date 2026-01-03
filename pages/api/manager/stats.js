// GET /api/manager/stats - Get dashboard statistics
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get admin stats
    const [
      totalAdmins,
      availableAdmins,
      busyAdmins,
      offlineAdmins,
      totalRequests,
      pendingRequests,
      completedRequests,
      todayRequests,
      totalRevenue
    ] = await Promise.all([
      prisma.admin.count(),
      prisma.admin.count({ where: { status: 'available' } }),
      prisma.admin.count({ where: { status: 'busy' } }),
      prisma.admin.count({ where: { status: 'offline' } }),
      prisma.userRequest.count(),
      prisma.userRequest.count({ where: { status: { in: ['WAITING_FOR_PRICE', 'PRICE_SENT', 'PAYMENT_PENDING'] } } }),
      prisma.userRequest.count({ where: { status: 'DELIVERED' } }),
      prisma.userRequest.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.pricing.aggregate({
        _sum: { total: true },
        where: {
          request: { status: 'DELIVERED' }
        }
      })
    ])

    // Get recent activity (last 10 requests)
    const recentRequests = await prisma.userRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        pricing: { select: { total: true } }
      }
    })

    // Get admin performance (orders completed per admin)
    const adminPerformance = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        assignedOrders: {
          where: { status: 'completed' },
          select: { id: true }
        }
      }
    })

    return res.status(200).json({
      admins: {
        total: totalAdmins,
        available: availableAdmins,
        busy: busyAdmins,
        offline: offlineAdmins
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        completed: completedRequests,
        today: todayRequests
      },
      revenue: {
        total: totalRevenue._sum.total || 0
      },
      recentRequests,
      adminPerformance: adminPerformance.map(a => ({
        ...a,
        completedOrders: a.assignedOrders.length
      }))
    })
  } catch (err) {
    console.error('Manager stats error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
