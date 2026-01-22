import { createClient } from '@/lib/supabase/server'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, tasks!inner(title, user_id), conversations(summary)')
    .eq('tasks.user_id', user?.id)
    .order('created_at', { ascending: false })

  // Remove duplicate leads by phone
  const uniqueLeads = leads?.reduce((acc: typeof leads, lead) => {
    const existingLead = acc?.find(l => l.phone === lead.phone && l.task_id === lead.task_id)
    if (!existingLead) {
      acc?.push(lead)
    }
    return acc
  }, [] as typeof leads)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>הלידים שלי</h1>
        <p style={{ color: 'var(--text-secondary)' }}>כל הלידים שנאספו מהמגנטים שלך</p>
      </div>

      {uniqueLeads && uniqueLeads.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>סטטוס</th>
                <th>משימה</th>
                <th>דירוג</th>
                <th>סיכום שיחה</th>
                <th>תאריך</th>
              </tr>
            </thead>
            <tbody>
              {uniqueLeads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 500 }}>
                    {lead.name || '-'}
                  </td>
                  <td>
                    <a href={`tel:${lead.phone}`} style={{ color: 'var(--primary-start)', textDecoration: 'none' }}>
                      {lead.phone}
                    </a>
                  </td>
                  <td>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} style={{ color: 'var(--primary-start)', textDecoration: 'none' }}>
                        {lead.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      background: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24'
                    }}>
                      🔥 מתחמם
                    </span>
                  </td>
                  <td>{lead.tasks?.title}</td>
                  <td>
                    {lead.rating ? (
                      <span style={{ color: '#fbbf24' }}>
                        {'⭐'.repeat(lead.rating)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>יש לשדרג את התוכנית</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      סיכום לא כלול בתוכנית החינמית
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
            כשמשתמשים ישתתפו במגנטים, הלידים יופיעו כאן
          </p>
        </div>
      )}
    </div>
  )
}
