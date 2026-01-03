// GET /api/manager/admins/[id] - Get single admin details
// PATCH /api/manager/admins/[id] - Update admin status or info
// DELETE /api/manager/admins/[id] - Delete admin
import prisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Admin ID required' })
  }

  if (req.method === 'GET') {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          assignedOrders: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true,
              status: true,
              createdAt: true,
              request: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  pricing: { select: { total: true } }
                }
              }
            }
          },
          declines: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              createdAt: true,
              order: {
                select: {
                  id: true,
                  request: { select: { name: true } }
                }
              }
            }
          }
        }
      })

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' })
      }

      return res.status(200).json(admin)
    } catch (err) {
      console.error('Get admin error:', err)
      return res.status(500).json({ error: 'Server error' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { status, name } = req.body || {}
      const updateData = {}

      if (status && ['available', 'busy', 'offline'].includes(status)) {
        updateData.status = status
      }
      if (name && name.trim().length >= 2) {
        updateData.name = name.trim()
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const admin = await prisma.admin.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, status: true }
      })

      return res.status(200).json({ message: 'Admin updated', admin })
    } catch (err) {
      console.error('Update admin error:', err)
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Admin not found' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      // First delete related records
      await prisma.orderDecline.deleteMany({ where: { adminId: id } })
      
      // Update orders to remove admin reference
      await prisma.order.updateMany({
        where: { assignedAdminId: id },
        data: { assignedAdminId: null }
      })

      // Delete admin
      await prisma.admin.delete({ where: { id } })

      return res.status(200).json({ message: 'Admin deleted' })
    } catch (err) {
      console.error('Delete admin error:', err)
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Admin not found' })
      }
      return res.status(500).json({ error: 'Server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
