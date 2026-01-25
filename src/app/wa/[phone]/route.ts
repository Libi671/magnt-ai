import { NextRequest, NextResponse } from 'next/server'

// Redirect to WhatsApp
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params
  const whatsappUrl = `https://wa.me/${phone}`
  return NextResponse.redirect(whatsappUrl)
}
