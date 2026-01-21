import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EditTaskButton from '@/components/EditTaskButton'

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

  // Get recent tasks (3 most recent)
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, title, description, video_url, ai_prompt, first_question, is_public, show_conversations, notify_email, post_url, created_at')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get recent leads (4 most recent)
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, phone, name, created_at, task_id, tasks!inner(title, user_id)')
    .eq('tasks.user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <div>
      {/* Page Header with Greeting */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem' }}>שלום {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'יוצר'}! 👋</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '8px' }}>נהפוך את הפוסט שלך למגנט לקוחות ועסקאות</p>
      </div>

      {/* Task Creator Chat Preview - with glow background section */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(20, 20, 28, 1) 0%, rgba(30, 32, 44, 1) 100%)',
        padding: '40px 20px',
        borderRadius: '24px',
        marginBottom: '60px',
        position: 'relative'
      }}>
        <Link href="/dashboard/tasks/new" style={{ textDecoration: 'none' }}>
          <div className="card dashboard-chat-card" style={{
            padding: '32px',
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(102, 126, 234, 0.3), 0 0 80px rgba(102, 126, 234, 0.15)',
            border: '1px solid rgba(102, 126, 234, 0.3)'
          }}>
            {/* Chat Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Bot Message */}
              <div className="chat-message bot" style={{ maxWidth: '100%', alignSelf: 'flex-end', color: 'white' }}>
                <div>שלום 🤖</div>
                <div style={{ marginTop: '8px' }}>אני כאן לעזור לך להפוך את הפוסט שלך למגנט לידים</div>
                <div style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
                  מגנט לידים הוא כלי חכם שעובד דרך האתר או הרשתות החברתיות שלך.
                  מפרסמים אותו באתר, מתחת פוסט שלך או כפוסט חדש, כשמישהו לוחץ על הקישור - הוא מקבל חוויה אינטראקטיבית, ואתה מקבל את הפרטים שלו + מידע עמוק מהשיחה.
                </div>
                <div style={{ marginTop: '12px', fontWeight: 500 }}>בוא נתחיל! יש לך פוסט קיים שתרצה להוסיף לו מגנט, או שנתחיל מאפס?</div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>✨ מתחילים מאפס</button>
                <button className="btn btn-secondary" style={{ pointerEvents: 'none' }}>📱 מתחילים מפוסט</button>
              </div>

              {/* Input Preview */}
              <div style={{ display: 'flex', gap: '12px', opacity: 0.6 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="כתוב תשובה..."
                  disabled
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" disabled>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 19l-7-7 7-7M19 12H5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards - different background section */}
      <div style={{
        background: 'rgba(15, 15, 22, 0.6)',
        padding: '32px 20px',
        borderRadius: '24px',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Tasks Card */}
          <Link href="/dashboard/tasks" style={{ textDecoration: 'none' }}>
            <div className="card stat-card" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>🧲 משימות שנוצרו</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px' }} className="glow-text">{tasksCount || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-start)' }}>צפה בכל המשימות →</div>
            </div>
          </Link>

          {/* Leads Card */}
          <Link href="/dashboard/leads" style={{ textDecoration: 'none' }}>
            <div className="card stat-card" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👤 לידים שנאספו</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px' }} className="glow-text">{leadsCount || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-start)' }}>צפה בלידים →</div>
            </div>
          </Link>

          {/* Conversions Card */}
          <Link href="/dashboard/series" style={{ textDecoration: 'none' }}>
            <div className="card stat-card" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>💳 המרות</div>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '8px' }} className="glow-text">0%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-start)' }}>צפה בסדרות החימום שיצרת →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Tasks Section */}
      {recentTasks && recentTasks.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>משימות אחרונות</h2>
            <Link href="/dashboard/tasks/new" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
              + צור משימה חדשה
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTasks.map((task) => (
              <div key={task.id} style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
              }}>
                <Link href={`/t/${task.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{task.title}</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(task.created_at).toLocaleDateString('he-IL')}
                  </span>
                  <EditTaskButton
                    task={task}
                    style={{ padding: '4px 12px', fontSize: '0.8rem', height: '32px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link href="/dashboard/tasks" style={{ color: 'var(--primary-start)', fontSize: '0.9rem' }}>
              לכל המשימות →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Leads Section */}
      {recentLeads && recentLeads.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>לידים אחרונים</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {recentLeads.map((lead: any) => (
              <div key={lead.id} style={{
                padding: '16px',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontWeight: 500, marginBottom: '4px' }}>{lead.name || lead.phone}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.tasks?.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  {new Date(lead.created_at).toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link href="/dashboard/leads" style={{ color: 'var(--primary-start)', fontSize: '0.9rem' }}>
              לכל הלידים →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
