'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Music, 
  Save,
  FolderOpen,
  ArrowRight,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const router = useRouter()
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    saveCartToDraft,
    loadDraftCart,
    getDraftCarts
  } = useCart()
  const [draftName, setDraftName] = useState('')
  const [showDraftInput, setShowDraftInput] = useState(false)

  const handleCheckout = () => {
    // Store cart items in sessionStorage for the question creation page
    const cartSongs = cart.items.map(item => ({
      id: item.song.id,
      name: item.song.name,
      artist: item.song.artist,
      album: item.song.album,
      genre: item.song.genre,
      artwork: item.song.artwork
    }))
    
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selectedSongs', JSON.stringify(cartSongs))
    }
    
    // Clear the cart after checkout
    clearCart()
    
    onClose()
    router.push('/questions/new')
  }

  const handleSaveDraft = () => {
    if (draftName.trim()) {
      saveCartToDraft(draftName.trim())
      setDraftName('')
      setShowDraftInput(false)
    }
  }

  const drafts = getDraftCarts()

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Music Cart
          </SheetTitle>
          <SheetDescription>
            {cart.totalItems === 0 
              ? 'Your cart is empty' 
              : `${cart.totalItems} ${cart.totalItems === 1 ? 'song' : 'songs'} selected`
            }
          </SheetDescription>
        </SheetHeader>

        {cart.totalItems > 0 && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDraftInput(!showDraftInput)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            
            {drafts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Load Draft
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {drafts.map(draft => (
                    <DropdownMenuItem
                      key={draft.id}
                      onClick={() => loadDraftCart(draft.id)}
                    >
                      <div className="flex flex-col">
                        <span>{draft.name}</span>
                        <span className="text-xs text-gray-500">
                          {draft.items.length} items • {new Date(draft.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="ml-auto text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        )}

        {showDraftInput && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Draft name..."
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveDraft()}
            />
            <Button size="sm" onClick={handleSaveDraft}>
              Save
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setShowDraftInput(false)
                setDraftName('')
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
          {cart.totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <ShoppingCart className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mt-2">Add songs from the music browser</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  onClose()
                  router.push('/music')
                }}
              >
                Browse Music
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.song.artwork ? (
                    <img 
                      src={item.song.artwork} 
                      alt={item.song.album}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <Music className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.song.name}</h4>
                    <p className="text-sm text-gray-600 truncate">{item.song.artist}</p>
                    <p className="text-xs text-gray-500 truncate">{item.song.album}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {cart.totalItems > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total songs:</span>
                <span className="font-medium">{cart.totalItems}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                Create Question Set
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}