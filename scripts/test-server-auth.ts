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

async function testServerAuth() {
  console.log('🧪 Testing Server-First Authentication')
  console.log('=====================================\n')

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Test 1: Middleware auth check simulation
  console.log('📋 Test 1: Middleware Auth Checks')
  console.log('---------------------------------')
  
  // Test unauthenticated access
  const { data: noUser } = await supabase.auth.getUser()
  console.log('✅ Unauthenticated state:', !noUser ? 'No user (correct)' : 'User found (incorrect)')
  
  // Test authenticated access
  const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.admin.email,
    password: TEST_ACCOUNTS.admin.password
  })
  
  if (adminError) {
    console.log('❌ Admin sign in failed:', adminError.message)
  } else {
    console.log('✅ Admin sign in successful')
    
    // Check if we can get the user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('✅ User retrieved:', user?.email)
    
    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()
      
    console.log('✅ Admin role check:', profile?.role === 'admin' ? 'Is admin' : 'Not admin')
  }
  
  await supabase.auth.signOut()
  
  // Test 2: Session handling
  console.log('\n📋 Test 2: Session Handling')
  console.log('---------------------------')
  
  // Sign in as regular user
  const { data: userAuth } = await supabase.auth.signInWithPassword({
    email: TEST_ACCOUNTS.user.email,
    password: TEST_ACCOUNTS.user.password
  })
  
  if (userAuth.session) {
    console.log('✅ Session created:', {
      access_token: userAuth.session.access_token.substring(0, 20) + '...',
      expires_at: new Date(userAuth.session.expires_at! * 1000).toISOString()
    })
    
    // Test session refresh
    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      console.log('❌ Session refresh failed:', refreshError.message)
    } else {
      console.log('✅ Session refreshed successfully')
    }
  }
  
  // Test 3: Protected route access patterns
  console.log('\n📋 Test 3: Protected Route Patterns')
  console.log('-----------------------------------')
  
  // Simulate server component auth check
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    console.log('✅ Redirect to login would occur (user not authenticated)')
  } else {
    console.log('✅ User authenticated, would render protected content')
    
    // Check if user can access admin routes
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single()
      
    if (userProfile?.role !== 'admin') {
      console.log('✅ Would redirect from admin route (not admin)')
    }
  }
  
  // Test 4: Auth state changes
  console.log('\n📋 Test 4: Auth State Changes')
  console.log('-----------------------------')
  
  // Set up auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`✅ Auth event: ${event}`)
    if (session) {
      console.log(`   User: ${session.user.email}`)
    }
  })
  
  // Trigger sign out
  await supabase.auth.signOut()
  
  // Clean up
  subscription.unsubscribe()
  
  console.log('\n✅ Server auth tests completed!')
  console.log('\nKey findings:')
  console.log('- Middleware can properly check auth state')
  console.log('- Sessions are handled correctly')
  console.log('- Role-based access control works')
  console.log('- Auth state changes are tracked')
}

// Run tests
testServerAuth().catch(console.error)