import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Create Supabase client - use service role key if available (bypasses RLS), fallback to anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, leadId } = body

    console.log('Send notification API called:', { taskId, leadId })

    // Get task information including notify_email
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, notify_email, user_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      console.error('Task fetch error:', taskError)
      return NextResponse.json({ 
        error: 'Task not found', 
        details: taskError?.message 
      }, { status: 404 })
    }

    // Get user email if notify_email is not set
    let userEmail: string | null = null
    if (!task.notify_email && task.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', task.user_id)
        .maybeSingle()
      
      userEmail = userData?.email || null
    }

    // Get lead information
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, name, email, phone, rating, created_at')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError)
      return NextResponse.json({ 
        error: 'Lead not found', 
        details: leadError?.message 
      }, { status: 404 })
    }

    // Determine recipient email - prefer notify_email, fallback to user email
    const recipientEmail = task.notify_email || userEmail

    if (!recipientEmail) {
      console.error('No recipient email found', { 
        notify_email: task.notify_email, 
        user_email: userEmail,
        user_id: task.user_id
      })
      return NextResponse.json({ 
        error: 'No recipient email found',
        details: 'Task has no notify_email and user has no email. Please set notify_email in task settings.'
      }, { status: 400 })
    }

    // Get conversation summary if available
    const { data: conversation } = await supabase
      .from('conversations')
      .select('summary')
      .eq('lead_id', leadId)
      .maybeSingle()

    // Count messages: if summary exists, there were at least 6 messages (threshold for summary)
    // Otherwise, we can estimate based on when lead was created vs now
    // For now, we'll use a simple check: if summary exists = 6+, else = 0
    const messageCount = conversation?.summary ? 6 : 0
    
    // Prepare email content
    const emailSubject = `ליד חדש באתגר: ${task.title}`
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://magnt.ai'
    const taskUrl = `${baseUrl}/t/${task.id}`
    const dashboardUrl = `${baseUrl}/dashboard/series`
    // Use logo from your domain - download the image and put it in public/logo.png
    const logoUrl = `${baseUrl}/logo.png`
    
    // Format phone for WhatsApp (remove leading 0, add country code)
    const formatPhoneForWhatsApp = (phone: string) => {
      if (!phone) return ''
      const cleaned = phone.replace(/[\s\-\(\)]/g, '')
      if (cleaned.startsWith('0')) {
        return `972${cleaned.substring(1)}`
      }
      if (cleaned.startsWith('972')) {
        return cleaned
      }
      return `972${cleaned}`
    }
    
    const whatsappPhone = formatPhoneForWhatsApp(lead.phone)
    const whatsappUrl = whatsappPhone ? `${baseUrl}/wa/${whatsappPhone}` : ''
    const calendarUrl = `${baseUrl}/calendar`
    const seriesInfoUrl = `${baseUrl}/series-info`
    const workshopUrl = `${baseUrl}/workshop`

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { direction: rtl; text-align: right; }
          body, div, p, h1, h2, h3, table, td, tr { direction: rtl; text-align: right; }
          a { direction: rtl; }
          .ltr { direction: ltr; text-align: left; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f0f16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; direction: rtl;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">

          <!-- Header -->
          <div style="text-align: center; padding: 32px 0; border-bottom: 1px solid #333; direction: rtl;">
            <img src="${baseUrl}/logo.png" alt="Magnt.AI" style="height: 40px; max-width: 100%; display: block; margin: 0 auto 16px auto;">
            <h1 style="color: white; margin: 16px 0 0 0; font-size: 24px; direction: rtl; text-align: center;">🧲 ליד חדש הגיע!</h1>
            <p style="color: #a0a0a0; margin: 8px 0 0 0; direction: rtl; text-align: center;">מהמגנט: ${task.title}</p>
          </div>

          <!-- Lead Details -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 24px 0; direction: rtl;">
            <h2 style="color: white; margin: 0 0 16px 0; font-size: 18px; direction: rtl; text-align: right;">פרטי הליד</h2>

            <table style="width: 100%; color: white; direction: rtl;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">👤 שם:</td>
                <td style="padding: 8px 0; text-align: right;">${lead.name || 'לא צוין'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">📱 טלפון:</td>
                <td style="padding: 8px 0; text-align: right;"><a href="tel:${lead.phone || ''}" style="color: white; text-decoration: none; direction: ltr; display: inline-block;">${lead.phone || 'לא צוין'}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">📧 אימייל:</td>
                <td style="padding: 8px 0; text-align: right;"><a href="mailto:${lead.email || ''}" style="color: white; text-decoration: none; direction: ltr; display: inline-block;">${lead.email || 'לא צוין'}</a></td>
              </tr>
            </table>

            ${whatsappPhone ? `
            <a href="https://wa.me/${whatsappPhone}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
              💬 שלח הודעה בווטסאפ
            </a>
            ` : ''}
          </div>

          ${messageCount < 4 ? `
          <!-- Analysis Section -->
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #fbbf24; direction: rtl;">
            <p style="color: #fbbf24; margin: 0; font-size: 14px; line-height: 1.6; direction: rtl; text-align: right;">
              ⚠️ <strong>שים לב:</strong> ליד זה ענה רק ${messageCount} הודעות (פחות מ-4), לכן לא שלחנו לך סיכום ודוח מפורט.
              <br><br>
              מומלץ ליצור קשר ולברר אם יש עניין בשירות שלך.
            </p>
          </div>
          ` : conversation?.summary ? `
          <!-- Conversation Summary -->
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #667eea; direction: rtl;">
            <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 18px; direction: rtl; text-align: right; font-weight: 600;">📋 סיכום השיחה</h2>
            <div style="color: #e0e0e0; line-height: 1.8; white-space: pre-wrap; direction: rtl; text-align: right; font-size: 14px;">${conversation.summary}</div>
          </div>
          ` : ''}

          <!-- Advertisement 1 - מרתיח לידים -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 12px; padding: 24px; margin-bottom: 16px; text-align: center; direction: rtl;">
            <h2 style="color: white; margin: 0 0 12px 0; font-size: 20px; direction: rtl;">🔥 יצרת מגנט וקיבלת לידים?</h2>
            <p style="color: white; margin: 0 0 16px 0; line-height: 1.6; direction: rtl; text-align: right;">
              אם הלידים ששלחתי לך עדיין קרים ואתה לא מצליח לגרום להם לרכוש, כנראה שאתה צריך ליצור במערכת <strong>מרתיח לידים</strong>.
            </p>
            <a href="${seriesInfoUrl}" style="display: inline-block; background: white; color: #ef4444; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-left: 8px; direction: rtl;">
              למידע נוסף על מרתיח לידים
            </a>
            <a href="${calendarUrl}" style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 2px solid white; margin-right: 8px; direction: rtl;">
              📅 קבע פגישה
            </a>
            ${whatsappPhone ? `
            <p style="color: white; margin: 16px 0 0 0; font-size: 14px; direction: rtl; text-align: right;">
              או שלח ווטסאפ: <a href="https://wa.me/${whatsappPhone}" style="color: white; text-decoration: none; direction: ltr; display: inline-block;">${lead.phone}</a>
            </p>
            ` : ''}
          </div>

          <!-- Advertisement 2 - סדנה -->
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; text-align: center; border: 2px solid #667eea; direction: rtl;">
            <h2 style="color: #667eea; margin: 0 0 12px 0; font-size: 18px; direction: rtl;">🎓 רוצה להבין איך עובד מרתיח לידים?</h2>
            <p style="color: #e0e0e0; margin: 0 0 16px 0; line-height: 1.6; direction: rtl; text-align: right;">
              אנו מזמינים אותך לקבל סדנא וירטואלית שתגרום לך להיות מגנט ומרתיח לידים מקצועי.
            </p>
            <a href="${workshopUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; direction: rtl;">
              🎯 רוצה לקבל סדנת לחימום לידים?
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px 0; margin-top: 24px; border-top: 1px solid #333; direction: rtl;">
            <p style="color: #666; margin: 0; font-size: 12px; direction: rtl;">
              נשלח על ידי Magnt.AI - מערכת מגנטים ומחממי לידים
            </p>
          </div>

        </div>
      </body>
      </html>
    `

    // Send email using Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json({ 
        error: 'Email service not configured',
        details: 'RESEND_API_KEY environment variable is missing'
      }, { status: 500 })
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Magnt.AI <noreply@magnt.ai>',
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    })

    if (emailError) {
      console.error('Resend email error:', emailError)
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: emailError.message || 'Unknown error'
      }, { status: 500 })
    }

    console.log('Email sent successfully:', { 
      emailId: emailData?.id, 
      to: recipientEmail 
    })

    return NextResponse.json({ 
      success: true,
      emailId: emailData?.id,
      sentTo: recipientEmail,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
