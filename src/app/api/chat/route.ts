import { chat, summarizeConversation, Message } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create a simple Supabase client for API routes (no cookies needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, leadId, message, history } = body

    console.log('Chat API called:', { taskId, leadId, message })

    // Get task to get the AI prompt
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('ai_prompt, user_id, notify_email')
      .eq('id', taskId)
      .single()

    if (taskError) {
      console.error('Task fetch error:', taskError)
      return NextResponse.json({ error: 'Task not found', details: taskError.message }, { status: 404 })
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    console.log('Task found, generating AI response...')

    // Generate AI response
    const aiResponse = await chat(
      task.ai_prompt,
      history as Message[],
      message
    )

    console.log('AI response generated:', aiResponse.substring(0, 100))

    // If this looks like a completion message, save the summary
    const conversationHistory = [...history, { role: 'user', content: message }, { role: 'model', content: aiResponse }]

    if (conversationHistory.length >= 6) {
      try {
        // Generate summary after a few exchanges
        const summary = await summarizeConversation(conversationHistory as Message[])

        // Save or update conversation summary
        await supabase
          .from('conversations')
          .upsert({
            lead_id: leadId,
            summary,
            is_public: false,
          }, {
            onConflict: 'lead_id'
          })
      } catch (summaryError) {
        console.error('Summary error:', summaryError)
        // Don't fail the whole request if summary fails
      }
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
