import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeLeadConversation, Message } from '@/lib/gemini'
import { sendLeadNotificationEmail } from '@/lib/email-service'

// Create a Supabase client with Admin (Service Role) privileges to bypass RLS
// This is required because the API route runs on the server and needs to access user data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { leadId } = body

        if (!leadId) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
        }

        console.log('🔍 [API] Send lead email called for leadId:', leadId)

        // Get lead with task and conversation data
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select(`
        *,
        tasks!inner(id, title, user_id, notify_email),
        conversations(full_chat, summary)
      `)
            .eq('id', leadId)
            .single()

        if (leadError) {
            console.error('❌ [API] DB Error fetching lead:', leadError)
            return NextResponse.json({ error: 'Lead not found', details: leadError }, { status: 404 })
        }

        if (!lead) {
            console.error('❌ [API] Lead not found (null result)')
            return NextResponse.json({ error: 'Lead is null' }, { status: 404 })
        }

        console.log('✅ [API] Found lead:', lead.id, 'Task Title:', lead.tasks?.title)

        // Check if email was already sent
        if (lead.email_sent) {
            console.log('⚠️ [API] Email ALREADY sent for lead:', leadId)
            return NextResponse.json({ message: 'Email already sent' }, { status: 200 })
        }

        // Get task creator email
        const taskCreatorEmail = lead.tasks?.notify_email
        console.log('📧 [API] Task creator email:', taskCreatorEmail)

        if (!taskCreatorEmail) {
            console.error('❌ [API] No notify_email configured for task:', lead.tasks?.id)
            return NextResponse.json({ error: 'No notify email configured for this task' }, { status: 400 })
        }

        // Get conversation messages
        const fullChat = lead.conversations?.[0]?.full_chat as Message[] || []
        const messageCount = fullChat.filter((m: Message) => m.role === 'user').length
        const hasEnoughMessages = messageCount >= 4

        console.log(`Lead has ${messageCount} user messages, hasEnoughMessages: ${hasEnoughMessages}`)

        // Analyze conversation if enough messages
        let analysis = undefined
        let summary = lead.conversations?.[0]?.summary || ''

        if (hasEnoughMessages && fullChat.length > 0) {
            try {
                analysis = await analyzeLeadConversation(fullChat)
                summary = analysis.summary
                console.log('AI analysis completed:', analysis)
            } catch (analysisError) {
                console.error('Analysis error:', analysisError)
            }
        }

        // Save summary to conversations table
        if (summary && lead.conversations?.[0]) {
            await supabase
                .from('conversations')
                .update({ summary })
                .eq('lead_id', leadId)
        }

        // Send email
        const emailResult = await sendLeadNotificationEmail({
            taskTitle: lead.tasks.title,
            taskCreatorEmail,
            leadName: lead.name || 'לא צוין',
            leadPhone: lead.phone,
            leadEmail: lead.email || 'לא צוין',
            analysis,
            hasEnoughMessages,
            messageCount,
        })

        if (!emailResult.success) {
            console.error('Email send failed:', emailResult.error)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        // Mark email as sent
        await supabase
            .from('leads')
            .update({ email_sent: true })
            .eq('id', leadId)

        console.log('Lead notification email sent successfully')
        return NextResponse.json({ success: true, message: 'Email sent successfully' })

    } catch (error) {
        console.error('Send lead email error:', error)
        return NextResponse.json({
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
