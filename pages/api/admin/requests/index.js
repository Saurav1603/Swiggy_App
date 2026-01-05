import prisma, { withRetry } from '../../../../lib/prisma'
import { requireAdmin } from '../../../../lib/adminAuth'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { status } = req.query
    const adminId = req.admin?.id // Get admin ID from JWT token

    if (!adminId) {
      return res.status(401).json({ error: 'Admin ID not found in token' })
    }

    // Build where clause - only show orders assigned to this admin
    const where = { status }
    
    // Find orders assigned to this admin, then get associated requests
    const orders = await withRetry(async () => {
      return prisma.order.findMany({
        where: {
          assignedAdminId: adminId,
          ...(status && { 
            request: { status } 
          })
        },
        include: {
          request: {
            include: { pricing: true, payment: true, tracking: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    })

    // Extract the requests from orders
    const requests = orders
      .filter(order => order.request) // Ensure request exists
      .map(order => ({
        ...order.request,
        orderId: order.id,
        orderStatus: order.status
      }))

    return res.status(200).json(requests)
  } catch (err) {
    console.error('Get admin requests error:', err)
    return res.status(503).json({ 
      error: 'Database unavailable', 
      message: 'Please try again in a moment'
    })
  }
}

export default requireAdmin(handler)
