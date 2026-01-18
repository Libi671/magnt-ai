import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function FeedPage() {
  const supabase = await createClient()
  
  // Get all public tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, users(name, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ 
        padding: '32px 20px', 
        textAlign: 'center',
        background: 'var(--gradient-primary)',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Magnt.AI
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          אתגרי שיווק מבוססי AI 🚀
        </p>
        <Link href="/login" className="btn" style={{ 
          marginTop: '20px',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          התחבר כיוצר
        </Link>
      </header>

      {/* Feed Grid */}
      <div className="container">
        {tasks && tasks.length > 0 ? (
          <div className="feed-grid">
            {tasks.map((task) => (
              <Link key={task.id} href={`/t/${task.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '24px', height: '100%' }}>
                  {/* Creator Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    {task.users?.avatar_url && (
                      <img 
                        src={task.users.avatar_url} 
                        alt="" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {task.users?.name || 'יוצר'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(task.created_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>

                  {/* Task Info */}
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>
                    {task.title}
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.9rem', 
                    lineHeight: 1.6,
                    marginBottom: '20px'
                  }}>
                    {task.description?.substring(0, 120)}{task.description?.length > 120 ? '...' : ''}
                  </p>

                  {/* CTA */}
                  <div style={{ 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                      התחל עכשיו →
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      משימה אינטראקטיבית
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '80px 40px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🎯</div>
            <h2 style={{ marginBottom: '16px' }}>עוד אין משימות ציבוריות</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              היה הראשון ליצור משימה ולהתחיל לאסוף לידים
            </p>
            <Link href="/login" className="btn btn-primary">
              התחבר ויצור משימה
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        marginTop: '60px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Magnt.AI © 2024 - פלטפורמת אתגרי שיווק מבוססת AI
        </p>
      </footer>
    </div>
  )
}
