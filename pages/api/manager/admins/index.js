// GET /api/manager/admins - List all admins with their stats
// PATCH /api/manager/admins - Update admin (for bulk operations)
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const admins = await prisma.admin.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          assignedOrders: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          },
          declines: {
            select: { id: true }
          }
        }
      })

      // Calculate stats for each admin
      const adminsWithStats = admins.map(admin => {
        const completedOrders = admin.assignedOrders.filter(o => o.status === 'completed').length
        const activeOrders = admin.assignedOrders.filter(o => ['accepted', 'in_progress'].includes(o.status)).length
        const totalOrders = admin.assignedOrders.length
        const declineCount = admin.declines.length

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          status: admin.status,
          createdAt: admin.createdAt,
          stats: {
            completedOrders,
            activeOrders,
            totalOrders,
            declineCount
          }
        }
      })

      return res.status(200).json(adminsWithStats)
    } catch (err) {
      console.error('Get admins error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
