import prisma, { withRetry } from '../../../../../lib/prisma';
import { requireAdmin } from '../../../../../lib/adminAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { reason } = req.body;
  const adminId = req.admin?.id;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'Cancellation reason is required' });
  }

  try {
    // Verify the order belongs to this admin
    const order = await withRetry(async () => {
      return prisma.order.findFirst({
        where: {
          requestId: id,
          assignedAdminId: adminId
        },
        include: { request: true }
      });
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    // Check if order can be cancelled
    if (order.request.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Cannot cancel a delivered order' });
    }

    if (order.request.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // Update the request status to CANCELLED and store the reason
    await withRetry(async () => {
      return prisma.userRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelReason: reason.trim(),
          cancelledAt: new Date(),
          cancelledBy: adminId
        }
      });
    });

    // Update the order status
    await withRetry(async () => {
      return prisma.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' }
      });
    });

    return res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
}

export default requireAdmin(handler);
