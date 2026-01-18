import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get stats
  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
  
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*, tasks!inner(user_id)', { count: 'exact', head: true })
    .eq('tasks.user_id', user?.id)

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'right' }}>
        <h1>שלום, {user?.user_metadata?.full_name?.split(' ')[0] || 'יוצר'}! 👋</h1>
        <p>ברוך הבא לפאנל הניהול שלך</p>
      </div>
      
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>משימות פעילות</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }} className="glow-text">{tasksCount || 0}</div>
        </div>
        
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>לידים שנאספו</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }} className="glow-text">{leadsCount || 0}</div>
        </div>
        
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>שיעור המרה</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }} className="glow-text">
            {leadsCount && tasksCount ? Math.round((leadsCount / tasksCount) * 10) : 0}%
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card" style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>פעולות מהירות</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/dashboard/tasks/new" className="btn btn-primary">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4"/>
            </svg>
            צור משימה חדשה
          </Link>
          
          <Link href="/dashboard/tasks" className="btn btn-secondary">
            צפה בכל המשימות
          </Link>
          
          <Link href="/dashboard/leads" className="btn btn-secondary">
            צפה בלידים
          </Link>
        </div>
      </div>
      
      {/* Getting Started */}
      {(tasksCount === 0 || !tasksCount) && (
        <div className="card" style={{ padding: '32px', marginTop: '24px', background: 'var(--gradient-primary)', border: 'none' }}>
          <h2 style={{ marginBottom: '12px' }}>🚀 בוא נתחיל!</h2>
          <p style={{ marginBottom: '20px', opacity: 0.9 }}>
            צור את המשימה הראשונה שלך ותתחיל לאסוף לידים באמצעות AI
          </p>
          <Link href="/dashboard/tasks/new" className="btn" style={{ background: 'white', color: 'var(--primary-start)' }}>
            צור משימה ראשונה
          </Link>
        </div>
      )}
    </div>
  )
}
