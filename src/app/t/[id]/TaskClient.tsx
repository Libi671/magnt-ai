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
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Data collection state
  const [collectionStep, setCollectionStep] = useState<CollectionStep>('none')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [firstBotResponseReceived, setFirstBotResponseReceived] = useState(false)
  const [secondBotResponseReceived, setSecondBotResponseReceived] = useState(false)
  const [pendingBotResponse, setPendingBotResponse] = useState<string | null>(null)
  const [firstBotResponse, setFirstBotResponse] = useState<string | null>(null)
  const [secondBotResponse, setSecondBotResponse] = useState<string | null>(null)
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

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('API returned non-OK status:', response.status, errorData)
        return null
      }

      const data = await response.json()

      if (data.error) {
        console.warn('Error creating lead via API:', {
          error: data.error,
          details: data.details,
          code: data.code
        })
        return null
      }

      if (data.success && data.lead) {
        console.log('Lead created/updated successfully via API:', data.lead)
        return data.lead
      }

      // If we got here, the response was successful but didn't have the expected structure
      console.warn('Unexpected API response structure:', data)
      return null
    } catch (error) {
      console.warn('Error in createLead function:', error instanceof Error ? error.message : 'Unknown error')
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
      { role: 'system', content: `נעים מאוד ${userMessage}! 📱\n\nמה האימייל שלך?\n\nנשלח לך את הסיכום של התרגיל ותכנים נוספים מיוצר המשימה, לא נשלח ספאם.\nבהשארת הפרטים אתה מאשר גם את השימוש בתקנון שלנו.` }
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
      { role: 'system', content: '✅ מעולה!\n\nמה מספר הטלפון שלך?' }
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
      { role: 'system', content: '✅ תודה רבה! קיבלתי את כל הפרטים.\n\n🚀 אני מקפיץ לך שוב את ההודעה הקודמת' }
      ])
      setCollectionStep('done')

      console.log('Creating lead with:', { userName, userPhone, email: userEmail, taskId: task.id })
      const lead = await createLead(userName, userPhone, userEmail)
      if (lead) {
        console.log('Lead created/updated successfully, setting leadId to:', lead.id)
        setLeadId(lead.id)
        saveUserInfoToCache(userName, userPhone, userEmail)
      } else {
        // Try to find existing lead as fallback
        console.log('Lead creation returned null, trying to find existing lead as fallback...')
        const supabase = createClient()
        const { data: existingLead, error: searchError } = await supabase
          .from('leads')
          .select('id')
          .eq('task_id', task.id)
          .or(`email.eq.${userEmail},phone.eq.${userPhone}`)
          .maybeSingle()

        if (existingLead) {
          console.log('Found existing lead as fallback:', existingLead.id)
          setLeadId(existingLead.id)
        } else if (searchError) {
          console.warn('Error searching for existing lead:', searchError)
        } else {
          console.warn('No existing lead found and creation failed - lead tracking may be unavailable')
        }
      }

      // After user completes details collection, add the second bot response again at the bottom
      // so the user can see what they need to respond to
      if (secondBotResponse) {
        setTimeout(() => {
          // Add the second response again at the end of messages
          setMessages(prev => {
            // Check if it's already the last message to avoid duplicates
            const lastMessage = prev[prev.length - 1]
            if (lastMessage && lastMessage.role === 'model' && lastMessage.content === secondBotResponse) {
              // Already at the end, just trigger scroll
              return prev
            }
            // Add it at the end
            return [...prev, { role: 'model', content: secondBotResponse }]
          })
          // Scroll to bottom after adding the message
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
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
        // Count only regular conversation messages (excluding data collection)
        // This message will be added, so we count current messages + 1
        const regularUserMessages = messages.filter(m => {
          if (m.role !== 'user') return false
          // If collection hasn't started, it's a regular message
          const isDuringCollection = messages.some((msg, idx) => 
            idx <= messages.indexOf(m) && 
            msg.role === 'system' && 
            (msg.content.includes('💡 לפני שנמשיך') || 
             msg.content.includes('מה השם שלך') ||
             msg.content.includes('מה האימייל שלך') ||
             msg.content.includes('מה מספר הטלפון'))
          )
          return !isDuringCollection
        }).length
        const currentUserMessageCount = regularUserMessages + 1 // +1 for the current message
        
        if (!firstBotResponseReceived && collectionStep === 'none') {
          // First bot response - just save it and show it
          setFirstBotResponseReceived(true)
          setFirstBotResponse(data.response)
          setMessages(prev => [...prev, { role: 'model', content: data.response }])
          
        } else if (!secondBotResponseReceived && collectionStep === 'none' && currentUserMessageCount >= 2) {
          // Second bot response - show it immediately, then ask for user details
          setSecondBotResponseReceived(true)
          setSecondBotResponse(data.response)
          setMessages(prev => [...prev, { role: 'model', content: data.response }])

          // Ask for details immediately after showing the second response
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

  // Terms Modal Component
  const TermsModal = () => (
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
      padding: '20px',
      overflowY: 'auto'
    }} onClick={() => setShowTermsModal(false)}>
      <div className="card" style={{
        padding: '40px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: '20px 0'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            תקנון האתר
          </h2>
          <button
            onClick={() => setShowTermsModal(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '8px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            ✕
          </button>
        </div>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>1. הגדרות</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            "האתר" - אתר Magnt.AI ושירותיו.<br />
            "המשתמש" - כל אדם הגולש באתר או משתמש בשירותיו.<br />
            "היוצר" - בעל עסק או יוצר תוכן שמשתמש בפלטפורמה ליצירת מגנטים.<br />
            "מגנט" - כלי אינטראקטיבי ליצירת קשר ואיסוף פרטים.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>2. קבלת התנאים</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            השימוש באתר ובשירותיו מהווה הסכמה לתנאים אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש באתר.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>3. שירותי האתר</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            Magnt.AI מספק פלטפורמה ליצירת כלים אינטראקטיביים (מגנטים) לאיסוף לידים וניהול שיחות עם לקוחות פוטנציאליים באמצעות בינה מלאכותית.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>4. הסכמה לדיוור ותקשורת שיווקית</h3>
          <div style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontWeight: 500 }}>
              ⚠️ חשוב לקרוא:
            </p>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            בהשתתפות במגנט (אתגר, שאלון, או כל פעילות אינטראקטיבית אחרת באתר) ובמסירת פרטי הקשר שלך (שם, טלפון, אימייל),
            <strong style={{ color: 'var(--text-primary)' }}> אתה מאשר ומסכים לקבל:</strong>
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, marginTop: '16px', paddingRight: '20px' }}>
            <li>הודעות, עדכונים ותוכן שיווקי <strong style={{ color: 'var(--text-primary)' }}>מיוצר המגנט</strong> (העסק או היוצר שיצר את הפעילות בה השתתפת)</li>
            <li>הודעות, עדכונים ותוכן שיווקי <strong style={{ color: 'var(--text-primary)' }}>מ-Magnt.AI</strong> (מפעילי הפלטפורמה)</li>
          </ul>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '16px' }}>
            הדיוור יכול להגיע בדואר אלקטרוני, SMS, WhatsApp או כל אמצעי תקשורת אחר.<br /><br />
            ניתן לבטל את ההסכמה בכל עת על ידי פנייה אלינו בכתובת: libi41@gmail.com או על ידי לחיצה על קישור ההסרה שיופיע בכל הודעה.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>5. פרטיות ואבטחת מידע</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            אנו מתחייבים לשמור על פרטיות המידע שלך בהתאם לחוק הגנת הפרטיות. המידע שנאסף ישמש אך ורק למטרות המפורטות בתקנון זה.<br /><br />
            המידע נשמר בשרתים מאובטחים ולא יימסר לצדדים שלישיים, למעט ליוצר המגנט בו השתתפת.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>6. זכויות יוצרים וקניין רוחני</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            כל התכנים באתר, לרבות עיצוב, טקסטים, לוגו, קוד וטכנולוגיה, הם קניינה הבלעדי של Magnt.AI ואין לעשות בהם שימוש ללא אישור בכתב.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>7. אחריות</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            האתר מסופק "כמות שהוא" (AS IS). איננו אחראים לנזקים ישירים או עקיפים שעלולים להיגרם כתוצאה משימוש באתר.<br /><br />
            יוצרי המגנטים הם האחראים הבלעדיים לתוכן שהם יוצרים ולהתקשרות עם הלקוחות שלהם.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>8. שינויים בתקנון</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            אנו שומרים לעצמנו את הזכות לעדכן תקנון זה מעת לעת. המשך השימוש באתר לאחר עדכון התקנון מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>9. יצירת קשר</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            לשאלות או בירורים בנוגע לתקנון זה, ניתן לפנות אלינו:<br />
            📧 libi41@gmail.com
          </p>
        </section>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          marginTop: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.9rem'
        }}>
          עודכן לאחרונה: ינואר 2026
        </div>

        <button
          onClick={() => setShowTermsModal(false)}
          className="btn btn-primary"
          style={{
            marginTop: '32px',
            width: '100%',
            padding: '12px 24px'
          }}
        >
          סגור
        </button>
      </div>
    </div>
  )

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
  // Count only regular conversation messages with AI, excluding data collection messages
  // Find the first system message that starts data collection
  const dataCollectionStartIndex = messages.findIndex(m => 
    m.role === 'system' && m.content.includes('💡 לפני שנמשיך')
  )
  // Find the last system message that ends data collection
  const dataCollectionEndIndex = messages.findIndex(m => 
    m.role === 'system' && m.content.includes('✅ תודה רבה! קיבלתי את כל הפרטים')
  )
  
  // Count user messages that are NOT part of data collection
  const userMessageCount = messages.filter((m, index) => {
    if (m.role !== 'user') return false
    
    // If data collection hasn't started yet, count the message
    if (dataCollectionStartIndex === -1) return true
    
    // If message is before data collection started, count it
    if (index < dataCollectionStartIndex) return true
    
    // If data collection has ended and message is after it, count it
    if (dataCollectionEndIndex !== -1 && index > dataCollectionEndIndex) return true
    
    // Otherwise, it's during data collection, don't count it
    return false
  }).length
  
  const showRating = collectionStep === 'done' && userMessageCount >= 4
  
  return (
    <div className={`task-page-main ${showRating ? 'has-rating-section' : ''}`} style={{
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
                    collectionStep === 'email' ? 'הכנס כתובת אימייל...' :
                      collectionStep === 'phone' ? 'הכנס מספר טלפון...' :
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

      {/* Bottom Strip - Desktop Only */}
      <div className="desktop-share-section" style={{
        padding: '24px 20px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Share Button and Terms Link - Left Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button 
            onClick={() => setShowShareModal(true)} 
            className="btn btn-accent"
            style={{
              padding: showRating 
                ? '8px' 
                : '12px 24px',
              borderRadius: showRating 
                ? '50%' 
                : '8px',
              width: showRating 
                ? '40px' 
                : 'auto',
              height: showRating 
                ? '40px' 
                : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
            {!showRating && (
              <span style={{ marginRight: '8px' }}>שתף את האתגר</span>
            )}
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.75rem', 
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            תקנון
          </button>
        </div>

        {/* Rating & Complete - Center */}
        {showRating && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '0', fontSize: '0.9rem' }}>סיימת? דרג את החוויה:</p>
            <div className="rating" style={{ justifyContent: 'center', marginBottom: '0' }}>
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
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    transform: 'scale(1)',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)'
                    e.currentTarget.style.color = '#fbbf24'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.color = star <= rating ? '#fbbf24' : 'var(--text-muted)'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <button onClick={handleComplete} className="btn btn-accent" style={{ padding: '10px 24px', marginBottom: '0' }}>
              סיים וקבל את התוצאה
            </button>
          </div>
        )}

        {/* Magnt Badge - Right Side */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            flexShrink: 0
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
            <span>
              {showRating 
                ? 'צור אתגר משלך' 
                : <>נוצר עם <strong>Magnt.AI</strong> - ללקוחות ועסקאות</>
              }
            </span>
          </div>
        </Link>
      </div>

      {/* Share Modal */}
      {showShareModal && <ShareModal />}

      {/* Terms Modal */}
      {showTermsModal && <TermsModal />}

      {/* Mobile Rating Section - Above Footer (only on mobile) */}
      {showRating && (
        <div className="mobile-rating-section">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '0', fontSize: '0.9rem' }}>סיימת? דרג את החוויה:</p>
            <div className="rating" style={{ justifyContent: 'center', marginBottom: '0' }}>
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
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    transform: 'scale(1)',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)'
                    e.currentTarget.style.color = '#fbbf24'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.color = star <= rating ? '#fbbf24' : 'var(--text-muted)'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.9)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <button onClick={handleComplete} className="btn btn-accent" style={{ padding: '10px 24px', marginBottom: '0', width: '100%', maxWidth: '300px' }}>
              סיים וקבל את התוצאה
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Footer */}
      <div className="mobile-sticky-footer">
        {/* Share Button and Terms Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
          <button
            onClick={() => setShowTermsModal(true)}
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.7rem', 
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            תקנון
          </button>
        </div>

        {/* Brand / Create Task Button */}
        <Link 
          href="/" 
          style={{ 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flex: showRating ? '1' : '0 1 auto'
          }}
        >
          {showRating ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
              borderRadius: '50px',
              fontSize: '0.85rem',
              color: 'white',
              fontWeight: 500,
              flex: 1,
              justifyContent: 'center'
            }}>
              <img
                src="/logo_background.png"
                alt="Magnt.AI"
                style={{ height: '20px', width: 'auto' }}
              />
              <span>צור אתגר משלך</span>
            </div>
          ) : (
            <>
              <img
                src="/logo_background.png"
                alt="Magnt.AI"
                style={{ height: '28px' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>נוצר עם <strong style={{ color: 'white' }}>Magnt.AI</strong></span>
            </>
          )}
        </Link>
      </div>
    </div>
  )
}
