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
  // Local state for abandonment tracking
  const [emailSent, setEmailSent] = useState(false)
  const lastActivityRef = useRef<number>(Date.now())
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Remote state for notification and diagnostics
  const [emailSending, setEmailSending] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, any> | null>(null)

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
          console.log('Loading cached user info, creating/finding lead...')
          createLead(name, phone, email).then(lead => {
            if (lead) {
              console.log('Lead found/created from cache, setting leadId to:', lead.id)
              setLeadId(lead.id)
            } else {
              console.error('Failed to create/find lead from cache')
            }
          }).catch(error => {
            console.error('Error in createLead from cache:', error)
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
    try {
      console.log('Creating lead via API:', { taskId: task.id, name, phone, email })

      const response = await fetch('/api/create-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          name: name,
          phone: phone,
          email: email,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Error creating lead via API:', data)
        return null
      }

      if (data.success && data.lead) {
        console.log('Lead created/updated successfully via API:', data.lead)
        return data.lead
      }

      return null
    } catch (error) {
      console.error('Error in createLead function:', error)
      return null
    }
  }

  // Save full chat to database
  const saveFullChat = async (updatedMessages: Message[], currentLeadId: string) => {
    if (!currentLeadId) return
    const supabase = createClient()
    const chatMessages = updatedMessages.filter(m => m.role !== 'system')

    await supabase
      .from('conversations')
      .upsert({
        lead_id: currentLeadId,
        full_chat: chatMessages,
        is_public: false,
      }, {
        onConflict: 'lead_id'
      })
  }

  // Refs to avoid stale closures
  const leadIdRef = useRef<string | null>(null)
  const emailSentRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => {
    leadIdRef.current = leadId
  }, [leadId])

  useEffect(() => {
    emailSentRef.current = emailSent
  }, [emailSent])

  // Send lead notification email
  // Send lead notification email
  const sendLeadEmail = () => {
    const currentLeadId = leadIdRef.current
    if (!currentLeadId || emailSentRef.current) return

    emailSentRef.current = true
    setEmailSent(true)

    try {
      console.log('🚀 [Client] Sending lead email request for:', currentLeadId)

      // Use sendBeacon only when page is closing/hidden required reliability during unload
      const isLeaving = document.visibilityState === 'hidden';

      if (navigator.sendBeacon && isLeaving) {
        console.log('📡 [Client] Page unloading - using navigator.sendBeacon')
        const blob = new Blob([JSON.stringify({ leadId: currentLeadId })], { type: 'application/json' });
        const success = navigator.sendBeacon('/api/send-lead-email', blob);
        console.log('📡 [Client] sendBeacon result:', success)
      } else {
        console.log('📡 [Client] Using fetch (better for debugging & active page)')
        fetch('/api/send-lead-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: currentLeadId }),
          keepalive: true
        }).then(async res => {
          console.log(`✅ [Client] API Status: ${res.status} ${res.statusText}`)
          const text = await res.text()
          try {
            const json = JSON.parse(text)
            console.log('📄 [Client] Response JSON:', json)
          } catch (e) {
            console.log('📄 [Client] Response Text:', text)
          }

          if (!res.ok) {
            console.error('❌ [Client] Server returned error:', res.status)
          }
        }).catch(err => console.error('❌ [Client] Fetch network error:', err))
      }
    } catch (error) {
      console.error('❌ [Client] Error calling sendLeadEmail:', error)
    }
  }

  // Detect page leave/abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendLeadEmail()
    }

    const handleVisibilityChange = () => {
      if (document.hidden && leadIdRef.current && !emailSentRef.current) {
        // User switched to another tab - send email after a short delay
        setTimeout(() => {
          if (document.hidden) {
            sendLeadEmail()
          }
        }, 5000) // Wait 5 seconds to confirm they really left
      }
    }

    // Set up inactivity timer (2 minutes)
    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now()
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      inactivityTimerRef.current = setTimeout(() => {
        if (leadIdRef.current && !emailSentRef.current) {
          console.log('Inactivity timeout - sending email')
          sendLeadEmail()
        }
      }, 2 * 60 * 1000) // 2 minutes
    }

    resetInactivityTimer()

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('mousemove', resetInactivityTimer)
    window.addEventListener('keydown', resetInactivityTimer)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('mousemove', resetInactivityTimer)
      window.removeEventListener('keydown', resetInactivityTimer)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, []) // Empty deps - uses refs instead

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

      console.log('Creating lead with:', { userName, userPhone, email: userMessage, taskId: task.id })
      const lead = await createLead(userName, userPhone, userMessage)
      if (lead) {
        console.log('Lead created/updated successfully, setting leadId to:', lead.id)
        setLeadId(lead.id)
        saveUserInfoToCache(userName, userPhone, userMessage)
      } else {
        console.error('Failed to create/update lead - lead is null')
        // Try to find existing lead as fallback
        const supabase = createClient()
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('task_id', task.id)
          .or(`email.eq.${userMessage},phone.eq.${userPhone}`)
          .maybeSingle()

        if (existingLead) {
          console.log('Found existing lead as fallback:', existingLead.id)
          setLeadId(existingLead.id)
        }
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
          const newMessages = [...messages, { role: 'user' as const, content: userMessage }, { role: 'model' as const, content: data.response }]
          setMessages(prev => [...prev, { role: 'model', content: data.response }])
          // Save full chat after each message
          if (leadId) saveFullChat(newMessages, leadId)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { role: 'model', content: 'שגיאת רשת. נסה שוב.' }])
    } finally {
      setLoading(false)
    }
  }

  const sendNotificationEmail = async (showDiagnosticInfo = false) => {
    if (!leadId) {
      setEmailStatus({ success: false, message: '❌ אין ID של ליד - לא ניתן לשלוח אימייל' })
      return
    }

    setEmailSending(true)
    setEmailStatus(null)

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          leadId: leadId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error('Email sending error:', data)
        setEmailStatus({
          success: false,
          message: `❌ שגיאה בשליחת אימייל: ${data.details || data.error}`
        })
      } else {
        console.log('Email sent successfully:', data)
        setEmailStatus({
          success: true,
          message: `✅ אימייל נשלח בהצלחה ל-${data.sentTo}`
        })
      }
    } catch (error) {
      console.error('Error sending notification email:', error)
      setEmailStatus({
        success: false,
        message: `❌ שגיאת רשת: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`
      })
    } finally {
      setEmailSending(false)
    }
  }

  const getDiagnosticInfo = async () => {
    const supabase = createClient()
    const diagnostics: Record<string, any> = {
      leadId: leadId || '❌ אין',
      userName: userName || '❌ אין',
      userPhone: userPhone || '❌ אין',
      userEmail: userEmail || '❌ אין',
      taskId: task.id,
    }

    // If we have leadId, get lead info from database
    if (leadId && leadId !== '❌ אין') {
      const { data: leadData } = await supabase
        .from('leads')
        .select('name, email, phone, rating')
        .eq('id', leadId)
        .single()

      if (leadData) {
        diagnostics.leadName = leadData.name || '❌ אין'
        diagnostics.leadEmail = leadData.email || '❌ אין'
        diagnostics.leadPhone = leadData.phone || '❌ אין'
        diagnostics.leadRating = leadData.rating || '❌ אין'
      }
    } else if (userEmail || userPhone) {
      // Try to find existing lead by email or phone
      console.log('No leadId found, searching for existing lead by email/phone...')
      const searchConditions = []
      if (userEmail) searchConditions.push(`email.eq.${userEmail}`)
      if (userPhone) searchConditions.push(`phone.eq.${userPhone}`)

      if (searchConditions.length > 0) {
        const { data: existingLead, error: searchError } = await supabase
          .from('leads')
          .select('id, name, email, phone, rating')
          .eq('task_id', task.id)
          .or(searchConditions.join(','))
          .maybeSingle()

        if (existingLead) {
          console.log('Found existing lead:', existingLead)
          diagnostics.leadId = existingLead.id
          diagnostics.leadName = existingLead.name || '❌ אין'
          diagnostics.leadEmail = existingLead.email || '❌ אין'
          diagnostics.leadPhone = existingLead.phone || '❌ אין'
          diagnostics.leadRating = existingLead.rating || '❌ אין'

          // Update state with found leadId
          if (!leadId) {
            console.log('Setting leadId from found lead:', existingLead.id)
            setLeadId(existingLead.id)
          }
        } else {
          console.log('No existing lead found, searchError:', searchError)
          // If we have all user data but no lead, try to create one
          if (userName && userPhone && userEmail) {
            console.log('Attempting to create lead with existing user data...')
            const newLead = await createLead(userName, userPhone, userEmail)
            if (newLead) {
              console.log('Successfully created lead:', newLead.id)
              diagnostics.leadId = newLead.id
              diagnostics.leadName = newLead.name || '❌ אין'
              diagnostics.leadEmail = newLead.email || '❌ אין'
              diagnostics.leadPhone = newLead.phone || '❌ אין'
              setLeadId(newLead.id)
            }
          }
        }
      }
    }

    // Get task info including notify_email and user info
    const { data: taskData } = await supabase
      .from('tasks')
      .select('notify_email, user_id')
      .eq('id', task.id)
      .single()

    if (taskData) {
      diagnostics.taskNotifyEmail = taskData.notify_email || '❌ אין'
      diagnostics.taskUserId = taskData.user_id || '❌ אין'

      // Get user email if user_id exists
      if (taskData.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', taskData.user_id)
          .single()

        if (userData) {
          diagnostics.taskUserEmail = userData.email || '❌ אין'
          diagnostics.taskUserName = userData.name || '❌ אין'
        }
      }

      // Determine recipient email
      diagnostics.recipientEmail = taskData.notify_email || diagnostics.taskUserEmail || '❌ אין'
    }

    // Check if we have all required data for sending
    diagnostics.hasAllData = !!(
      diagnostics.leadId &&
      diagnostics.leadId !== '❌ אין' &&
      diagnostics.recipientEmail &&
      diagnostics.recipientEmail !== '❌ אין'
    )

    return diagnostics
  }

  // Update diagnostic info when relevant data changes
  useEffect(() => {
    const updateDiagnostics = async () => {
      const diag = await getDiagnosticInfo()
      setDiagnosticInfo(diag)
    }
    updateDiagnostics()
  }, [leadId, userName, userPhone, userEmail, task.id])

  const handleComplete = async () => {
    if (rating > 0 && leadId) {
      const supabase = createClient()
      await supabase
        .from('leads')
        .update({ rating })
        .eq('id', leadId)
    }
    // Send email notification when task is completed (Remote logic)
    await sendNotificationEmail(false)
    setEmailSent(true) // Prevent abandonment email (Local logic)
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
      {/* 🛠️ DEBUG BUTTON - REMOVE LATER */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'rgba(120, 0, 0, 0.9)',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid red',
        color: 'white',
        fontSize: '12px',
        maxWidth: '200px'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>🐞 דיבוג אימייל</p>
        <p>Lead ID: {leadId ? 'V' : 'X'}</p>
        <p>Sent: {emailSent ? 'Yes' : 'No'}</p>
        <button
          onClick={() => {
            if (!leadId) {
              alert('⚠️ אין ליד עדיין! תתחיל שיחה והזן פרטים');
              return;
            }
            alert('🚀 מנסה לשלוח אימייל... בדוק את ה-Console (F12)');
            // Reset flags to force send
            emailSentRef.current = false;
            setEmailSent(false);
            setTimeout(() => sendLeadEmail(), 100);
          }}
          style={{
            marginTop: '8px',
            background: '#ff0000',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold'
          }}
        >
          שלח אימייל ידנית
        </button>
      </div>
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
            <button onClick={handleComplete} className="btn btn-accent" style={{ padding: '10px 24px', marginBottom: '12px' }}>
              סיים וקבל את התוצאה
            </button>

            {/* Send Now Button for Testing */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={async () => {
                  setShowDiagnostics(!showDiagnostics)
                  if (!showDiagnostics) {
                    const diag = await getDiagnosticInfo()
                    setDiagnosticInfo(diag)
                  }
                }}
                disabled={emailSending}
                className="btn btn-secondary"
                style={{
                  padding: '12px 24px',
                  marginBottom: '12px',
                  width: '100%',
                  cursor: emailSending ? 'not-allowed' : 'pointer',
                  opacity: emailSending ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  textAlign: 'right'
                }}
              >
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{emailSending ? '⏳ שולח...' : showDiagnostics ? '🔽 הסתר' : '📧 הצג מידע דיאגנוסטי ושלח אימייל'}</span>
                </div>
                {diagnosticInfo && !showDiagnostics && (
                  <div style={{
                    width: '100%',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lead ID:</span>
                      <span style={{ color: diagnosticInfo.leadId !== '❌ אין' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {diagnosticInfo.leadId !== '❌ אין' ? '✅' : '❌'} {diagnosticInfo.leadId}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>שם:</span>
                      <span style={{ color: (diagnosticInfo.leadName && diagnosticInfo.leadName !== '❌ אין') || (diagnosticInfo.userName && diagnosticInfo.userName !== '❌ אין') ? '#22c55e' : '#ef4444' }}>
                        {(diagnosticInfo.leadName && diagnosticInfo.leadName !== '❌ אין') || (diagnosticInfo.userName && diagnosticInfo.userName !== '❌ אין') ? '✅' : '❌'} {diagnosticInfo.leadName || diagnosticInfo.userName || '❌ אין'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>אימייל:</span>
                      <span style={{ color: (diagnosticInfo.leadEmail && diagnosticInfo.leadEmail !== '❌ אין') || (diagnosticInfo.userEmail && diagnosticInfo.userEmail !== '❌ אין') ? '#22c55e' : '#ef4444' }}>
                        {(diagnosticInfo.leadEmail && diagnosticInfo.leadEmail !== '❌ אין') || (diagnosticInfo.userEmail && diagnosticInfo.userEmail !== '❌ אין') ? '✅' : '❌'} {diagnosticInfo.leadEmail || diagnosticInfo.userEmail || '❌ אין'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>אימייל יעד:</span>
                      <span style={{ color: diagnosticInfo.recipientEmail && diagnosticInfo.recipientEmail !== '❌ אין' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {diagnosticInfo.recipientEmail && diagnosticInfo.recipientEmail !== '❌ אין' ? '✅' : '❌'} {diagnosticInfo.recipientEmail || '❌ אין'}
                      </span>
                    </div>
                    <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <strong style={{ color: diagnosticInfo.hasAllData ? '#22c55e' : '#ef4444' }}>
                        {diagnosticInfo.hasAllData ? '✅ מוכן לשליחה' : '❌ חסרים נתונים'}
                      </strong>
                    </div>
                  </div>
                )}
              </button>

              {/* Diagnostic Info - Always show when expanded */}
              {showDiagnostics && diagnosticInfo && (
                <div style={{
                  background: 'rgba(40, 40, 55, 0.9)',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  textAlign: 'right',
                  fontSize: '0.9rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <p style={{ marginBottom: '16px', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>
                    🔍 מידע דיאגנוסטי לשליחת אימייל:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                    <div style={{
                      padding: '12px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>📋 פרטי הליד:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Lead ID:</strong> <span style={{ color: diagnosticInfo.leadId !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.leadId}</span></div>
                        <div><strong>שם:</strong> <span style={{ color: diagnosticInfo.leadName && diagnosticInfo.leadName !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.leadName || diagnosticInfo.userName}</span></div>
                        <div><strong>טלפון:</strong> <span style={{ color: diagnosticInfo.leadPhone && diagnosticInfo.leadPhone !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.leadPhone || diagnosticInfo.userPhone}</span></div>
                        <div><strong>אימייל:</strong> <span style={{ color: diagnosticInfo.leadEmail && diagnosticInfo.leadEmail !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.leadEmail || diagnosticInfo.userEmail}</span></div>
                        {diagnosticInfo.leadRating && diagnosticInfo.leadRating !== '❌ אין' && (
                          <div><strong>דירוג:</strong> {diagnosticInfo.leadRating}/5</div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'rgba(118, 75, 162, 0.1)',
                      borderRadius: '6px',
                      border: '1px solid rgba(118, 75, 162, 0.2)'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>🎯 פרטי המשימה:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Task ID:</strong> {diagnosticInfo.taskId}</div>
                        <div><strong>User ID (יוצר):</strong> <span style={{ color: diagnosticInfo.taskUserId !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.taskUserId}</span></div>
                        <div><strong>שם יוצר:</strong> <span style={{ color: diagnosticInfo.taskUserName && diagnosticInfo.taskUserName !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.taskUserName || '❌ אין'}</span></div>
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: diagnosticInfo.hasAllData ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '6px',
                      border: `1px solid ${diagnosticInfo.hasAllData ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>📧 פרטי שליחת אימייל:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Notify Email (מועדף):</strong> <span style={{ color: diagnosticInfo.taskNotifyEmail !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.taskNotifyEmail}</span></div>
                        <div><strong>User Email (גיבוי):</strong> <span style={{ color: diagnosticInfo.taskUserEmail !== '❌ אין' ? '#22c55e' : '#ef4444' }}>{diagnosticInfo.taskUserEmail}</span></div>
                        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                          <strong>📬 אימייל יעד (סופי):</strong> <span style={{
                            color: diagnosticInfo.recipientEmail !== '❌ אין' ? '#22c55e' : '#ef4444',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}>{diagnosticInfo.recipientEmail}</span>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <strong>סטטוס:</strong> <span style={{
                            color: diagnosticInfo.hasAllData ? '#22c55e' : '#ef4444',
                            fontWeight: 'bold'
                          }}>
                            {diagnosticInfo.hasAllData ? '✅ כל הנתונים זמינים - ניתן לשלוח' : '❌ חסרים נתונים - לא ניתן לשלוח'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await sendNotificationEmail(true)
                    }}
                    disabled={emailSending || !diagnosticInfo.hasAllData}
                    style={{
                      marginTop: '16px',
                      padding: '12px 24px',
                      width: '100%',
                      fontSize: '1rem',
                      background: diagnosticInfo.hasAllData ? 'var(--gradient-primary)' : 'rgba(100, 100, 100, 0.3)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: (emailSending || !diagnosticInfo.hasAllData) ? 'not-allowed' : 'pointer',
                      opacity: (emailSending || !diagnosticInfo.hasAllData) ? 0.6 : 1,
                      fontWeight: 'bold'
                    }}
                  >
                    {emailSending ? '⏳ שולח אימייל...' : diagnosticInfo.hasAllData ? '📧 שלח אימייל עכשיו' : '❌ לא ניתן לשלוח - חסרים נתונים'}
                  </button>
                </div>
              )}

              {/* Email Status */}
              {emailStatus && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: emailStatus.success
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${emailStatus.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: emailStatus.success ? '#22c55e' : '#ef4444',
                  fontSize: '0.9rem'
                }}>
                  {emailStatus.message}
                </div>
              )}
            </div>
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
                  עוד מגנטים ({otherTasks.length - 3}+)
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
            src="/logo_background.png"
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
            src="/logo_background.png"
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
