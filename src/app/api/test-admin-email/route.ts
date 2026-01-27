import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization
async function getResend() {
    const { Resend } = await import('resend');
    return new Resend(process.env.RESEND_API_KEY);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function GET(request: NextRequest) {
    try {
        console.log('Test admin email endpoint called')

        // Test AI
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const prompt = `תן 3 רעיונות קצרים לשיפור מגנט לידים בנושא "טיפים לשיווק דיגיטלי". תשובה קצרה בעברית.`

        let aiSuggestions = "לא ניתן היה לייצר הצעות."
        try {
            const result = await model.generateContent(prompt)
            aiSuggestions = result.response.text()
            console.log('AI suggestions generated successfully')
        } catch (aiError) {
            console.error('AI Error:', aiError)
            aiSuggestions = `שגיאת AI: ${aiError}`
        }

        // Test Email
        const emailHtml = `
            <html dir="rtl">
            <body style="font-family: sans-serif; direction: rtl; padding: 20px;">
                <h1>🧪 בדיקת מערכת התראות מנהל</h1>
                <p>זהו מייל בדיקה לוודא שהמערכת עובדת.</p>
                <h2>הצעות AI לבדיקה:</h2>
                <pre style="background: #f0f0f0; padding: 16px; border-radius: 8px;">${aiSuggestions}</pre>
                <p>אם קיבלת את המייל הזה, המערכת עובדת! ✅</p>
            </body>
            </html>
        `

        const resend = await getResend()
        console.log('Sending test email to libi41@gmail.com...')

        const emailResult = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Magnt.AI <leads@wamagnet.com>',
            to: 'libi41@gmail.com',
            subject: '🧪 בדיקת מערכת התראות - Magnt.AI',
            html: emailHtml
        })

        console.log('Email result:', emailResult)

        return NextResponse.json({
            success: true,
            message: 'Test email sent to libi41@gmail.com',
            emailResult,
            aiSuggestions
        })

    } catch (error) {
        console.error('Test admin email error:', error)
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 })
    }
}
