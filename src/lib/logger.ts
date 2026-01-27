import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin client for logging (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface LogEntry {
    user_type: 'guest' | 'registered'
    user_id?: string | null
    user_email?: string | null
    user_name?: string | null
    interaction_type: 'hero_chat' | 'task_creation' | 'task_execution' | 'system_action'
    question: string
    answer: string
    page_url?: string
    metadata?: any
}

export async function logInteraction(entry: LogEntry) {
    try {
        // Fire and forget - don't await the insertion if we don't want to block, 
        // but in Vercel serverless we must await or use `waitUntil`.
        // We will await it to be safe.
        const { error } = await supabaseAdmin
            .from('ai_logs')
            .insert([
                {
                    user_type: entry.user_type,
                    user_id: entry.user_id,
                    user_email: entry.user_email,
                    user_name: entry.user_name,
                    interaction_type: entry.interaction_type,
                    question: entry.question,
                    answer: entry.answer,
                    page_url: entry.page_url,
                    metadata: entry.metadata,
                    created_at: new Date().toISOString(),
                }
            ])

        if (error) {
            console.error('Error logging interaction:', error)
        }
    } catch (err) {
        console.error('Failed to log interaction:', err)
    }
}
