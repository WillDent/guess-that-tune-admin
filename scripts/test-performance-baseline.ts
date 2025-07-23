import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

interface PerformanceResult {
  query: string
  duration: number
  rowCount: number
}

const results: PerformanceResult[] = []

async function measureQuery(
  name: string,
  queryFn: () => any
): Promise<void> {
  const start = performance.now()
  const result = await queryFn()
  const duration = performance.now() - start
  
  if (result.error) {
    console.log(`❌ ${name}: Error - ${result.error.message}`)
    return
  }
  
  const rowCount = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0)
  results.push({ query: name, duration, rowCount })
  console.log(`✅ ${name}: ${duration.toFixed(2)}ms (${rowCount} rows)`)
}

async function runPerformanceTests() {
  console.log('🚀 Performance Baseline Tests')
  console.log('==============================\n')
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  // Sign in as regular user for authenticated tests
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'will.dent@gmail.com',
    password: 'odessa99'
  })
  
  if (!authData.user) {
    console.error('Failed to authenticate')
    return
  }
  
  console.log('📊 Running authenticated queries...\n')
  
  // Test 1: Simple user profile fetch
  await measureQuery('Fetch own user profile', () =>
    supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()
  )
  
  // Test 2: Fetch user's question sets
  await measureQuery('Fetch own question sets', () =>
    supabase
      .from('question_sets')
      .select('*')
      .eq('user_id', authData.user.id)
  )
  
  // Test 3: Fetch public question sets
  await measureQuery('Fetch public question sets', () =>
    supabase
      .from('question_sets')
      .select('*')
      .eq('is_public', true)
      .limit(50)
  )
  
  // Test 4: Complex join - question sets with categories
  await measureQuery('Fetch question sets with categories', () =>
    supabase
      .from('question_sets')
      .select(`
        *,
        question_set_categories (
          category_id,
          categories (
            id,
            name
          )
        )
      `)
      .eq('is_public', true)
      .limit(20)
  )
  
  // Test 5: Fetch questions for a question set
  await measureQuery('Fetch questions with full details', () =>
    supabase
      .from('questions')
      .select('*')
      .limit(50)
  )
  
  // Test 6: User's favorites
  await measureQuery('Fetch user favorites', () =>
    supabase
      .from('favorites')
      .select(`
        *,
        question_sets (
          id,
          name,
          description
        )
      `)
      .eq('user_id', authData.user.id)
  )
  
  // Test 7: Games with participants
  await measureQuery('Fetch games with participants', () =>
    supabase
      .from('games')
      .select(`
        *,
        game_participants (
          id,
          user_id,
          score
        )
      `)
      .or(`host_user_id.eq.${authData.user.id},id.in.(select game_id from game_participants where user_id='${authData.user.id}')`)
      .limit(10)
  )
  
  // Sign out for public tests
  await supabase.auth.signOut()
  
  console.log('\n📊 Running public/unauthenticated queries...\n')
  
  // Test 8: Public question sets (unauthenticated)
  await measureQuery('Fetch public question sets (unauth)', () =>
    supabase
      .from('question_sets')
      .select('*')
      .eq('is_public', true)
      .limit(50)
  )
  
  // Test 9: Search question sets
  await measureQuery('Search public question sets', () =>
    supabase
      .from('question_sets')
      .select('*')
      .eq('is_public', true)
      .ilike('name', '%music%')
      .limit(20)
  )
  
  console.log('\n📈 Performance Summary')
  console.log('======================\n')
  
  // Calculate statistics
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = totalDuration / results.length
  const slowestQuery = results.reduce((max, r) => r.duration > max.duration ? r : max)
  const fastestQuery = results.reduce((min, r) => r.duration < min.duration ? r : min)
  
  console.log(`Total queries: ${results.length}`)
  console.log(`Total time: ${totalDuration.toFixed(2)}ms`)
  console.log(`Average query time: ${avgDuration.toFixed(2)}ms`)
  console.log(`Fastest query: ${fastestQuery.query} (${fastestQuery.duration.toFixed(2)}ms)`)
  console.log(`Slowest query: ${slowestQuery.query} (${slowestQuery.duration.toFixed(2)}ms)`)
  
  // Performance thresholds
  console.log('\n🎯 Performance Analysis')
  console.log('=======================\n')
  
  const slow = results.filter(r => r.duration > 100)
  const medium = results.filter(r => r.duration > 50 && r.duration <= 100)
  const fast = results.filter(r => r.duration <= 50)
  
  console.log(`⚡ Fast queries (<50ms): ${fast.length}`)
  console.log(`⚠️  Medium queries (50-100ms): ${medium.length}`)
  console.log(`🐌 Slow queries (>100ms): ${slow.length}`)
  
  if (slow.length > 0) {
    console.log('\nSlow queries that may need optimization:')
    slow.forEach(q => {
      console.log(`- ${q.query}: ${q.duration.toFixed(2)}ms`)
    })
  }
  
  // Save results to file
  const resultsJson = {
    timestamp: new Date().toISOString(),
    summary: {
      totalQueries: results.length,
      totalDuration: totalDuration,
      averageDuration: avgDuration,
      fastestQuery: fastestQuery,
      slowestQuery: slowestQuery
    },
    queries: results,
    performance: {
      fast: fast.length,
      medium: medium.length,
      slow: slow.length
    }
  }
  
  console.log('\n💾 Saving results to performance-baseline.json...')
  
  const fs = require('fs')
  fs.writeFileSync(
    path.join(__dirname, '../performance-baseline.json'),
    JSON.stringify(resultsJson, null, 2)
  )
  
  console.log('✅ Performance baseline complete!')
}

// Run tests
runPerformanceTests().catch(console.error)