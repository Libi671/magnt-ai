'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'
import MagntBadge from '@/components/MagntBadge'
import Link from 'next/link'

interface Message {
  role: 'user' | 'model' | 'system'
  content: string
}

interface Task {
  id: string
  title: string
  description: string
  first_question: string
  users: {
    name: string
    avatar_url: string
    id: string
  }
}

interface OtherTask {
  id: string
  title: string
  description: string
  created_at: string
}

type CollectionStep = 'none' | 'name' | 'phone' | 'email' | 'done'

export default function TaskClient({ task, otherTasks }: { task: Task, otherTasks: OtherTask[] }) {
  const [leadId, setLeadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [rating, setRating] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Data collection state
  const [collectionStep, setCollectionStep] = useState<CollectionStep>('none')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [firstBotResponseReceived, setFirstBotResponseReceived] = useState(false)
  const [pendingBotResponse, setPendingBotResponse] = useState<string | null>(null)
  const [firstBotResponse, setFirstBotResponse] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check for cached user info on mount
  useEffect(() => {
    const cachedInfo = localStorage.getItem('magnt_user_info')
    if (cachedInfo) {
      try {
        const { name, phone, email } = JSON.parse(cachedInfo)
        if (name && phone && email) {
          setUserName(name)
          setUserPhone(phone)
          setUserEmail(email)
          setCollectionStep('done')
          createLead(name, phone, email).then(lead => {
            if (lead) setLeadId(lead.id)
          })
        }
      } catch (e) {
        console.error('Error parsing cached user info:', e)
      }
    }
  }, [])

  const saveUserInfoToCache = (name: string, phone: string, email: string) => {
    localStorage.setItem('magnt_user_info', JSON.stringify({ name, phone, email }))
  }

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', content: task.first_question }])
    }
  }, [task.first_question, messages.length])

  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^0[0-9]{8,9}$/.test(cleaned) || /^\+?972[0-9]{8,9}$/.test(cleaned)
  }

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const createLead = async (name: string, phone: string, email: string) => {
    const supabase = createClient()
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        task_id: task.id,
        phone: phone,
        name: name,
        email: email,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return null
    }
    return lead
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')

    if (collectionStep === 'name') {
      setUserName(userMessage)
      setMessages(prev => [...prev,
      { role: 'user', content: userMessage },
      { role: 'system', content: `נעים מאוד ${userMessage}! 📱\n\nמה מספר הטלפון שלך?` }
      ])
      setCollectionStep('phone')
      return
    }

    if (collectionStep === 'phone') {
      if (!isValidPhone(userMessage)) {
        setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'system', content: '❌ המספר שהזנת לא תקין.\n\nאנא הזן מספר טלפון ישראלי תקין (למשל: 0501234567)' }
        ])
        return
      }
      setUserPhone(userMessage)
      setMessages(prev => [...prev,
      { role: 'user', content: userMessage },
      { role: 'system', content: '✅ מעולה!\n\nמה כתובת האימייל שלך?' }
      ])
      setCollectionStep('email')
      return
    }

    if (collectionStep === 'email') {
      if (!isValidEmail(userMessage)) {
        setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'system', content: '❌ כתובת האימייל לא בפורמט תקין.\n\nאנא הזן כתובת אימייל תקינה (למשל: example@email.com)' }
        ])
        return
      }
      setUserEmail(userMessage)
      setMessages(prev => [...prev,
      { role: 'user', content: userMessage },
      { role: 'system', content: '✅ תודה רבה! קיבלתי את כל הפרטים.\n\n📋 בהשארת הפרטים אתה מאשר את התקנון ומסכים לקבל דיוור מיוצר המגנט ומ-Magnt.AI.\n\nבוא נמשיך... 🚀' }
      ])
      setCollectionStep('done')

      const lead = await createLead(userName, userPhone, userMessage)
      if (lead) {
        setLeadId(lead.id)
        saveUserInfoToCache(userName, userPhone, userMessage)
      }

      if (firstBotResponse) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'model', content: firstBotResponse }])
        }, 1000)
      }
      return
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          leadId,
          message: userMessage,
          history: messages.filter(m => m.role !== 'system'),
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('API Error:', data)
        setMessages(prev => [...prev, { role: 'model', content: `שגיאה: ${data.details || data.error}. נסה שוב.` }])
      } else if (data.response) {
        if (!firstBotResponseReceived && collectionStep === 'none') {
          setFirstBotResponseReceived(true)
          setFirstBotResponse(data.response)
          setMessages(prev => [...prev, { role: 'model', content: data.response }])

          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'system',
              content: '💡 לפני שנמשיך, אני צריך כמה פרטים קטנים...\n\nאיך אפשר לפנות אליך? מה השם שלך?'
            }])
            setCollectionStep('name')
          }, 1500)

        } else if (collectionStep !== 'done' && collectionStep !== 'none') {
          setPendingBotResponse(data.response)
        } else {
          setMessages(prev => [...prev, { role: 'model', content: data.response }])
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { role: 'model', content: 'שגיאת רשת. נסה שוב.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (rating > 0 && leadId) {
      const supabase = createClient()
      await supabase
        .from('leads')
        .update({ rating })
        .eq('id', leadId)
    }
    setCompleted(true)
  }

  // Share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `עשיתי את האתגר "${task.title}" ואתם חייבים גם לנסות! 🚀`

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`
    window.open(url, '_blank')
  }

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // Share Modal Component
  const ShareModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={() => setShowShareModal(false)}>
      <div className="card" style={{
        padding: '32px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>וואו איזה כיף שאתה רוצה לשתף!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          אנחנו מציעים לך כמה כלים לשיתוף:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={handleWhatsAppShare} className="btn" style={{
            width: '100%',
            background: '#25D366',
            color: 'white',
            padding: '14px'
          }}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
            שיתוף בוואטסאפ
          </button>

          <button onClick={handleFacebookShare} className="btn" style={{
            width: '100%',
            background: '#1877F2',
            color: 'white',
            padding: '14px'
          }}>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            שיתוף בפייסבוק
          </button>

          <button onClick={handleCopyLink} className="btn btn-secondary" style={{
            width: '100%',
            padding: '14px'
          }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {linkCopied ? '✅ הקישור הועתק!' : 'העתק קישור'}
          </button>
        </div>

        <button
          onClick={() => setShowShareModal(false)}
          style={{
            marginTop: '20px',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          סגור
        </button>
      </div>
    </div>
  )

  // Completed state with sharing options
  if (completed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ padding: '48px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ marginBottom: '12px' }}>סיימת את המשימה בהצלחה!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            אנחנו בטוחים שתרצה לשתף את החוויה שלך עם החברים
          </p>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            באיזה דרך תרצה לשתף?
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleWhatsAppShare} className="btn" style={{
              width: '100%',
              background: '#25D366',
              color: 'white',
              padding: '14px'
            }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              שיתוף בוואטסאפ
            </button>

            <button onClick={handleFacebookShare} className="btn" style={{
              width: '100%',
              background: '#1877F2',
              color: 'white',
              padding: '14px'
            }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              שיתוף בפייסבוק
            </button>

            <button onClick={handleCopyLink} className="btn btn-secondary" style={{
              width: '100%',
              padding: '14px'
            }}>
              {linkCopied ? '✅ הקישור הועתק!' : '🔗 העתק קישור'}
            </button>
          </div>
        </div>
        <MagntBadge />
      </div>
    )
  }

  // Main Chat Layout
  return (
    <div className="task-page-main" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--gradient-dark)'
    }}>
      {/* Header with Creator and Title */}
      <div style={{
        textAlign: 'center',
        padding: '40px 20px 20px',
        background: 'linear-gradient(180deg, rgba(20, 20, 28, 1) 0%, transparent 100%)'
      }}>
        {/* Creator name - Above title */}
        {task.users?.name && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
            מאת {task.users.name}
          </p>
        )}

        {/* Task Title - Dynamic */}
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 800,
          marginBottom: '12px',
          lineHeight: 1.3
        }}>
          {task.title}
        </h1>

        {/* Description */}
        {task.description && (
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {task.description}
          </p>
        )}
      </div>

      {/* Chat Section Header */}
      <div style={{
        textAlign: 'center',
        padding: '16px 20px',
        background: 'rgba(102, 126, 234, 0.08)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          🤖 אתגר חוויתי עם בוט מומחה
        </h2>
      </div>

      {/* Chat Container with Glow Border */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '700px',
        width: '100%',
        margin: '20px auto',
        padding: '0 20px'
      }}>
        <div style={{
          flex: 1,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 0 40px rgba(102, 126, 234, 0.15), 0 0 80px rgba(102, 126, 234, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '300px',
            maxHeight: '50vh'
          }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end'
                }}
              >
                {msg.role !== 'user' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    flexDirection: 'row-reverse'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>
                      🤖
                    </div>
                  </div>
                )}

                <div
                  style={{
                    maxWidth: '85%',
                    padding: '14px 18px',
                    borderRadius: msg.role === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    background: msg.role === 'user'
                      ? 'var(--gradient-primary)'
                      : msg.role === 'system'
                        ? 'rgba(102, 126, 234, 0.15)'
                        : 'rgba(40, 40, 55, 0.9)',
                    border: msg.role !== 'user' ? '1px solid var(--border-color)' : 'none',
                    color: 'white',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '18px 18px 4px 18px',
                  background: 'rgba(40, 40, 55, 0.9)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(20, 20, 28, 0.5)'
          }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ padding: '12px 16px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M12 19l-7-7 7-7M19 12H5" />
                </svg>
              </button>
              <input
                type="text"
                className="input"
                placeholder={
                  collectionStep === 'name' ? 'הכנס את שמך...' :
                    collectionStep === 'phone' ? 'הכנס מספר טלפון...' :
                      collectionStep === 'email' ? 'הכנס כתובת אימייל...' :
                        'כתוב את התשובה שלך...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                dir={collectionStep === 'phone' || collectionStep === 'email' ? 'ltr' : 'rtl'}
                style={{ flex: 1 }}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Rating & Complete */}
      {collectionStep === 'done' && messages.filter(m => m.role !== 'system').length >= 6 && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}>
          <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>סיימת? דרג את החוויה:</p>
            <div className="rating" style={{ justifyContent: 'center', marginBottom: '12px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    color: star <= rating ? '#fbbf24' : 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <button onClick={handleComplete} className="btn btn-accent" style={{ padding: '10px 24px' }}>
              סיים וקבל את התוצאה
            </button>
          </div>
        </div>
      )}

      {/* Other Tasks */}
      {otherTasks && otherTasks.length > 0 && (
        <div style={{
          padding: '40px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(15, 15, 22, 0.6)'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', textAlign: 'center' }}>
              עוד מגנטים מאותו היוצר 🎯
            </h3>
            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '8px',
              flexWrap: showAllTasks ? 'wrap' : 'nowrap',
              justifyContent: showAllTasks ? 'center' : 'flex-start'
            }}>
              {(showAllTasks ? otherTasks : otherTasks.slice(0, 3)).map((otherTask) => (
                <Link key={otherTask.id} href={`/t/${otherTask.id}`} style={{ textDecoration: 'none', minWidth: '260px', flex: '0 0 260px' }}>
                  <div className="card" style={{ padding: '20px', height: '100%', cursor: 'pointer' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: 'white' }}>
                      {otherTask.title}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {otherTask.description?.substring(0, 80)}{otherTask.description?.length > 80 ? '...' : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {otherTasks.length > 3 && !showAllTasks && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAllTasks(true)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 24px' }}
                >
                  עוד משימות ({otherTasks.length - 3}+)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Section - Desktop Only */}
      <div className="desktop-share-section" style={{
        padding: '24px 20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <button onClick={() => setShowShareModal(true)} className="btn btn-accent">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
          שתף את האתגר
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && <ShareModal />}

      {/* Magnt Badge - Desktop Fixed */}
      <Link
        href="/"
        className="desktop-fixed-badge"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 50,
          textDecoration: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '50px',
          fontSize: '0.9rem',
          color: 'white',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          fontWeight: 500
        }}
          className="magnt-badge-hover"
        >
          <img
            src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
            alt="Magnt.AI"
            style={{ height: '24px', width: 'auto' }}
          />
          <span>נוצר עם <strong>Magnt.AI</strong> - ללקוחות ועסקאות</span>
        </div>
      </Link>

      {/* Mobile Sticky Footer */}
      <div className="mobile-sticky-footer">
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
            alt="Magnt.AI"
            style={{ height: '28px' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>נוצר עם <strong style={{ color: 'white' }}>Magnt.AI</strong></span>
        </Link>

        {/* Share Button (Icon only) */}
        <button
          onClick={() => setShowShareModal(true)}
          className="btn btn-accent"
          style={{
            padding: '8px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="שתף את האתגר"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
