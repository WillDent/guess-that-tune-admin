# Server to Supabase Migration Specification

## Executive Summary

This document specifies modifying the current supabase project to leverage Supabase Edge Functions to maintain the API contract outlined below while gaining Supabase's managed infrastructure benefits.  This API contract is used by the iOS app to generate Apple Music developer tokens.

## API Contract Overview

### Architecture
- **Type**: Stateless REST API
- **Primary Function**: Generate JWT tokens for Apple Music API access
- Stateless, no database required for this API contract.

### API Endpoints
1. `GET /health` - Health check endpoint
2. `GET /v1/apple-music/developer-token` - Generate Apple Music developer token

## Supabase Migration Architecture

### Components to Migrate

#### 1. Edge Functions
Create two Supabase Edge Functions to replace Express endpoints:

**Function: `health-check`**
```typescript
// URL: https://[project-ref].supabase.co/functions/v1/health-check
// Method: GET
// Returns: { status: 'ok' }
```

**Function: `apple-music-token`**
```typescript
// URL: https://[project-ref].supabase.co/functions/v1/apple-music-token
// Method: GET
// Returns: { developerToken: string, expires: number }
```

#### 2. Authentication Migration

**Current**: API Key via Bearer token
**Supabase Options**:

Option A: **Supabase API Keys** (Recommended for API compatibility)
```typescript
// Use service_role or anon key with RLS policies
const { data, error } = await supabase.auth.admin.verifyApiKey(apiKey)
```

Option B: **Custom API Key Table**
```sql
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Index for fast lookups
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;
```

#### 3. Secret Management

**Apple Private Key Storage**:
```sql
-- Use Supabase Vault for secure storage
SELECT vault.create_secret(
  'apple_private_key',
  'LS0tLS1CRUdJTi...' -- Base64 encoded .p8 file content
);

-- Access in Edge Function
const privateKey = await vault.reveal('apple_private_key');
```

**Environment Variables**:
```typescript
// Edge Function environment variables
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
TOKEN_TTL_SECONDS=900
```

#### 4. Rate Limiting Implementation

**Database Schema**:
```sql
CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or API key
  endpoint TEXT NOT NULL,
  requests INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Cleanup old entries
CREATE INDEX idx_rate_limits_cleanup 
ON rate_limits(window_start) 
WHERE window_start < NOW() - INTERVAL '1 hour';
```

**Rate Limit Function**:
```typescript
async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_limit: limit,
    p_window_minutes: windowMinutes
  });
  
  return !error && data.allowed;
}
```

**PostgreSQL Function**:
```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER
) RETURNS JSON AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_request_count INTEGER;
BEGIN
  v_window_start := date_trunc('minute', NOW()) - 
    (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  INSERT INTO rate_limits (identifier, endpoint, window_start, requests)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET requests = rate_limits.requests + 1
  RETURNING requests INTO v_request_count;
  
  RETURN json_build_object(
    'allowed', v_request_count <= p_limit,
    'current', v_request_count,
    'limit', p_limit,
    'reset_at', v_window_start + (p_window_minutes * INTERVAL '1 minute')
  );
END;
$$ LANGUAGE plpgsql;
```

### Edge Function Implementation

