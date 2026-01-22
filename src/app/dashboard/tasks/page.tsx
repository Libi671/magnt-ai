import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'
import EditTaskButton from '@/components/EditTaskButton'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('TasksPage - user:', user?.id, user?.email)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*, leads(count)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  console.log('TasksPage - tasks:', tasks?.length, 'error:', error)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>המגנטים שלי</h1>
          <p style={{ color: 'var(--text-secondary)' }}>נהל את כל המגנטים שיצרת</p>
        </div>
        <Link href="/dashboard/tasks/new" className="btn btn-primary">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          משימה חדשה
        </Link>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="feed-grid">
          {tasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{task.title}</h3>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                {task.description?.substring(0, 100)}{task.description?.length > 100 ? '...' : ''}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {task.leads?.[0]?.count || 0} לידים
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <EditTaskButton
                    task={task}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  />
                  <Link
                    href={`/t/${task.id}`}
                    target="_blank"
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    צפה
                  </Link>
                  <ShareButton
                    taskId={task.id}
                    title={task.title}
                    className="btn btn-accent"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📝</div>
          <h2 style={{ marginBottom: '12px' }}>אין לך מגנטים עדיין</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            צור את המשימה הראשונה שלך ותתחיל לאסוף לידים
          </p>
          <Link href="/dashboard/tasks/new" className="btn btn-primary">
            צור משימה ראשונה
          </Link>
        </div>
      )}
    </div>
  )
}
