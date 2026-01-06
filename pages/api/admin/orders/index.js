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

    // Fetch ALL UserRequests directly (the source of truth for orders)
    const requests = await withRetry(async () => {
      return prisma.userRequest.findMany({
        include: {
          pricing: true,
          payment: true,
          tracking: true,
          orders: true
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    // Format all requests as orders
    const allOrders = requests.map(request => ({
      id: request.id,
      orderId: request.orders?.[0]?.id || null,
      customerName: request.name,
      restaurantName: request.restaurantName || 'Not specified',
      address: request.address,
      status: request.status,
      totalAmount: request.pricing?.foodPrice || 0,
      estimatedTotal: request.pricing?.foodPrice || 0,
      screenshotUrl: request.cartImageUrl,
      items: [],
      createdAt: request.createdAt,
      notes: request.notes,
      cancelReason: request.cancelReason,
      cancelledAt: request.cancelledAt
    }))

    return res.status(200).json(allOrders)
  } catch (err) {
    console.error('Get admin orders error:', err)
    return res.status(503).json({ 
      error: 'Database unavailable', 
      message: 'Please try again in a moment'
    })
  }
}

export default requireAdmin(handler)
