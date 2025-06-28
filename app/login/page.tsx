'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInWithMagicLink } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const next = searchParams.get('next') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('magic-link')

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already logged in, redirecting to:', next)
      router.push(next)
    }
  }, [authLoading, user, next, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await signIn(email, password, next)
      
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Login successful - redirect on client side
        toast.success('Login successful!')
        // Force a hard refresh to ensure auth state is properly updated
        window.location.href = result.redirectTo || next
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('An error occurred during sign in')
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await signInWithMagicLink(email)
      
      if (result?.error) {
        toast.error(result.error)
      } else if (result?.success) {
        toast.success(result.message)
      }
    } catch (error) {
      toast.error('An error occurred sending the magic link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-8">
          <Music className="h-12 w-12 text-purple-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Guess That Tune</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="magic-link" className="mt-6">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-purple-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-8">
            <Music className="h-12 w-12 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Guess That Tune</h1>
          </div>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}