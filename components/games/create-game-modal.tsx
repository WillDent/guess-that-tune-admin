'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Gamepad2, Users, Clock } from 'lucide-react'
import { useQuestionSets } from '@/hooks/use-question-sets'
import { usePublicQuestionSets } from '@/hooks/use-public-question-sets'
import { useGames } from '@/hooks/use-games'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CreateGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameCreated: (game: any) => void
}

export function CreateGameModal({ isOpen, onClose, onGameCreated }: CreateGameModalProps) {
  const { toast } = useToast()
  const { questionSets: mySets = [], loading: myLoading } = useQuestionSets()
  const { questionSets: publicSets = [], loading: publicLoading } = usePublicQuestionSets({ sortBy: 'popular' })
  const { createGame } = useGames()
  
  const [selectedSetId, setSelectedSetId] = useState<string>('')
  const [mode, setMode] = useState<'single' | 'multiplayer'>('single')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [timeLimit, setTimeLimit] = useState(30)
  const [creating, setCreating] = useState(false)
  const [setSource, setSetSource] = useState<'my' | 'public'>('my')

  const loading = myLoading || publicLoading
  const availableSets = setSource === 'my' ? mySets : publicSets

  const handleCreate = async () => {
    if (!selectedSetId) {
      toast.error('Please select a question set')
      return
    }

    setCreating(true)
    const { data, error } = await createGame({
      question_set_id: selectedSetId,
      mode,
      max_players: mode === 'multiplayer' ? maxPlayers : 1,
      time_limit: timeLimit
    })

    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } else if (data) {
      toast.success('Game created successfully!')
      onGameCreated(data)
    }
    
    setCreating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />
            Create New Game
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Choose a question set and configure your game settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {/* Question Set Selection */}
          <div className="space-y-3">
            <Label>Question Set</Label>
            
            <Tabs value={setSource} onValueChange={(v) => setSetSource(v as 'my' | 'public')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my">My Sets</TabsTrigger>
                <TabsTrigger value="public">Public Sets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my" className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : mySets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>You don't have any question sets yet.</p>
                    <p className="text-sm">Create one from the My Sets page.</p>
                  </div>
                ) : (
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a question set" />
                    </SelectTrigger>
                    <SelectContent>
                      {mySets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{set.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {set.questions?.length || 0} questions • {set.difficulty}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TabsContent>
              
              <TabsContent value="public" className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : publicSets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No public question sets available.</p>
                  </div>
                ) : (
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a public question set" />
                    </SelectTrigger>
                    <SelectContent>
                      {publicSets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          <div className="flex flex-col">
                            <span>{set.name}</span>
                            <span className="text-sm text-gray-500">
                              by {(set.user as any)?.name || (set.user as any)?.email || 'Unknown'} • {set.question_count || 0} questions • {set.difficulty}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Game Mode */}
          <div className="space-y-3">
            <Label>Game Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'single' | 'multiplayer')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Single Player
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiplayer" id="multiplayer" />
                <Label htmlFor="multiplayer" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Multiplayer
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Multiplayer Settings */}
          {mode === 'multiplayer' && (
            <>
              <div className="space-y-3">
                <Label htmlFor="max-players">
                  Max Players: {maxPlayers}
                </Label>
                <Slider
                  id="max-players"
                  min={2}
                  max={10}
                  step={1}
                  value={[maxPlayers]}
                  onValueChange={(v) => setMaxPlayers(v[0])}
                  className="w-full"
                />
              </div>

            </>
          )}

          {/* Time Limit */}
          <div className="space-y-3">
            <Label htmlFor="time-limit" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time per Question: {timeLimit}s
            </Label>
            <Slider
              id="time-limit"
              min={10}
              max={60}
              step={5}
              value={[timeLimit]}
              onValueChange={(v) => setTimeLimit(v[0])}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !selectedSetId}>
            {creating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Game'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}