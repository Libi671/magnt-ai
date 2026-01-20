import { createClient } from '@/lib/supabase/server'
import SeriesClient from './SeriesClient'

export const dynamic = 'force-dynamic'

export default async function SeriesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get leads count for personalization
    let leadsCount = 0
    let userName = ''

    if (user) {
        // Get user name
        userName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''

        // Get leads count
        const { count } = await supabase
            .from('leads')
            .select('*, tasks!inner(user_id)', { count: 'exact', head: true })
            .eq('tasks.user_id', user.id)

        leadsCount = count || 0
    }

    return (
        <SeriesClient leadsCount={leadsCount} userName={userName} />
    )
}
