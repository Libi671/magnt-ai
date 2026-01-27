import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization to avoid build-time errors
async function getResend() {
  const { Resend } = await import('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

// Create Supabase Admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, userId, isPhoneUpdate } = body

    console.log('Notify Admin API called:', { taskId, userId, isPhoneUpdate })

    // 1. Fetch Task Details (and re-fetch user to get latest phone if updated)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 2. Fetch User Details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email, phone')
      .eq('id', userId)
      .single()

    // If we're updating after phone input, verify we actually have a phone now
    // If not, we still send the email, just without phone.

    // 3. Generate AI Suggestions
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const prompt = `
      נתח את המגנט הבא ותן 3 רעיונות יצירתיים לשיפור כדי להפוך אותו לממיר יותר.
      תן את הרעיונות כרשימה ממוספרת, קצרים ולעניין.

      כותרת: ${task.title}
      תיאור: ${task.description}
      הנחיות לבוט: ${task.ai_prompt}
      שאלה פותחת: ${task.first_question}
      
      דגשים:
      - האם ההבטחה ברורה?
      - האם ה"הוק" (Hook) חזק מספיק?
      - האם הערך ברור?
      
      החזר רק את 3 הרעיונות, בעברית.
    `

    let aiSuggestions = "לא ניתן היה לייצר הצעות כרגע."
    try {
      const result = await model.generateContent(prompt)
      aiSuggestions = result.response.text()
    } catch (aiError) {
      console.error('AI Suggestion Error:', aiError)
    }

    // 4. Send Email to Admin
    const whatsappLink = user?.phone
      ? `https://wa.me/972${user.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`
      : '#'

    const magnetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://magnt.ai'}/t/${taskId}`

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <body style="font-family: sans-serif; direction: rtl; text-align: right; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <h1 style="color: #4f46e5; margin-bottom: 24px; text-align: center;">🚀 מגנט חדש נוצר במערכת!</h1>
          
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #1e40af;">👤 פרטי היוצר</h2>
            <p style="margin: 4px 0;"><strong>שם:</strong> ${user?.name || 'לא ידוע'}</p>
            <p style="margin: 4px 0;"><strong>אימייל:</strong> <a href="mailto:${user?.email}">${user?.email}</a></p>
            <p style="margin: 4px 0;"><strong>טלפון:</strong> ${user?.phone || 'לא הוזן'}</p>
            ${user?.phone ? `
                <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; margin-top: 8px;">
                    💬 שלח הודעה בוואטסאפ
                </a>
            ` : ''}
          </div>

          <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin: 0 0 12px 0;">🧲 פרטי המגנט</h2>
            <p style="margin: 4px 0;"><strong>כותרת:</strong> ${task.title}</p>
            <p style="margin: 4px 0;"><strong>תיאור:</strong> ${task.description}</p>
            <div style="margin-top: 12px;">
                <a href="${magnetLink}" style="color: #4f46e5; font-weight: bold;">🔗 קישור למגנט</a>
            </div>
          </div>

          <div style="background: #fdf4ff; padding: 16px; border-radius: 8px; border: 1px solid #fae8ff;">
            <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #86198f;">✨ 3 רעיונות לשיפור (מבוסס AI)</h2>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #4a044e;">${aiSuggestions}</div>
          </div>
          
          <div style="text-align: center; margin-top: 32px; font-size: 12px; color: #6b7280;">
            Magnt.AI Admin Notification System
          </div>
        </div>
      </body>
      </html>
    `

    const resend = await getResend()
    console.log('Sending admin email to libi41@gmail.com for task:', task.title)
    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Magnt.AI <leads@wamagnet.com>',
      to: 'libi41@gmail.com',
      subject: `🆕 מגנט חדש: ${task.title} (מאת: ${user?.name || user?.email})`,
      html: emailHtml
    })
    console.log('Email sent result:', emailResult)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Admin notification error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
