import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Test user credentials (these should be set up in your test environment)
const TEST_USERS = {
  userA: {
    email: 'test-user-a@example.com',
    password: 'test-password-123',
    id: '' // Will be populated after login
  },
  userB: {
    email: 'test-user-b@example.com', 
    password: 'test-password-123',
    id: '' // Will be populated after login
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'test-password-123',
    id: '' // Will be populated after login
  }
}

describe('Games RLS Policies', () => {
  let supabaseUserA: ReturnType<typeof createClient<Database>>
  let supabaseUserB: ReturnType<typeof createClient<Database>>
  let supabaseAdmin: ReturnType<typeof createClient<Database>>
  let supabaseAnon: ReturnType<typeof createClient<Database>>
  
  let testGameId: string
  let testQuestionSetId: string

  beforeAll(async () => {
    // Create clients for each user type
    supabaseUserA = createClient<Database>(supabaseUrl, supabaseAnonKey)
    supabaseUserB = createClient<Database>(supabaseUrl, supabaseAnonKey)
    supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey)
    supabaseAnon = createClient<Database>(supabaseUrl, supabaseAnonKey)

    // Sign in users
    const { data: authA } = await supabaseUserA.auth.signInWithPassword({
      email: TEST_USERS.userA.email,
      password: TEST_USERS.userA.password
    })
    TEST_USERS.userA.id = authA?.user?.id || ''

    const { data: authB } = await supabaseUserB.auth.signInWithPassword({
      email: TEST_USERS.userB.email,
      password: TEST_USERS.userB.password
    })
    TEST_USERS.userB.id = authB?.user?.id || ''

    const { data: authAdmin } = await supabaseAdmin.auth.signInWithPassword({
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password
    })
    TEST_USERS.admin.id = authAdmin?.user?.id || ''

    // Create a test question set (assuming this is allowed)
    const { data: questionSet } = await supabaseUserA
      .from('question_sets')
      .insert({
        name: 'Test Question Set for RLS',
        difficulty: 'medium',
        user_id: TEST_USERS.userA.id
      })
      .select()
      .single()
    
    testQuestionSetId = questionSet?.id || ''
  })

  afterAll(async () => {
    // Clean up test data
    if (testGameId) {
      await supabaseAdmin.from('games').delete().eq('id', testGameId)
    }
    if (testQuestionSetId) {
      await supabaseAdmin.from('question_sets').delete().eq('id', testQuestionSetId)
    }
  })

  describe('Game Creation', () => {
    test('User can create a game they host', async () => {
      const { data, error } = await supabaseUserA
        .from('games')
        .insert({
          name: 'Test Game A',
          host_user_id: TEST_USERS.userA.id,
          question_set_id: testQuestionSetId,
          status: 'waiting'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.host_user_id).toBe(TEST_USERS.userA.id)
      
      testGameId = data?.id || ''
    })

    test('User cannot create a game with different host', async () => {
      const { data, error } = await supabaseUserA
        .from('games')
        .insert({
          name: 'Test Game Wrong Host',
          host_user_id: TEST_USERS.userB.id, // Different user!
          question_set_id: testQuestionSetId,
          status: 'waiting'
        })
        .select()

      expect(error).toBeDefined()
      expect(error?.code).toMatch(/42501|PGRST/)
      expect(data).toBeNull()
    })

    test('Anonymous user cannot create games', async () => {
      const { data, error } = await supabaseAnon
        .from('games')
        .insert({
          name: 'Anonymous Game',
          host_user_id: 'some-id',
          question_set_id: testQuestionSetId,
          status: 'waiting'
        })
        .select()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })

  describe('Game Reading', () => {
    beforeAll(async () => {
      // Add User B as participant
      await supabaseUserA
        .from('game_participants')
        .insert({
          game_id: testGameId,
          user_id: TEST_USERS.userB.id,
          score: 0
        })
    })

    test('Host can view their own game', async () => {
      const { data, error } = await supabaseUserA
        .from('games')
        .select('*')
        .eq('id', testGameId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testGameId)
    })

    test('Participant can view game they joined', async () => {
      const { data, error } = await supabaseUserB
        .from('games')
        .select('*')
        .eq('id', testGameId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testGameId)
    })

    test('Non-participant cannot view game', async () => {
      // Create a new user C client
      const supabaseUserC = createClient<Database>(supabaseUrl, supabaseAnonKey)
      
      const { data, error } = await supabaseUserC
        .from('games')
        .select('*')
        .eq('id', testGameId)
        .maybeSingle()

      // Should either get no data or an RLS error
      expect(data).toBeNull()
    })

    test('Admin can view all games', async () => {
      const { data, error } = await supabaseAdmin
        .from('games')
        .select('*')
        .eq('id', testGameId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testGameId)
    })
  })

  describe('Game Updates', () => {
    test('Host can update their game', async () => {
      const { data, error } = await supabaseUserA
        .from('games')
        .update({ name: 'Updated Game Name' })
        .eq('id', testGameId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.name).toBe('Updated Game Name')
    })

    test('Participant cannot update game', async () => {
      const { error } = await supabaseUserB
        .from('games')
        .update({ name: 'Hacked Game Name' })
        .eq('id', testGameId)

      expect(error).toBeDefined()
      expect(error?.code).toMatch(/42501|PGRST/)
    })

    test('Non-participant cannot update game', async () => {
      const supabaseUserC = createClient<Database>(supabaseUrl, supabaseAnonKey)
      
      const { error } = await supabaseUserC
        .from('games')
        .update({ name: 'Hacked Game Name' })
        .eq('id', testGameId)

      expect(error).toBeDefined()
    })
  })

  describe('Game Deletion', () => {
    test('Only host can delete their game', async () => {
      // Create a temporary game for deletion test
      const { data: tempGame } = await supabaseUserA
        .from('games')
        .insert({
          name: 'Game to Delete',
          host_user_id: TEST_USERS.userA.id,
          question_set_id: testQuestionSetId,
          status: 'waiting'
        })
        .select()
        .single()

      const tempGameId = tempGame?.id

      // Host can delete
      const { error: deleteError } = await supabaseUserA
        .from('games')
        .delete()
        .eq('id', tempGameId!)

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data: checkData } = await supabaseUserA
        .from('games')
        .select('*')
        .eq('id', tempGameId!)
        .maybeSingle()

      expect(checkData).toBeNull()
    })

    test('Participant cannot delete game', async () => {
      const { error } = await supabaseUserB
        .from('games')
        .delete()
        .eq('id', testGameId)

      expect(error).toBeDefined()
      expect(error?.code).toMatch(/42501|PGRST/)
    })
  })
})

describe('Game Participants RLS Policies', () => {
  // Similar structure for game_participants table tests
  describe('Participant Management', () => {
    test('User can join a game', async () => {
      // Implementation here
    })

    test('User can leave a game', async () => {
      // Implementation here
    })

    test('Host can remove participants', async () => {
      // Implementation here
    })

    test('Participants can view other participants in same game', async () => {
      // Implementation here
    })

    test('Non-participants cannot view participant list', async () => {
      // Implementation here
    })
  })
})