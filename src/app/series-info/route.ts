import { NextResponse } from 'next/server'

// Redirect to series dashboard
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnt.ai'
  const seriesUrl = `${baseUrl}/dashboard/series`
  return NextResponse.redirect(seriesUrl)
}
