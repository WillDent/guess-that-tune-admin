'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CartIconProps {
  onClick: () => void
}

export function CartIcon({ onClick }: CartIconProps) {
  const { cart } = useCart()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      aria-label={`Shopping cart with ${cart.totalItems} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {cart.totalItems > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {cart.totalItems > 99 ? '99+' : cart.totalItems}
        </Badge>
      )}
    </Button>
  )
}