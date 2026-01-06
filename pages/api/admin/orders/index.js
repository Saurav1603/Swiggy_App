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

    // Find orders assigned to this admin OR orders without assignment (legacy)
    const orders = await withRetry(async () => {
      return prisma.order.findMany({
        where: {
          OR: [
            { assignedAdminId: adminId },
            { assignedAdminId: null } // Include unassigned/legacy orders
          ]
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

    // Also fetch UserRequests that don't have any Order (legacy requests)
    const requestsWithoutOrders = await withRetry(async () => {
      return prisma.userRequest.findMany({
        where: {
          orders: { none: {} } // Requests without any Order record
        },
        include: {
          pricing: true,
          payment: true,
          tracking: true
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    // Format orders from Order table
    const formattedOrders = orders
      .filter(order => order.request)
      .map(order => ({
        id: order.request.id,
        orderId: order.id,
        customerName: order.request.name,
        restaurantName: order.request.restaurantName || 'Not specified',
        address: order.request.address,
        status: order.request.status,
        totalAmount: order.request.pricing?.foodPrice || 0,
        estimatedTotal: order.request.pricing?.foodPrice || 0,
        screenshotUrl: order.request.cartImageUrl,
        items: [],
        createdAt: order.createdAt,
        notes: order.request.notes
      }))

    // Format legacy requests (without Order records)
    const legacyOrders = requestsWithoutOrders.map(request => ({
      id: request.id,
      orderId: null,
      customerName: request.name,
      restaurantName: request.restaurantName || 'Not specified',
      address: request.address,
      status: request.status,
      totalAmount: request.pricing?.foodPrice || 0,
      estimatedTotal: request.pricing?.foodPrice || 0,
      screenshotUrl: request.cartImageUrl,
      items: [],
      createdAt: request.createdAt,
      notes: request.notes
    }))

    // Combine and sort by createdAt
    const allOrders = [...formattedOrders, ...legacyOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

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
