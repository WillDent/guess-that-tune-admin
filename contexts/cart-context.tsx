'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CartState, CartItem, CartSong, CartContextType, SavedCart } from '@/types/cart'
import { useToast } from '@/hooks/use-toast'

const CART_STORAGE_KEY = 'music-cart'
const DRAFT_CARTS_STORAGE_KEY = 'music-cart-drafts'

const initialState: CartState = {
  items: [],
  totalItems: 0,
  lastUpdated: new Date()
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [cart, setCart] = useState<CartState>(initialState)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          // Convert date strings back to Date objects
          parsedCart.lastUpdated = new Date(parsedCart.lastUpdated)
          parsedCart.items = parsedCart.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
          setCart(parsedCart)
        } catch (error) {
          console.error('Failed to load cart from storage:', error)
        }
      }
      setIsInitialized(true)
    }
  }, [])

  // Save cart to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    // Check if we're in the browser and cart is initialized
    if (isInitialized && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    }
  }, [cart, isInitialized])

  const addToCart = useCallback((song: CartSong) => {
    let toastMessage = ''
    let toastType: 'info' | 'success' = 'success'
    
    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => item.song.id === song.id)
      
      if (existingItem) {
        // If song already in cart, increase quantity
        const updatedItems = prevCart.items.map(item =>
          item.song.id === song.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        
        toastMessage = `${song.name} quantity increased to ${existingItem.quantity + 1}`
        toastType = 'info'
        
        return {
          items: updatedItems,
          totalItems: prevCart.totalItems + 1,
          lastUpdated: new Date()
        }
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `cart-item-${Date.now()}-${song.id}`,
          song,
          addedAt: new Date(),
          quantity: 1
        }
        
        toastMessage = `${song.name} by ${song.artist} added to cart`
        toastType = 'success'
        
        return {
          items: [...prevCart.items, newItem],
          totalItems: prevCart.totalItems + 1,
          lastUpdated: new Date()
        }
      }
    })
    
    // Show toast after state update
    setTimeout(() => {
      if (toastType === 'info') {
        toast.info(toastMessage, "Updated quantity")
      } else {
        toast.success(toastMessage, "Added to cart")
      }
    }, 0)
  }, [toast])

  const removeFromCart = useCallback((itemId: string) => {
    let removedSongName = ''
    
    setCart(prevCart => {
      const itemToRemove = prevCart.items.find(item => item.id === itemId)
      if (!itemToRemove) return prevCart
      
      const updatedItems = prevCart.items.filter(item => item.id !== itemId)
      removedSongName = itemToRemove.song.name
      
      return {
        items: updatedItems,
        totalItems: prevCart.totalItems - itemToRemove.quantity,
        lastUpdated: new Date()
      }
    })
    
    // Show toast after state update
    if (removedSongName) {
      setTimeout(() => {
        toast.info(`${removedSongName} removed`, "Removed from cart")
      }, 0)
    }
  }, [toast])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId)
      return
    }
    
    setCart(prevCart => {
      const item = prevCart.items.find(item => item.id === itemId)
      if (!item) return prevCart
      
      const quantityDiff = quantity - item.quantity
      const updatedItems = prevCart.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
      
      return {
        items: updatedItems,
        totalItems: prevCart.totalItems + quantityDiff,
        lastUpdated: new Date()
      }
    })
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    const itemCount = cart.totalItems
    
    setCart(initialState)
    
    // Show toast after state update
    setTimeout(() => {
      toast.info(`${itemCount} items removed`, "Cart cleared")
    }, 0)
  }, [cart.totalItems, toast])

  const isInCart = useCallback((songId: string) => {
    return cart.items.some(item => item.song.id === songId)
  }, [cart.items])

  const getCartItem = useCallback((songId: string) => {
    return cart.items.find(item => item.song.id === songId)
  }, [cart.items])

  const getDraftCarts = useCallback((): SavedCart[] => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return []
    }
    
    const draftsJson = localStorage.getItem(DRAFT_CARTS_STORAGE_KEY)
    if (!draftsJson) return []
    
    try {
      const drafts = JSON.parse(draftsJson)
      // Convert date strings back to Date objects
      return drafts.map((draft: any) => ({
        ...draft,
        savedAt: new Date(draft.savedAt),
        items: draft.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
      }))
    } catch (error) {
      console.error('Failed to load draft carts:', error)
      return []
    }
  }, [])

  const saveCartToDraft = useCallback((name: string) => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    const drafts = getDraftCarts()
    const newDraft: SavedCart = {
      id: `draft-${Date.now()}`,
      name,
      items: cart.items,
      savedAt: new Date()
    }
    
    const updatedDrafts = [...drafts, newDraft]
    localStorage.setItem(DRAFT_CARTS_STORAGE_KEY, JSON.stringify(updatedDrafts))
    
    // Show toast after save
    setTimeout(() => {
      toast.success(`Saved as "${name}"`, "Cart saved")
    }, 0)
  }, [cart.items, toast, getDraftCarts])

  const loadDraftCart = useCallback((draftId: string) => {
    const drafts = getDraftCarts()
    const draft = drafts.find(d => d.id === draftId)
    
    if (draft) {
      setCart({
        items: draft.items,
        totalItems: draft.items.reduce((sum, item) => sum + item.quantity, 0),
        lastUpdated: new Date()
      })
      
      // Show toast after state update
      setTimeout(() => {
        toast.success(`Loaded "${draft.name}"`, "Cart loaded")
      }, 0)
    }
  }, [toast, getDraftCarts])

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem,
    saveCartToDraft,
    loadDraftCart,
    getDraftCarts
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}