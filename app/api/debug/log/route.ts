import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[CLIENT-LOG]', body.message, body.data ? JSON.stringify(body.data, null, 2) : '')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CLIENT-LOG-ERROR]', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}