**apple-music-token/index.ts**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { create } from 'https://deno.land/x/djwt@v2.8/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = authHeader.substring(7)
    
    // Validate API key (implement your validation logic)
    const isValid = await validateApiKey(supabase, apiKey)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    const { data: rateLimitResult } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_endpoint: 'apple-music-token',
      p_limit: 10,
      p_window_minutes: 1
    })

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          reset_at: rateLimitResult.reset_at 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Apple private key from Vault
    const { data: secretData } = await supabase.rpc('vault_reveal_secret', {
      secret_name: 'apple_private_key'
    })
    
    const privateKey = atob(secretData.decrypted_secret)
    
    // Generate JWT token
    const teamId = Deno.env.get('APPLE_TEAM_ID')!
    const keyId = Deno.env.get('APPLE_KEY_ID')!
    const ttl = parseInt(Deno.env.get('TOKEN_TTL_SECONDS') || '900')
    
    const now = Math.floor(Date.now() / 1000)
    const exp = now + ttl
    
    const payload = {
      iss: teamId,
      iat: now,
      exp: exp,
      origin: ['https://aplauseapp.com']
    }
    
    const header = {
      alg: 'ES256',
      kid: keyId
    }
    
    const token = await create(header, payload, privateKey)
    
    // Return response
    return new Response(
      JSON.stringify({
        developerToken: token,
        expires: ttl
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    )
    
  } catch (error) {
    console.error('Error generating token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validateApiKey(supabase: any, apiKey: string): Promise<boolean> {
  // Option 1: Check against api_keys table
  const hashedKey = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(apiKey)
  )
  const keyHash = btoa(String.fromCharCode(...new Uint8Array(hashedKey)))
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()
  
  if (!error && data) {
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
    
    return true
  }
  
  return false
}
```

### Database Schema

```sql
-- API Keys table
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Request logs (optional)
CREATE TABLE api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_rate_limits_cleanup ON rate_limits(window_start);
CREATE INDEX idx_request_logs_created ON api_request_logs(created_at);

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Scheduled cleanup (using pg_cron extension)
SELECT cron.schedule('cleanup-rate-limits', '*/15 * * * *', 'SELECT cleanup_rate_limits()');
```

### Security Configuration

#### Row Level Security (RLS)
```sql
-- Enable RLS on tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON api_request_logs
  FOR ALL USING (auth.role() = 'service_role');
```

#### CORS Configuration
```typescript
// In Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}
```

### Deployment Steps

1. **Setup Supabase Project**
   ```bash
   supabase init
   supabase link --project-ref [your-project-ref]
   ```

2. **Create Database Schema**
   ```bash
   supabase db push
   ```

3. **Store Secrets**
   ```bash
   # Store Apple private key in Vault
   supabase secrets set APPLE_PRIVATE_KEY_BASE64="[base64-encoded-p8-file]"
   
   # Set environment variables
   supabase secrets set APPLE_TEAM_ID="YOUR_TEAM_ID"
   supabase secrets set APPLE_KEY_ID="YOUR_KEY_ID"
   supabase secrets set TOKEN_TTL_SECONDS="900"
   ```

4. **Deploy Edge Functions**
   ```bash
   supabase functions deploy apple-music-token
   supabase functions deploy health-check
   ```

5. **Generate API Keys**
   ```sql
   -- Generate a new API key
   INSERT INTO api_keys (key_hash, name) 
   VALUES (
     encode(sha256('your-secret-api-key'::bytea), 'base64'),
     'iOS App Production'
   );
   ```

### Client Migration

Update iOS app to use new Supabase endpoints:

```swift
// Old
let tokenURL = "https://api.guessthattune.com/v1/apple-music/developer-token"

// New
let tokenURL = "https://[project-ref].supabase.co/functions/v1/apple-music-token"
```

### Monitoring and Logging

1. **Supabase Dashboard**: Monitor function invocations, errors, and performance
2. **Custom Metrics**:
   ```sql
   -- API usage by key
   SELECT 
     ak.name,
     COUNT(*) as request_count,
     COUNT(DISTINCT DATE(arl.created_at)) as active_days
   FROM api_request_logs arl
   JOIN api_keys ak ON arl.api_key_id = ak.id
   WHERE arl.created_at >= NOW() - INTERVAL '30 days'
   GROUP BY ak.name;
   ```

3. **Alerts**: Set up alerts for rate limit violations, authentication failures

### Migration Timeline

1. **Phase 1** (Week 1): Setup Supabase project, create schema
2. **Phase 2** (Week 2): Implement and test Edge Functions
3. **Phase 3** (Week 3): Update iOS app, test end-to-end
4. **Phase 4** (Week 4): Deploy to production, monitor

### Rollback Plan

1. Keep existing Node.js server running during migration
2. Use feature flags in iOS app to switch between endpoints
3. Monitor error rates and performance metrics
4. Quick rollback via DNS or load balancer if issues arise

### Cost Comparison

**Current (Self-hosted)**:
- Server hosting: ~$20-50/month
- Monitoring: ~$10/month
- SSL certificate: ~$10/month
- Total: ~$40-70/month

**Supabase**:
- Free tier: 500K function invocations/month
- Pro tier ($25/month): 2M function invocations
- Expected usage: ~100K invocations/month
- Total: $0-25/month

### Benefits of Migration

1. **Reduced Operational Overhead**: No server maintenance, automatic scaling
2. **Built-in Security**: Automatic SSL, DDoS protection, security updates
3. **Better Monitoring**: Integrated logs, metrics, and alerts
4. **Cost Efficiency**: Pay-per-use model, likely cheaper than dedicated server
5. **Global Edge Network**: Lower latency for users worldwide
6. **Integrated Ecosystem**: Easy to add database, auth, storage features later

### Risks and Mitigation

1. **Vendor Lock-in**: Mitigated by maintaining same API contract
2. **Cold Starts**: Mitigated by keeping functions warm with health checks
3. **Rate Limiting Complexity**: Mitigated by robust PostgreSQL implementation
4. **Debugging Challenges**: Mitigated by comprehensive logging

### Future Enhancements

Once migrated to Supabase, consider adding:

1. **User Authentication**: Replace API keys with Supabase Auth
2. **Analytics Dashboard**: Real-time usage statistics
3. **Webhook Support**: Notify on rate limit violations
4. **Multi-region Deployment**: Reduce latency globally
5. **Caching Layer**: Redis-compatible caching for tokens