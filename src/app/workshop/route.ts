import { NextResponse } from 'next/server'

// Redirect to workshop WhatsApp
export async function GET() {
  const workshopUrl = 'https://wa.me/972583654698?text=ברור'
  return NextResponse.redirect(workshopUrl)
}
