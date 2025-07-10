export function debugLog(message: string, data?: any) {
  // Log to console
  console.log(message, data)
  
  // Also send to server for debugging
  if (typeof window !== 'undefined') {
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data })
    }).catch(() => {
      // Ignore errors to prevent breaking the app
    })
  }
}