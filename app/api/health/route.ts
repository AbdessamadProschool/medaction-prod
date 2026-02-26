import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Used by:
 * - Docker HEALTHCHECK
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Monitoring systems
 */
export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    checks: {
      database: { status: 'unknown' as string, latency: 0 },
      memory: { status: 'ok' as string, used: 0, total: 0, percentage: 0 },
    }
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    health.checks.database = {
      status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'slow' : 'degraded',
      latency: dbLatency,
    };
    
    if (dbLatency > 500) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = {
      status: 'disconnected',
      latency: -1,
    };
    health.status = 'unhealthy';
  }

  // Memory health check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memPercentage = Math.round((memUsedMB / memTotalMB) * 100);
  
  health.checks.memory = {
    status: memPercentage < 80 ? 'ok' : memPercentage < 90 ? 'warning' : 'critical',
    used: memUsedMB,
    total: memTotalMB,
    percentage: memPercentage,
  };
  
  if (memPercentage >= 90) {
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const responseTime = Date.now() - startTime;

  // Determine HTTP status code
  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json({
    ...health,
    responseTime: `${responseTime}ms`,
  }, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
    }
  });
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
