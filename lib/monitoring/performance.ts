import { createServerClient } from '@/lib/supabase/server'

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private enabled: boolean = process.env.NODE_ENV === 'development'

  async measureQuery<T>(
    name: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return queryFn()
    }

    const start = performance.now()
    try {
      const result = await queryFn()
      const duration = Math.round(performance.now() - start)
      
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata
      })

      // Log slow queries in development
      if (duration > 100) {
        console.warn(`⚠️ Slow query: ${name} took ${duration}ms`, metadata)
      }

      return result
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      console.error(`❌ Query failed: ${name} after ${duration}ms`, error)
      throw error
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics.shift()
    }
  }

  getMetrics() {
    return [...this.metrics]
  }

  getAverageQueryTime(name?: string) {
    const relevantMetrics = name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics
    
    if (relevantMetrics.length === 0) return 0
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0)
    return Math.round(total / relevantMetrics.length)
  }

  getSlowestQueries(limit = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  reset() {
    this.metrics = []
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor()

// Helper function for measuring Supabase queries
export async function measureSupabaseQuery<T>(
  name: string,
  table: string,
  queryBuilder: (client: any) => any
): Promise<T> {
  const supabase = await createServerClient()
  
  return perfMonitor.measureQuery(
    `${table}.${name}`,
    async () => {
      const result = await queryBuilder(supabase)
      if (result.error) throw result.error
      return result.data
    },
    { table, operation: name }
  )
}

// Web Vitals collection
export function reportWebVitals(metric: any) {
  const { name, value, id } = metric
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital: ${name}`, {
      value: Math.round(value),
      id
    })
  }
  
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify({ name, value, id })
    // })
  }
}