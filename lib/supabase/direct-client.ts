// Direct Supabase client that bypasses the SDK
export class DirectSupabaseClient {
  constructor(
    private url: string,
    private anonKey: string
  ) {}

  from(table: string) {
    const query = {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const queryUrl = `${this.url}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`
            
            try {
              const response = await fetch(queryUrl, {
                headers: {
                  'apikey': this.anonKey,
                  'Authorization': `Bearer ${this.anonKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                }
              })
              
              if (!response.ok) {
                const error = await response.text()
                return { data: null, error: { message: error, status: response.status } }
              }
              
              const data = await response.json()
              return { data: data[0] || null, error: null }
            } catch (err) {
              return { data: null, error: err }
            }
          }
        })
      })
    }
    
    return query
  }
}

export function createDirectClient() {
  return new DirectSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}