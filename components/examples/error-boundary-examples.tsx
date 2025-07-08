'use client'

import { 
  RLSErrorBoundary, 
  DataErrorBoundary, 
  GameErrorBoundary,
  AdminErrorBoundary 
} from '@/components/error-boundaries'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Example 1: Data Fetching with Error Boundary
export function DataFetchingExample() {
  const [data, setData] = useState(null)
  
  return (
    <DataErrorBoundary resource="question sets">
      <div className="p-4">
        <h3 className="font-semibold mb-2">Data Fetching Example</h3>
        {/* Component that might throw during data fetch */}
        <QuestionSetList />
      </div>
    </DataErrorBoundary>
  )
}

// Example 2: RLS Protected Content
export function RLSProtectedExample() {
  return (
    <RLSErrorBoundary fallbackMessage="You need proper permissions to view this content">
      <div className="p-4">
        <h3 className="font-semibold mb-2">Protected Content</h3>
        {/* Component that might throw RLS errors */}
        <AdminOnlyData />
      </div>
    </RLSErrorBoundary>
  )
}

// Example 3: Game Component with Error Boundary
export function GameExample({ gameId }: { gameId: string }) {
  const [gameState, setGameState] = useState('loading')
  
  return (
    <GameErrorBoundary 
      gameId={gameId}
      onReset={() => setGameState('loading')}
    >
      <div className="p-4">
        <h3 className="font-semibold mb-2">Game: {gameId}</h3>
        {/* Game component that might throw game-specific errors */}
        <GameBoard gameId={gameId} />
      </div>
    </GameErrorBoundary>
  )
}

// Example 4: Admin Section with Permission Check
export function AdminSectionExample() {
  return (
    <AdminErrorBoundary section="User Management">
      <div className="p-4">
        <h3 className="font-semibold mb-2">Admin Dashboard</h3>
        {/* Admin-only components */}
        <UserManagementPanel />
      </div>
    </AdminErrorBoundary>
  )
}

// Example 5: Nested Error Boundaries
export function NestedBoundariesExample() {
  return (
    <DataErrorBoundary resource="games">
      <div className="p-4 space-y-4">
        <h3 className="font-semibold mb-2">Games Dashboard</h3>
        
        {/* Each game has its own error boundary */}
        {['game1', 'game2', 'game3'].map(gameId => (
          <GameErrorBoundary key={gameId} gameId={gameId}>
            <GameCard gameId={gameId} />
          </GameErrorBoundary>
        ))}
      </div>
    </DataErrorBoundary>
  )
}

// Example 6: Error Boundary with Retry
export function RetryExample() {
  const [retryCount, setRetryCount] = useState(0)
  
  return (
    <DataErrorBoundary 
      resource="user profile"
      onRetry={() => setRetryCount(prev => prev + 1)}
    >
      <div className="p-4">
        <h3 className="font-semibold mb-2">Profile (Retry: {retryCount})</h3>
        <UserProfile key={retryCount} />
      </div>
    </DataErrorBoundary>
  )
}

// Dummy components that might throw errors
function QuestionSetList() {
  // Simulate potential error
  if (Math.random() > 0.8) {
    throw new Error('Failed to fetch question sets')
  }
  return <div>Question sets loaded successfully</div>
}

function AdminOnlyData() {
  // Simulate RLS error
  if (Math.random() > 0.7) {
    throw new Error('new row violates row-level security policy')
  }
  return <div>Admin data loaded</div>
}

function GameBoard({ gameId }: { gameId: string }) {
  // Simulate game error
  if (Math.random() > 0.7) {
    throw new Error('Game not found')
  }
  return <div>Game board for {gameId}</div>
}

function UserManagementPanel() {
  // Simulate permission error
  if (Math.random() > 0.7) {
    throw new Error('Admin access required')
  }
  return <div>User management panel</div>
}

function GameCard({ gameId }: { gameId: string }) {
  return <div className="p-2 border rounded">Game {gameId}</div>
}

function UserProfile() {
  if (Math.random() > 0.5) {
    throw new Error('Network error')
  }
  return <div>User profile loaded</div>
}

// Demo component to test error boundaries
export function ErrorBoundaryDemo() {
  const [throwError, setThrowError] = useState<string | null>(null)
  
  const ErrorThrower = ({ type }: { type: string }) => {
    if (throwError === type) {
      switch (type) {
        case 'rls':
          throw new Error('new row violates row-level security policy for table "games"')
        case 'network':
          throw new Error('Network request failed')
        case 'game':
          throw new Error('Game already started')
        case 'admin':
          throw new Error('Admin privileges required')
        default:
          throw new Error('Unknown error')
      }
    }
    return null
  }
  
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Error Boundary Demo</h2>
      
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setThrowError('rls')} variant="outline">
          Trigger RLS Error
        </Button>
        <Button onClick={() => setThrowError('network')} variant="outline">
          Trigger Network Error
        </Button>
        <Button onClick={() => setThrowError('game')} variant="outline">
          Trigger Game Error
        </Button>
        <Button onClick={() => setThrowError('admin')} variant="outline">
          Trigger Admin Error
        </Button>
        <Button onClick={() => setThrowError(null)} variant="default">
          Reset All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RLSErrorBoundary>
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">RLS Boundary</h3>
            <ErrorThrower type="rls" />
            <p>Protected content here</p>
          </div>
        </RLSErrorBoundary>
        
        <DataErrorBoundary resource="test data">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Data Boundary</h3>
            <ErrorThrower type="network" />
            <p>Data content here</p>
          </div>
        </DataErrorBoundary>
        
        <GameErrorBoundary gameId="test-123">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Game Boundary</h3>
            <ErrorThrower type="game" />
            <p>Game content here</p>
          </div>
        </GameErrorBoundary>
        
        <AdminErrorBoundary section="test">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Admin Boundary</h3>
            <ErrorThrower type="admin" />
            <p>Admin content here</p>
          </div>
        </AdminErrorBoundary>
      </div>
    </div>
  )
}