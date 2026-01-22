import { NextRequest, NextResponse } from 'next/server'
import { sendLeadNotificationEmail } from '@/lib/email-service'

// Test endpoint to verify email sending works
// Usage: GET /api/test-email?email=your@email.com
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const testEmail = searchParams.get('email') || 'LIBI41@gmail.com'

    console.log('Testing email send to:', testEmail)

    try {
        const result = await sendLeadNotificationEmail({
            taskTitle: 'מגנט בדיקה',
            taskCreatorEmail: testEmail,
            leadName: 'ליד לבדיקה',
            leadPhone: '0501234567',
            leadEmail: 'test@example.com',
            hasEnoughMessages: true,
            messageCount: 5,
            analysis: {
                summary: 'זהו סיכום בדיקה של שיחה עם ליד פוטנציאלי שהתעניין במוצר.',
                pains: ['אין לו מספיק זמן', 'לא יודע איך להתחיל', 'חסר ידע טכני'],
                benefits: ['יחסוך זמן', 'יקבל תמיכה מקצועית', 'יראה תוצאות מהר'],
                salesScript: '1. פתח בשאלה על הזמן שלו\n2. הצג את הפתרון שחוסך זמן\n3. הדגש את התמיכה המקצועית\n4. הצע שיחת היכרות קצרה'
            }
        })

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `אימייל נשלח בהצלחה ל-${testEmail}`,
                data: result.data
            })
        } else {
            return NextResponse.json({
                success: false,
                message: 'שליחת האימייל נכשלה',
                error: result.error
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Test email error:', error)
        return NextResponse.json({
            success: false,
            message: 'שגיאה בשליחת אימייל',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
