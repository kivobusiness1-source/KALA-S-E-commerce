import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {}

  // Check database connectivity
  try {
    const { db } = await import('@/lib/db')
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database unreachable',
    }
  }

  // Check uploads directory
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.access(uploadsDir)
    checks.uploads = { status: 'ok' }
  } catch {
    checks.uploads = { status: 'error', error: 'Uploads directory not accessible' }
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok')
  const totalLatency = Date.now() - startTime

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latency: totalLatency,
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
