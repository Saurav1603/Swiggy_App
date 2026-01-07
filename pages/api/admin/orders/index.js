import prisma, { withRetry } from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const adminId = req.admin?.id

    if (!adminId) {
      return res.status(401).json({ error: 'Admin ID not found in token' })
    }

    // Fetch orders assigned to THIS admin only
    const orders = await withRetry(async () => {
      return prisma.order.findMany({
        where: {
          assignedAdminId: adminId
        },
        include: {
          request: {
            include: {
              pricing: true,
              payment: true,
              tracking: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    // Format orders for the frontend
    const adminOrders = orders
      .filter(order => order.request)
      .map(order => ({
        id: order.request.id,
        orderId: order.id,
        customerName: order.request.name,
        restaurantName: 'Food Order',
        address: order.request.address,
        status: order.request.status,
        totalAmount: order.request.pricing?.foodPrice || 0,
        estimatedTotal: order.request.pricing?.foodPrice || 0,
        screenshotUrl: order.request.cartImageUrl,
        items: [],
        createdAt: order.createdAt,
        notes: order.request.notes,
        cancelReason: order.request.cancelReason,
        cancelledAt: order.request.cancelledAt
      }))

    return res.status(200).json(adminOrders)
  } catch (err) {
    console.error('Get admin orders error:', err)
    return res.status(503).json({ 
      error: 'Database unavailable', 
      message: 'Please try again in a moment'
    })
  }
}

export default requireAdmin(handler)
