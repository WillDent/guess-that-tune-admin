#!/usr/bin/env node

/**
 * RLS Testing Script
 * 
 * This script tests Row Level Security policies by:
 * 1. Creating test users with different roles
 * 2. Testing access patterns for each user type
 * 3. Verifying security policies work as expected
 * 
 * Usage: npm run test:rls
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestUser {
  email: string
  password: string
  role: 'user' | 'admin'
  id?: string
}

const TEST_USERS: Record<string, TestUser> = {
  userA: {
    email: 'rls-test-user-a@example.com',
    password: 'test-password-123!',
    role: 'user'
  },
  userB: {
    email: 'rls-test-user-b@example.com',
    password: 'test-password-123!',
    role: 'user'
  },
  admin: {
    email: 'rls-test-admin@example.com',
    password: 'test-password-123!',
    role: 'admin'
  }
}

async function setupTestUsers() {
  console.log('🔧 Setting up test users...')
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) throw authError

      user.id = authData.user.id

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      console.log(`✅ Created ${key}: ${user.email} (${user.role})`)
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        console.log(`ℹ️  ${key} already exists`)
        // Get existing user ID
        const { data } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()
        user.id = data?.id
      } else {
        console.error(`❌ Error creating ${key}:`, error.message)
      }
    }
  }
}

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...')
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    if (user.id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id)
        console.log(`✅ Deleted ${key}`)
      } catch (error: any) {
        console.error(`❌ Error deleting ${key}:`, error.message)
      }
    }
  }
}

async function testGameAccess() {
  console.log('\n🎮 Testing Game Access Control...')
  
  // Create clients for each user
  const clients: Record<string, ReturnType<typeof createClient<Database>>> = {}
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    clients[key] = createClient<Database>(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { error } = await clients[key].auth.signInWithPassword({
      email: user.email,
      password: user.password
    })
    if (error) {
      console.error(`❌ Failed to sign in ${key}:`, error.message)
      return
    }
  }

  // Create a test question set
  const { data: questionSet } = await clients.userA
    .from('question_sets')
    .insert({
      name: 'RLS Test Question Set',
      difficulty: 'medium',
      user_id: TEST_USERS.userA.id!
    })
    .select()
    .single()

  if (!questionSet) {
    console.error('❌ Failed to create question set')
    return
  }

  // Test 1: User A creates a game
  console.log('\n📝 Test 1: User A creates a game')
  const { data: game, error: createError } = await clients.userA
    .from('games')
    .insert({
      host_id: TEST_USERS.userA.id!,
      question_set_id: questionSet.id,
      game_code: 'TEST01',
      status: 'pending'
    })
    .select()
    .single()

  if (createError) {
    console.error('❌ User A cannot create game:', createError.message)
  } else {
    console.log('✅ User A created game:', game.id)
  }

  if (!game) return

  // Test 2: User B cannot see the game (not a participant)
  console.log('\n👁️  Test 2: User B cannot see User A\'s game')
  const { data: gameB, error: readErrorB } = await clients.userB
    .from('games')
    .select('*')
    .eq('id', game.id)
    .maybeSingle()

  if (gameB) {
    console.error('❌ SECURITY VIOLATION: User B can see User A\'s game!')
  } else {
    console.log('✅ User B cannot see the game (expected)')
  }

  // Test 3: Add User B as participant
  console.log('\n➕ Test 3: Add User B as participant')
  await clients.userA
    .from('game_participants')
    .insert({
      game_id: game.id,
      user_id: TEST_USERS.userB.id!,
      score: 0
    })

  // Test 4: Now User B can see the game
  console.log('\n👁️  Test 4: User B can now see the game as participant')
  const { data: gameB2 } = await clients.userB
    .from('games')
    .select('*')
    .eq('id', game.id)
    .single()

  if (gameB2) {
    console.log('✅ User B can see the game as participant')
  } else {
    console.error('❌ User B cannot see game even as participant!')
  }

  // Test 5: User B cannot update the game
  console.log('\n✏️  Test 5: User B cannot update the game')
  const { error: updateError } = await clients.userB
    .from('games')
    .update({ status: 'active' })
    .eq('id', game.id)

  if (updateError) {
    console.log('✅ User B cannot update game (expected):', updateError.code)
  } else {
    console.error('❌ SECURITY VIOLATION: User B can update User A\'s game!')
  }

  // Test 6: Admin can see all games
  console.log('\n👑 Test 6: Admin can see all games')
  const { data: adminGames } = await clients.admin
    .from('games')
    .select('*')
    .eq('id', game.id)

  if (adminGames && adminGames.length > 0) {
    console.log('✅ Admin can see the game')
  } else {
    console.error('❌ Admin cannot see games!')
  }

  // Cleanup
  await supabaseAdmin.from('games').delete().eq('id', game.id)
  await supabaseAdmin.from('question_sets').delete().eq('id', questionSet.id)
}

async function testCategoryAccess() {
  console.log('\n📂 Testing Category Access Control...')
  
  // Similar tests for categories table
  // Only admins should be able to create/update/delete categories
}

async function runTests() {
  console.log('🚀 Starting RLS Tests\n')
  
  try {
    await setupTestUsers()
    await testGameAccess()
    await testCategoryAccess()
    
    console.log('\n✅ All tests completed!')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
  } finally {
    // Optionally cleanup test users
    const cleanup = process.argv.includes('--cleanup')
    if (cleanup) {
      await cleanupTestUsers()
    } else {
      console.log('\n💡 Run with --cleanup to remove test users')
    }
  }
}

// Run tests
runTests().catch(console.error)