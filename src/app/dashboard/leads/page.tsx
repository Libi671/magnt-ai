import { createClient } from '@/lib/supabase/server'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: leads } = await supabase
    .from('leads')
    .select('*, tasks!inner(title, user_id), conversations(summary)')
    .eq('tasks.user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>הלידים שלי</h1>
        <p style={{ color: 'var(--text-secondary)' }}>כל הלידים שנאספו מהמשימות שלך</p>
      </div>
      
      {leads && leads.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>טלפון</th>
                <th>משימה</th>
                <th>דירוג</th>
                <th>סיכום שיחה</th>
                <th>תאריך</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 500 }}>
                    <a href={`tel:${lead.phone}`} style={{ color: 'var(--primary-start)', textDecoration: 'none' }}>
                      {lead.phone}
                    </a>
                  </td>
                  <td>{lead.tasks?.title}</td>
                  <td>
                    {lead.rating ? (
                      <span style={{ color: '#fbbf24' }}>
                        {'⭐'.repeat(lead.rating)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {lead.conversations?.[0]?.summary || 'אין סיכום'}
                    </p>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {new Date(lead.created_at).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📱</div>
          <h2 style={{ marginBottom: '12px' }}>אין לידים עדיין</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            כשמשתמשים ישלימו משימות, הלידים יופיעו כאן
          </p>
        </div>
      )}
    </div>
  )
}
