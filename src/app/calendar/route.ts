import { NextResponse } from 'next/server'

// Redirect to calendar booking
export async function GET() {
  const calendarUrl = 'https://calendar.app.google/CRFCj1XM5NKBSEGB8'
  return NextResponse.redirect(calendarUrl)
}
