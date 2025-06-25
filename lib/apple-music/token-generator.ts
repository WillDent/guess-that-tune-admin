// ABOUTME: Generates JWT tokens for Apple Music API authentication
// ABOUTME: Tokens are signed with ES256 algorithm using private key

import jwt from 'jsonwebtoken'
import { APPLE_MUSIC_CONFIG } from './config'

interface TokenPayload {
  iss: string // Team ID
  iat: number // Issued at
  exp: number // Expiration
}

export class AppleMusicTokenGenerator {
  private static instance: AppleMusicTokenGenerator
  private token: string | null = null
  private tokenExpiry: number = 0

  static getInstance(): AppleMusicTokenGenerator {
    if (!AppleMusicTokenGenerator.instance) {
      AppleMusicTokenGenerator.instance = new AppleMusicTokenGenerator()
    }
    return AppleMusicTokenGenerator.instance
  }

  async getToken(): Promise<string> {
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      throw new Error('Apple Music API credentials not configured. Please set APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY in your .env.local file.')
    }

    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    // Generate new token
    const now = Math.floor(Date.now() / 1000)
    const expiry = now + APPLE_MUSIC_CONFIG.tokenExpirationTime

    const payload: TokenPayload = {
      iss: APPLE_MUSIC_CONFIG.teamId,
      iat: now,
      exp: expiry,
    }

    try {
      this.token = jwt.sign(payload, APPLE_MUSIC_CONFIG.privateKey, {
        algorithm: 'ES256',
        keyid: APPLE_MUSIC_CONFIG.keyId,
      })
      
      // Cache token with 1 hour buffer before expiry
      this.tokenExpiry = (expiry - 3600) * 1000
      
      return this.token
    } catch (error) {
      console.error('Failed to generate Apple Music token:', error)
      throw new Error('Failed to generate Apple Music authentication token')
    }
  }

  clearToken(): void {
    this.token = null
    this.tokenExpiry = 0
  }
}