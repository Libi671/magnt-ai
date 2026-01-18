'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'model' | 'system'
  content: string
}

interface Task {
  id: string
  title: string
  description: string
  video_url: string
  first_question: string
  users: {
    name: string
    avatar_url: string
  }
}

type CollectionStep = 'none' | 'name' | 'phone' | 'email' | 'done'

export default function TaskClient({ task }: { task: Task }) {
  const [leadId, setLeadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [rating, setRating] = useState(0)
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
          // Create lead with cached info
          createLead(name, phone, email).then(lead => {
            if (lead) setLeadId(lead.id)
          })
        }
      } catch (e) {
        console.error('Error parsing cached user info:', e)
      }
    }
  }, [])

  // Save user info to localStorage
  const saveUserInfoToCache = (name: string, phone: string, email: string) => {
    localStorage.setItem('magnt_user_info', JSON.stringify({ name, phone, email }))
  }

  // Initialize with first question
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', content: task.first_question }])
    }
  }, [task.first_question, messages.length])

  // Validation functions
  const isValidPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^0[0-9]{8,9}$/.test(cleaned) || /^\+?972[0-9]{8,9}$/.test(cleaned)
  }

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Create lead in database
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

    // Handle data collection steps
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
      { role: 'system', content: '✅ תודה רבה! קיבלתי את כל הפרטים.\n\nבוא נמשיך... 🚀\n\nמקפיץ לך שוב את ההודעה מלמעלה:' }
      ])
      setCollectionStep('done')

      // Create the lead and save to cache
      const lead = await createLead(userName, userPhone, userMessage)
      if (lead) {
        setLeadId(lead.id)
        saveUserInfoToCache(userName, userPhone, userMessage)
      }

      // Re-show the first bot response after a short delay
      if (firstBotResponse) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'model', content: firstBotResponse }])
        }, 1000)
      }
      return
    }

    // Regular message handling
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
        // Check if this is the first bot response (after user's first message)
        if (!firstBotResponseReceived && collectionStep === 'none') {
          setFirstBotResponseReceived(true)
          // Store and show bot response first
          setFirstBotResponse(data.response)
          setMessages(prev => [...prev, { role: 'model', content: data.response }])

          // Then start data collection after a short delay
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'system',
              content: '💡 לפני שנמשיך, אני צריך כמה פרטים קטנים...\n\nאיך אפשר לפנות אליך? מה השם שלך?'
            }])
            setCollectionStep('name')
          }, 1500)

          // Store the next response to show after collection
          // (In case we need it, but actually we'll get new response after)
        } else if (collectionStep !== 'done' && collectionStep !== 'none') {
          // We're in collection mode, save response for later
          setPendingBotResponse(data.response)
        } else {
          // Normal flow
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

  const handleShare = () => {
    const text = `סיימתי את המשימה "${task.title}" ב-Magnt.AI! 🚀\nנסו גם אתם: ${window.location.href}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return null

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    return null
  }

  const embedUrl = getEmbedUrl(task.video_url)

  // Completed state
  if (completed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ padding: '48px', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ marginBottom: '12px' }}>כל הכבוד!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            סיימת את המשימה בהצלחה
          </p>

          <button onClick={handleShare} className="btn btn-accent" style={{ width: '100%' }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            שתף בווטסאפ
          </button>
        </div>
      </div>
    )
  }

  // Chat interface (shown immediately)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass" style={{ padding: '16px 20px' }}>
        <h1 className="glow-text" style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}>{task.title}</h1>
        {task.users?.name && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '4px' }}>
            מאת {task.users.name}
          </p>
        )}
      </header>

      {/* Video (if exists) */}
      {embedUrl && (
        <div className="container" style={{ marginTop: '16px' }}>
          <div className="video-container">
            <iframe
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="container" style={{ marginTop: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            {task.description}
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div className="container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.role === 'user' ? 'user' : 'bot'}${msg.role === 'system' ? ' system' : ''}`}
              style={{ marginBottom: '12px' }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="chat-message bot" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '16px 20px' }}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Rating & Complete (show after collection is done and some messages) */}
      {collectionStep === 'done' && messages.filter(m => m.role !== 'system').length >= 6 && (
        <div className="glass" style={{ padding: '16px', margin: '0 20px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <p style={{ marginBottom: '12px', fontSize: '0.9rem' }}>סיימת? דרג את החוויה:</p>
          <div className="rating" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{ color: star <= rating ? '#fbbf24' : 'var(--text-muted)' }}
              >
                ⭐
              </button>
            ))}
          </div>
          <button onClick={handleComplete} className="btn btn-accent" style={{ padding: '10px 24px' }}>
            סיים וקבל את התוצאה
          </button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input
            type="text"
            className="input"
            placeholder={
              collectionStep === 'name' ? 'הכנס את שמך...' :
                collectionStep === 'phone' ? 'הכנס מספר טלפון...' :
                  collectionStep === 'email' ? 'הכנס כתובת אימייל...' :
                    'כתוב הודעה...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            dir={collectionStep === 'phone' || collectionStep === 'email' ? 'ltr' : 'rtl'}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 19l-7-7 7-7M19 12H5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
