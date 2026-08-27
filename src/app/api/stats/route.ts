import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Unauthorized', 401)

    const admin = await validateSession(token)
    if (!admin) return err('Unauthorized', 401)

    const [
      totalProducts,
      totalOrders,
      totalRevenueResult,
      uniqueCustomersResult,
      recentOrders,
      lowStockProducts,
      unreadMessagesCount,
      totalEmails,
      ordersByStatus,
      recentActivity,
      unreadContactCount,
      pendingOrdersCount,
      monthlyRevenueResult,
    ] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
      db.order.aggregate({
        where: { status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
      }),
      db.order.groupBy({
        by: ['customerEmail'],
      }),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { items: true },
      }),
      db.product.findMany({
        where: {
          stockQty: { lte: db.product.fields.minStockAlert },
          isActive: true,
        },
        include: { category: true },
        orderBy: { stockQty: 'asc' },
      }),
      db.message.count({
        where: { isAdminRead: false, senderType: 'customer' },
      }),
      db.emailSubscriber.count({ where: { isActive: true } }),
      db.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.contactSubmission.count({ where: { isRead: false } }),
      db.order.count({ where: { status: 'pending' } }),
      db.order.aggregate({
        where: {
          status: { not: 'cancelled' },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { totalAmount: true },
      }),
    ])

    const totalRevenue = totalRevenueResult._sum.totalAmount ?? 0
    const monthlyRevenue = monthlyRevenueResult._sum.totalAmount ?? 0
    const totalCustomers = uniqueCustomersResult.length

    const statusMap: Record<string, number> = {}
    for (const item of ordersByStatus) {
      statusMap[item.status] = item._count
    }

    return ok({
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      totalCustomers,
      recentOrders,
      lowStockProducts,
      unreadMessages: unreadMessagesCount,
      totalEmails,
      ordersByStatus: statusMap,
      recentActivity,
      unreadContactCount,
      pendingOrdersCount,
    })
  } catch (error) {
    console.error('Stats GET error:', error)
    return err('Failed to fetch stats', 500)
  }
}