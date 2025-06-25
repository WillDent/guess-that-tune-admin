import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }

  console.log('🔍 Checking Supabase connection...')
  console.log(`URL: ${supabaseUrl}`)

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError && testError.code === '42P01') {
      console.error('❌ Users table does not exist')
    } else if (testError) {
      console.error('❌ Database connection error:', testError.message)
    } else {
      console.log('✅ Database connection successful')
    }

    // Check required tables
    const requiredTables = [
      'users',
      'question_sets',
      'questions', 
      'games',
      'game_participants',
      'favorites'
    ]

    console.log('\n📊 Checking required tables:')
    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`)
      } else if (error) {
        console.log(`⚠️  Table '${table}' exists but has error: ${error.message}`)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }

    // Check auth
    console.log('\n🔐 Checking authentication:')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else if (user) {
      console.log('✅ Authenticated as:', user.email)
    } else {
      console.log('ℹ️  Not authenticated (this is normal if not logged in)')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDatabase()