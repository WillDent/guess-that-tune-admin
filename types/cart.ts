export interface CartSong {
  id: string
  name: string
  artist: string
  album: string
  artwork: string
  genre: string
  year: string
  previewUrl?: string
  duration?: number
}

export interface CartItem {
  id: string
  song: CartSong
  addedAt: Date
  quantity: number
}

export interface CartState {
  items: CartItem[]
  totalItems: number
  lastUpdated: Date
}

export interface CartContextType {
  cart: CartState
  addToCart: (song: CartSong) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (songId: string) => boolean
  getCartItem: (songId: string) => CartItem | undefined
  saveCartToDraft: (name: string) => void
  loadDraftCart: (draftId: string) => void
  getDraftCarts: () => SavedCart[]
}

export interface SavedCart {
  id: string
  name: string
  items: CartItem[]
  savedAt: Date
}