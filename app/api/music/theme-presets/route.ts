// API endpoint to get preset theme templates

import { NextResponse } from 'next/server'
import { ThemeDiscoveryService } from '@/lib/openai/theme-service'

export async function GET() {
  const presets = ThemeDiscoveryService.getPresetThemes()
  return NextResponse.json({ presets })
}