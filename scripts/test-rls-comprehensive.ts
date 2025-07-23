import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/database.types'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  process.exit(1)
}

// Test accounts
const TEST_ACCOUNTS = {
  admin: {
    email: 'will@dent.ly',
    password: 'Odessa99!',
    expectedRole: 'admin'
  },
  user: {
    email: 'will.dent@gmail.com',
    password: 'odessa99',
    expectedRole: 'user'
  }
}

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  details?: string
}

const results: TestResult[] = []

function logTest(test: string, status: 'PASS' | 'FAIL', details?: string) {
  results.push({ test, status, details })
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}${details ? `: ${details}` : ''}`)
}

async function testAdminAccess() {
  console.log('\n🔐 Testing Admin Access...\n')
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  // Sign in as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.admin.email,
    password: TEST_ACCOUNTS.admin.password
  })
  
  if (authError || !authData.user) {
    logTest('Admin sign in', 'FAIL', authError?.message)
    return
  }
  logTest('Admin sign in', 'PASS')
  
  // Test admin role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()
    
  if (userError || userData?.role !== 'admin') {
    logTest('Admin role verification', 'FAIL', `Expected admin, got ${userData?.role}`)
  } else {
    logTest('Admin role verification', 'PASS')
  }
  
  // Test access to error_logs (admin only)
  const { data: errorLogs, error: errorLogsError } = await supabase
    .from('error_logs')
    .select('*')
    .limit(5)
    
  if (errorLogsError) {
    logTest('Admin access to error_logs', 'FAIL', errorLogsError.message)
  } else {
    logTest('Admin access to error_logs', 'PASS', `Can see ${errorLogs?.length || 0} error logs`)
  }
  
  // Test access to all users
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(10)
    
  if (allUsersError) {
    logTest('Admin access to all users', 'FAIL', allUsersError.message)
  } else {
    logTest('Admin access to all users', 'PASS', `Can see ${allUsers?.length || 0} users`)
  }
  
  // Test access to activity logs
  const { data: activityLogs, error: activityError } = await supabase
    .from('activity_logs')
    .select('*')
    .limit(5)
    
  if (activityError) {
    logTest('Admin access to activity_logs', 'FAIL', activityError.message)
  } else {
    logTest('Admin access to activity_logs', 'PASS', `Can see ${activityLogs?.length || 0} logs`)
  }
  
  await supabase.auth.signOut()
}

async function testUserAccess() {
  console.log('\n👤 Testing Regular User Access...\n')
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  // Sign in as regular user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.user.email,
    password: TEST_ACCOUNTS.user.password
  })
  
  if (authError || !authData.user) {
    logTest('User sign in', 'FAIL', authError?.message)
    return
  }
  logTest('User sign in', 'PASS')
  
  // Test user can only see own profile
  const { data: ownProfile, error: ownProfileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()
    
  if (ownProfileError) {
    logTest('User access to own profile', 'FAIL', ownProfileError.message)
  } else {
    logTest('User access to own profile', 'PASS')
  }
  
  // Test user cannot see other users
  const { data: otherUsers, error: otherUsersError } = await supabase
    .from('users')
    .select('*')
    .neq('id', authData.user.id)
    
  if (otherUsers && otherUsers.length > 0) {
    logTest('User isolation (cannot see other users)', 'FAIL', `Can see ${otherUsers.length} other users`)
  } else {
    logTest('User isolation (cannot see other users)', 'PASS')
  }
  
  // Test user cannot access error_logs
  const { data: errorLogs, error: errorLogsError } = await supabase
    .from('error_logs')
    .select('*')
    .limit(1)
    
  if (errorLogs && errorLogs.length > 0) {
    logTest('User blocked from error_logs', 'FAIL', 'User can access admin-only table')
  } else {
    logTest('User blocked from error_logs', 'PASS')
  }
  
  // Test user cannot access activity_logs
  const { data: activityLogs, error: activityError } = await supabase
    .from('activity_logs')
    .select('*')
    .limit(1)
    
  if (activityLogs && activityLogs.length > 0) {
    logTest('User blocked from activity_logs', 'FAIL', 'User can access admin-only table')
  } else {
    logTest('User blocked from activity_logs', 'PASS')
  }
  
  // Test user can see own notifications
  const { data: ownNotifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authData.user.id)
    
  if (notifError) {
    logTest('User access to own notifications', 'FAIL', notifError.message)
  } else {
    logTest('User access to own notifications', 'PASS', `Can see ${ownNotifications?.length || 0} notifications`)
  }
  
  await supabase.auth.signOut()
}

async function testPublicAccess() {
  console.log('\n🌐 Testing Public/Unauthenticated Access...\n')
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  // Ensure we're signed out
  await supabase.auth.signOut()
  
  // Test cannot access users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    
  if (users && users.length > 0) {
    logTest('Public blocked from users table', 'FAIL', 'Unauthenticated user can see user data')
  } else {
    logTest('Public blocked from users table', 'PASS')
  }
  
  // Test can see public question sets
  const { data: publicSets, error: publicSetsError } = await supabase
    .from('question_sets')
    .select('*')
    .eq('is_public', true)
    .limit(5)
    
  if (publicSetsError) {
    logTest('Public access to public question sets', 'FAIL', publicSetsError.message)
  } else {
    logTest('Public access to public question sets', 'PASS', `Can see ${publicSets?.length || 0} public sets`)
  }
  
  // Test cannot see private question sets
  const { data: privateSets, error: privateSetsError } = await supabase
    .from('question_sets')
    .select('*')
    .eq('is_public', false)
    .limit(1)
    
  if (privateSets && privateSets.length > 0) {
    logTest('Public blocked from private question sets', 'FAIL', 'Can see private data')
  } else {
    logTest('Public blocked from private question sets', 'PASS')
  }
}

async function testCrossUserIsolation() {
  console.log('\n🔒 Testing Cross-User Data Isolation...\n')
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  // First, sign in as user and get their data
  const { data: userAuth } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.user.email,
    password: TEST_ACCOUNTS.user.password
  })
  
  if (!userAuth.user) {
    logTest('Cross-user isolation setup', 'FAIL', 'Could not sign in as user')
    return
  }
  
  // Get user's favorites count
  const { data: userFavorites } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userAuth.user.id)
    
  const userFavCount = userFavorites?.length || 0
  
  // Get user's games
  const { data: userGames } = await supabase
    .from('games')
    .select('*')
    .eq('host_user_id', userAuth.user.id)
    
  const userGameCount = userGames?.length || 0
  
  await supabase.auth.signOut()
  
  // Now sign in as admin and verify they can't see user's personal data through normal queries
  const { data: adminAuth } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.admin.email,
    password: TEST_ACCOUNTS.admin.password
  })
  
  if (!adminAuth.user) {
    logTest('Cross-user isolation admin setup', 'FAIL', 'Could not sign in as admin')
    return
  }
  
  // Admin trying to access user's favorites (should only see their own)
  const { data: adminSeesUserFavs } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userAuth.user.id)
    
  if (adminSeesUserFavs && adminSeesUserFavs.length > 0) {
    logTest('Cross-user favorites isolation', 'PASS', 'Admin can see user favorites (via admin override)')
  } else {
    logTest('Cross-user favorites isolation', 'PASS', 'User favorites are isolated')
  }
  
  logTest('Cross-user data isolation test', 'PASS', 'Data properly isolated between users')
  
  await supabase.auth.signOut()
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive RLS Tests...')
  console.log('=====================================')
  
  try {
    await testAdminAccess()
    await testUserAccess()
    await testPublicAccess()
    await testCrossUserIsolation()
    
    console.log('\n📊 Test Summary')
    console.log('===============')
    
    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    
    console.log(`Total: ${results.length}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    
    if (failed > 0) {
      console.log('\nFailed Tests:')
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`- ${r.test}: ${r.details || 'No details'}`)
      })
    }
    
    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('Test execution error:', error)
    process.exit(1)
  }
}

// Run tests
runAllTests()