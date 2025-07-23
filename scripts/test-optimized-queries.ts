import { createClient } from '@supabase/supabase-js'
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

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'will@dent.ly',
    password: 'Odessa99!',
  },
  user: {
    email: 'will.dent@gmail.com',
    password: 'odessa99',
  }
}

async function measureQuery(name: string, queryFn: () => Promise<any>) {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = Math.round(performance.now() - start)
    console.log(`✅ ${name}: ${duration}ms`)
    return { duration, result }
  } catch (error: any) {
    const duration = Math.round(performance.now() - start)
    console.log(`❌ ${name}: Failed after ${duration}ms - ${error.message}`)
    return { duration, error }
  }
}

async function testOptimizedQueries() {
  console.log('🚀 Testing Optimized Query Performance')
  console.log('=====================================\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Sign in as admin for full access
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.admin.email,
    password: TEST_ACCOUNTS.admin.password
  })

  if (!auth.user) {
    console.error('Failed to authenticate')
    return
  }

  const results: any[] = []

  // Test 1: Fetch question sets with details (pagination)
  console.log('📋 Test 1: Question Sets with Details (Paginated)')
  const test1 = await measureQuery('Question sets page 1', async () => {
    return supabase
      .from('question_sets')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        is_public,
        created_at,
        user:users!created_by(id, name, avatar_url),
        category:categories(id, name),
        questions(count),
        favorites(count)
      `, { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(0, 19)
  })
  results.push({ name: 'Question sets with details', ...test1 })

  // Test 2: Single question set with all questions
  console.log('\n📋 Test 2: Single Question Set Complete')
  // First get a question set ID
  const { data: sets } = await supabase
    .from('question_sets')
    .select('id')
    .limit(1)
  
  if (sets?.[0]) {
    const test2 = await measureQuery('Complete question set', async () => {
      return supabase
        .from('question_sets')
        .select(`
          *,
          user:users!created_by(id, name, avatar_url),
          category:categories(*),
          questions(*)
        `)
        .eq('id', sets[0].id)
        .single()
    })
    results.push({ name: 'Complete question set', ...test2 })
  }

  // Test 3: Dashboard stats (parallel queries simulation)
  console.log('\n📋 Test 3: Dashboard Stats (Parallel)')
  const test3 = await measureQuery('Dashboard stats', async () => {
    const [questionSets, games, favorites] = await Promise.all([
      supabase
        .from('question_sets')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', auth.user!.id),
      
      supabase
        .from('game_participants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.user!.id),
      
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.user!.id)
    ])
    
    return {
      questionSets: questionSets.count,
      games: games.count,
      favorites: favorites.count
    }
  })
  results.push({ name: 'Dashboard stats', ...test3 })

  // Test 4: Category list (should be fast with index)
  console.log('\n📋 Test 4: Categories List')
  const test4 = await measureQuery('Categories list', async () => {
    return supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .is('parent_id', null)
      .order('name')
  })
  results.push({ name: 'Categories list', ...test4 })

  // Test 5: User favorites
  console.log('\n📋 Test 5: User Favorites with Details')
  const test5 = await measureQuery('User favorites', async () => {
    return supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        question_set:question_sets(
          id,
          title,
          description,
          thumbnail_url,
          user:users!created_by(name, avatar_url),
          questions(count)
        )
      `)
      .eq('user_id', auth.user!.id)
      .order('created_at', { ascending: false })
      .limit(10)
  })
  results.push({ name: 'User favorites', ...test5 })

  // Test 6: Search simulation
  console.log('\n📋 Test 6: Search Question Sets')
  const test6 = await measureQuery('Search question sets', async () => {
    return supabase
      .from('question_sets')
      .select(`
        id,
        title,
        description,
        user:users!created_by(name),
        questions(count)
      `)
      .ilike('title', '%music%')
      .eq('is_public', true)
      .limit(10)
  })
  results.push({ name: 'Search question sets', ...test6 })

  // Summary
  console.log('\n📊 Performance Summary')
  console.log('====================')
  
  const successfulQueries = results.filter(r => !r.error)
  const totalTime = successfulQueries.reduce((sum, r) => sum + r.duration, 0)
  const avgTime = Math.round(totalTime / successfulQueries.length)
  
  console.log(`Total queries: ${results.length}`)
  console.log(`Successful: ${successfulQueries.length}`)
  console.log(`Failed: ${results.length - successfulQueries.length}`)
  console.log(`Average time: ${avgTime}ms`)
  console.log(`Total time: ${totalTime}ms`)
  
  console.log('\n🎯 Query Breakdown:')
  results
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .forEach(r => {
      const status = r.error ? '❌' : r.duration > 100 ? '⚠️' : '✅'
      console.log(`${status} ${r.name}: ${r.duration}ms`)
    })
  
  // Performance recommendations
  console.log('\n💡 Recommendations:')
  if (avgTime > 50) {
    console.log('- Average query time is above 50ms target')
    console.log('- Consider adding more specific indexes')
    console.log('- Review RLS policies for performance')
  }
  
  const slowQueries = results.filter(r => r.duration > 100)
  if (slowQueries.length > 0) {
    console.log(`- ${slowQueries.length} queries are slower than 100ms`)
    console.log('- Focus optimization on:', slowQueries.map(q => q.name).join(', '))
  }

  // Sign out
  await supabase.auth.signOut()
}

// Run tests
testOptimizedQueries().catch(console.error)