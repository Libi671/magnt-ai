'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    ai_prompt: '',
    first_question: '',
    is_public: true,
    show_conversations: false,
    notify_email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...formData,
          user_id: user?.id,
        })

      if (error) throw error
      
      router.push('/dashboard/tasks')
      router.refresh()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('שגיאה ביצירת המשימה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>צור משימה חדשה</h1>
        <p style={{ color: 'var(--text-secondary)' }}>הגדר משימה אינטראקטיבית מבוססת AI</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>פרטים בסיסיים</h2>
          
          <div className="form-group">
            <label className="form-label">שם המשימה *</label>
            <input
              type="text"
              className="input"
              placeholder="למשל: כתוב את הפוסט הראשון שלך"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">תיאור קצר</label>
            <textarea
              className="input"
              placeholder="תאר בקצרה מה המשתמש יקבל מהמשימה הזו"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">קישור לסרטון (YouTube / Vimeo)</label>
            <input
              type="url"
              className="input"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
              הסרטון יוצג בראש עמוד המשימה
            </small>
          </div>
        </div>
        
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>הגדרות AI</h2>
          
          <div className="form-group">
            <label className="form-label">הנחיות לבוט (System Prompt) *</label>
            <textarea
              className="input"
              style={{ minHeight: '160px' }}
              placeholder={`למשל:
אתה עוזר כתיבה מנוסה. עזור למשתמש לכתוב פוסט ראשון לבלוג שלו.
שאל אותו על הנושא, קהל היעד והמטרה.
בסוף, תן לו טיוטה מוכנה של פוסט.`}
              value={formData.ai_prompt}
              onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">שאלה פותחת *</label>
            <input
              type="text"
              className="input"
              placeholder="למשל: היי! על מה תרצה לכתוב היום?"
              value={formData.first_question}
              onChange={(e) => setFormData({ ...formData, first_question: e.target.value })}
              required
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
              זו ההודעה הראשונה שהבוט ישלח למשתמש
            </small>
          </div>
        </div>
        
        <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '24px', fontSize: '1.2rem' }}>הגדרות</h2>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span>המשימה זמינה לציבור</span>
            </label>
          </div>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.show_conversations}
                onChange={(e) => setFormData({ ...formData, show_conversations: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span>הצג שיחות ציבוריות בפיד</span>
            </label>
          </div>
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">מייל להתראות</label>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={formData.notify_email}
              onChange={(e) => setFormData({ ...formData, notify_email: e.target.value })}
            />
            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
              קבל התראה כשליד משלים את המשימה
            </small>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                שומר...
              </>
            ) : (
              'צור משימה'
            )}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
