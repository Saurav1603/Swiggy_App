// GET /api/manager/requests - List all requests with filters
import prisma from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { status, search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}

    // Filter by status
    if (status && status !== 'all') {
      where.status = status
    }

    // Search by name or phone
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { id: { contains: search } }
      ]
    }

    const [requests, total] = await Promise.all([
      prisma.userRequest.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          createdAt: true,
          notes: true,
          remarks: true,
          pricing: {
            select: {
              foodPrice: true,
              deliveryFee: true,
              platformFee: true,
              serviceCharge: true,
              total: true
            }
          },
          payment: {
            select: {
              utrNumber: true,
              paidAt: true,
              verified: true
            }
          },
          tracking: {
            select: {
              trackingUrl: true,
              eta: true,
              partnerName: true
            }
          },
          orders: {
            select: {
              id: true,
              status: true,
              assignedAdmin: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      }),
      prisma.userRequest.count({ where })
    ])

    return res.status(200).json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (err) {
    console.error('Get requests error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
