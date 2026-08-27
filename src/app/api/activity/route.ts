import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    const admin = await validateSession(token || '')
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Collect unique adminIds and fetch their names
    const adminIds = [...new Set(logs.map(l => l.adminId).filter(Boolean))] as string[]
    let admins: { id: string; name: string }[] = []
    if (adminIds.length > 0) {
      admins = await db.admin.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true },
      })
    }
    const adminMap = new Map(admins.map(a => [a.id, a.name]))

    const data = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      adminName: log.adminId ? (adminMap.get(log.adminId) || 'Inconnu') : 'Système',
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Activity GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch activity' }, { status: 500 })
  }
}
