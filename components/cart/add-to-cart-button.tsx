'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { CartSong } from '@/types/cart'
import { ShoppingCart, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  song: CartSong
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
}

export function AddToCartButton({ 
  song, 
  variant = 'outline',
  size = 'sm',
  className,
  showIcon = true
}: AddToCartButtonProps) {
  const { addToCart, isInCart, getCartItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  
  const inCart = isInCart(song.id)
  const cartItem = getCartItem(song.id)
  
  const handleClick = async () => {
    setIsAdding(true)
    addToCart(song)
    
    // Show animation
    setTimeout(() => {
      setIsAdding(false)
    }, 600)
  }
  
  return (
    <Button
      variant={inCart ? 'secondary' : variant}
      size={size}
      onClick={handleClick}
      disabled={isAdding}
      className={cn(
        'transition-all duration-200',
        isAdding && 'scale-95',
        inCart && 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
        className
      )}
    >
      {showIcon && (
        <>
          {isAdding ? (
            <Plus className="h-4 w-4 mr-2 animate-spin" />
          ) : inCart ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
        </>
      )}
      {inCart ? (
        <span>
          In Cart {cartItem && cartItem.quantity > 1 && `(${cartItem.quantity})`}
        </span>
      ) : (
        'Add to Cart'
      )}
    </Button>
  )
}