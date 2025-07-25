// Supabase client configuration for optimal performance

export const SUPABASE_CONFIG = {
  // Connection pooling is handled by Supabase infrastructure
  // These settings optimize client-side behavior
  
  db: {
    // Use prepared statements to reduce query parsing overhead
    prepare: true,
  },
  
  auth: {
    // Persist session in cookies for SSR
    persistSession: true,
    // Auto refresh tokens before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: false,
  },
  
  global: {
    // Custom fetch implementation with timeout
    fetch: async (url: string, options: RequestInit = {}) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout
      
      try {
        // If options already has a signal, we need to handle both signals
        let signal = controller.signal
        if (options.signal) {
          // Create a composite signal that aborts when either signal aborts
          const originalSignal = options.signal as AbortSignal
          signal = AbortSignal.any([controller.signal, originalSignal])
        }
        
        const response = await fetch(url, {
          ...options,
          signal,
        })
        return response
      } finally {
        clearTimeout(timeout)
      }
    },
  },
  
  // Realtime configuration
  realtime: {
    // Only connect when needed
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Query optimization helpers
export const QUERY_OPTIONS = {
  // Default options for list queries
  list: {
    // Limit default page size
    count: 'exact' as const,
    // Use server-side counting
    head: false,
  },
  
  // Options for single item queries
  single: {
    // Throw error if not found
    throwOnError: true,
  },
}

// Connection pool settings for Edge Functions
// These are set via environment variables in production
export const EDGE_FUNCTION_POOL_CONFIG = {
  // Maximum number of connections
  POSTGRES_POOL_MAX: '20',
  // Minimum number of connections
  POSTGRES_POOL_MIN: '5',
  // Connection timeout in milliseconds
  POSTGRES_POOL_TIMEOUT: '60000',
  // Idle timeout before closing connection
  POSTGRES_POOL_IDLE_TIMEOUT: '30000',
}