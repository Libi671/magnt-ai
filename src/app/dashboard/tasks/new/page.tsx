'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'bot' | 'user' | 'system'
  content: string
  buttons?: { label: string; value: string }[]
}

interface TaskData {
  title: string
  description: string
  ai_prompt: string
  first_question: string
  is_public: boolean
  show_conversations: boolean
  notify_email: string
  post_url: string
}

type WizardStep =
  | 'welcome'
  | 'choose_path'
  | 'post_input'
  | 'post_analyzing'
  | 'topic_suggestion'
  | 'topic_manual'
  | 'description_input'
  | 'generating_prompt'
  | 'prompt_suggestion'
  | 'prompt_manual'
  | 'generating_question'
  | 'question_suggestion'
  | 'question_manual'
  | 'preview'
  | 'saving'
  | 'done'

export default function NewTaskPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<WizardStep>('welcome')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Task data being built
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    description: '',
    ai_prompt: '',
    first_question: '',
    is_public: true,
    show_conversations: true,
    notify_email: '',
    post_url: '',
  })

  // Temp data during wizard
  const [postContent, setPostContent] = useState('')
  const [suggestedTopic, setSuggestedTopic] = useState('')
  const [suggestedPrompt, setSuggestedPrompt] = useState('')
  const [currentPath, setCurrentPath] = useState<'post' | 'magnet' | null>(null)

  const scrollToBottom = () => {
    // Scroll only within the chat container, not the whole page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get user email for default notify_email
  useEffect(() => {
    const getUserEmail = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setTaskData(prev => ({ ...prev, notify_email: user.email! }))
      }
    }
    getUserEmail()
  }, [])

  // Track if initialized
  const initialized = useRef(false)

  // Initialize chat
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    addBotMessage(
      `🎯 ברוכים הבאים ליצירת מגנט לידים!

מגנט לידים הוא כלי חכם שעובד דרך הרשתות החברתיות שלך.
כשמישהו מגיב לפוסט שלך עם הקישור - הוא מקבל חוויה אינטראקטיבית, ואתה מקבל את הפרטים שלו + מידע עמוק מהשיחה.

בוא נתחיל! יש לך פוסט קיים שתרצה להוסיף לו מגנט, או שנתחיל מאפס?`,
      [
        { label: '📱 מתחיל מפוסט קיים', value: 'post' },
        { label: '✨ מתחיל מהמגנט', value: 'magnet' }
      ]
    )
    setStep('choose_path')
  }, [])

  const addBotMessage = (content: string, buttons?: { label: string; value: string }[]) => {
    setMessages(prev => [...prev, { role: 'bot', content, buttons }])
  }

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'user', content }])
  }

  const handleButtonClick = async (value: string) => {
    const button = messages[messages.length - 1]?.buttons?.find(b => b.value === value)
    if (button) {
      addUserMessage(button.label)
    }

    switch (step) {
      case 'choose_path':
        if (value === 'post') {
          setCurrentPath('post')
          addBotMessage(
            `מעולה! 📎

העתק והדבק את אחד מהבאים:
• קישור ישיר לפוסט (Facebook, Instagram, TikTok)
• קוד הטמעה (embed) של הפוסט
• או פשוט כתוב במילים שלך על מה הפוסט`
          )
          setStep('post_input')
        } else {
          setCurrentPath('magnet')
          addBotMessage(
            `נהדר! בוא ניצור מגנט לידים מאפס 🚀

מה הנושא שאתה רוצה ליצור עליו מגנט?

(לדוגמה: "איך לכתוב פוסט ויראלי" או "טיפים למכירת מוצר")`
          )
          setStep('topic_manual')
        }
        break

      case 'topic_suggestion':
        if (value === 'accept') {
          setTaskData(prev => ({ ...prev, title: suggestedTopic }))
          addBotMessage(
            `מצוין! הנושא נשמר: "${suggestedTopic}"

עכשיו תאר בקצרה - מה המשתמש יקבל מהמגנט הזה?`
          )
          setStep('description_input')
        } else {
          addBotMessage('בסדר, מה הנושא שאתה רוצה למגנט הלידים?')
          setStep('topic_manual')
        }
        break



      case 'prompt_suggestion':
        if (value === 'accept') {
          setTaskData(prev => ({ ...prev, ai_prompt: suggestedPrompt }))
          generateFirstQuestion()
        } else {
          addBotMessage('בסדר, כתוב את ההנחיות לבוט במילים שלך:')
          setStep('prompt_manual')
        }
        break

      case 'question_suggestion':
        if (value === 'accept') {
          // If started from magnet, generate Facebook post suggestion
          if (currentPath === 'magnet') {
            generateFacebookPost()
          } else {
            addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
            setStep('preview')
          }
        } else {
          addBotMessage('בסדר, כתוב את השאלה הפותחת במילים שלך:')
          setStep('question_manual')
        }
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userInput = input.trim()
    setInput('')
    addUserMessage(userInput)

    switch (step) {
      case 'post_input':
        await analyzePost(userInput)
        break

      case 'topic_manual':
        setTaskData(prev => ({ ...prev, title: userInput }))
        setSuggestedTopic(userInput)
        addBotMessage(
          `נהדר! הנושא: "${userInput}"

עכשיו תאר בקצרה - מה המשתמש יקבל מהמגנט הזה?`
        )
        setStep('description_input')
        break

      case 'description_input':
        setTaskData(prev => ({ ...prev, description: userInput }))
        generatePrompt()
        break



      case 'prompt_manual':
        setTaskData(prev => ({ ...prev, ai_prompt: userInput }))
        generateFirstQuestion()
        break

      case 'question_manual':
        setTaskData(prev => ({ ...prev, first_question: userInput }))
        // If started from magnet, generate Facebook post suggestion
        if (currentPath === 'magnet') {
          generateFacebookPost()
        } else {
          addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
          setStep('preview')
        }
        break
    }
  }

  const analyzePost = async (content: string) => {
    setLoading(true)
    setStep('post_analyzing')
    addBotMessage('🔍 מנתח את הפוסט...')

    try {
      const response = await fetch('/api/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', content })
      })

      const data = await response.json()

      if (data.error) {
        addBotMessage(data.error + '\n\nמה הנושא של הפוסט?')
        setStep('topic_manual')
      } else {
        setPostContent(data.extractedContent || content)
        setSuggestedTopic(data.suggestedTopic)
        if (data.extractedUrl) {
          setTaskData(prev => ({ ...prev, post_url: data.extractedUrl }))
        }

        addBotMessage(
          `קראתי את הפוסט שלך! 📖

מציע להוסיף מגנט לידים בנושא:
"${data.suggestedTopic}"

מה אתה אומר?`,
          [
            { label: '✅ מקבל', value: 'accept' },
            { label: '✏️ אכתוב בעצמי', value: 'manual' }
          ]
        )
        setStep('topic_suggestion')
      }
    } catch (error) {
      console.error('Error analyzing post:', error)
      addBotMessage('שגיאה בניתוח הפוסט. מה הנושא של הפוסט?')
      setStep('topic_manual')
    } finally {
      setLoading(false)
    }
  }

  const generatePrompt = async () => {
    setLoading(true)
    setStep('generating_prompt')
    addBotMessage('⚙️ יוצר הנחיות לבוט...')

    try {
      const response = await fetch('/api/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_prompt',
          topic: taskData.title,
          description: taskData.description,
          postUrl: taskData.post_url
        })
      })

      const data = await response.json()

      if (data.generatedPrompt) {
        setSuggestedPrompt(data.generatedPrompt)
        addBotMessage(
          `הנה ההנחיות שהכנתי למגנט הלידים שלך:

${data.generatedPrompt}

💡 הבוט יבקש מהמשתמשים להגיב על הפוסט שלך בסיום - זה מגביר חשיפה!

האם אלה טובות בעיניך?`,
          [
            { label: '✅ מאשר', value: 'accept' },
            { label: '✏️ אכתוב בעצמי', value: 'manual' }
          ]
        )
        setStep('prompt_suggestion')
      }
    } catch (error) {
      console.error('Error generating prompt:', error)
      addBotMessage('שגיאה ביצירת ההנחיות. כתוב אותן בעצמך:')
      setStep('prompt_manual')
    } finally {
      setLoading(false)
    }
  }

  const generateFirstQuestion = async () => {
    setLoading(true)
    setStep('generating_question')
    addBotMessage('✨ יוצר שאלה פותחת...')

    try {
      const response = await fetch('/api/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_first_question',
          topic: taskData.title,
          description: taskData.description
        })
      })

      const data = await response.json()

      if (data.firstQuestion) {
        setTaskData(prev => ({ ...prev, first_question: data.firstQuestion }))
        addBotMessage(
          `הנה השאלה הפותחת שהכנתי:

"${data.firstQuestion}"

מה אתה אומר?`,
          [
            { label: '✅ מאשר', value: 'accept' },
            { label: '✏️ אכתוב בעצמי', value: 'manual' }
          ]
        )
        setStep('question_suggestion')
      }
    } catch (error) {
      console.error('Error generating question:', error)
      setTaskData(prev => ({ ...prev, first_question: `היי! בוא נדבר על ${taskData.title} 🚀` }))
      addBotMessage('הכל מוכן! לחץ על "סיום ויצירה" לשמירה.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const generateFacebookPost = async () => {
    setLoading(true)
    addBotMessage('📝 יוצר הצעה לפוסט פייסבוק...')

    try {
      const response = await fetch('/api/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_facebook_post',
          topic: taskData.title,
          description: taskData.description
        })
      })

      const data = await response.json()

      if (data.facebookPost) {
        addBotMessage(
          `📱 הנה הצעה לפוסט פייסבוק שיכול להתאים למגנט הזה:

${data.facebookPost}

💡 טיפ: כשהמגנט יהיה מוכן, שלח את הפוסט הזה ברשת החברתית בצירוף הקישור שיווצר.

🎉 הכל מוכן! לחץ על "סיום ויצירה" לשמור את המגנט.`
        )
      } else {
        addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
      }
      setStep('preview')
    } catch (error) {
      console.error('Error generating Facebook post:', error)
      addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async () => {
    setLoading(true)
    setStep('saving')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          ai_prompt: taskData.ai_prompt,
          first_question: taskData.first_question,
          is_public: taskData.is_public,
          show_conversations: taskData.show_conversations,
          notify_email: taskData.notify_email || user?.email || null,
          user_id: user?.id,
        })

      if (error) throw error

      addBotMessage('🎉 המגנט נוצר בהצלחה! מעביר אותך לרשימת המשימות...')
      setStep('done')

      setTimeout(() => {
        router.push('/dashboard/tasks')
        router.refresh()
      }, 1500)
    } catch (error) {
      console.error('Error creating task:', error)
      addBotMessage('שגיאה ביצירת המשימה. נסה שוב.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>צור מגנט לידים חדש</h1>
        <p style={{ color: 'var(--text-secondary)' }}>אשף יצירה אינטראקטיבי</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Chat Column */}
        <div className="card wizard-chat-card" style={{ flex: '1 1 400px', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          {/* Chat Messages */}
          <div ref={chatContainerRef} className="wizard-chat-messages" style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`chat-message ${msg.role === 'user' ? 'user' : 'bot'}`}
                  style={{ marginBottom: '12px' }}
                >
                  {msg.content}
                </div>
                {msg.buttons && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    justifyContent: 'flex-end',
                    maxWidth: '80%',
                    marginLeft: 'auto'
                  }}>
                    {msg.buttons.map((btn, btnIndex) => (
                      <button
                        key={btnIndex}
                        onClick={() => handleButtonClick(btn.value)}
                        className="btn btn-secondary"
                        style={{ padding: '10px 16px', fontSize: '0.9rem', flex: 1 }}
                        disabled={loading}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
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

          {/* Input - hide when in preview/saving/done */}
          {step !== 'preview' && step !== 'saving' && step !== 'done' && (
            <div className="chat-input-container">
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flex: 1 }}>
                <input
                  type="text"
                  className="input"
                  placeholder={
                    step === 'post_input' ? 'הדבק קישור או קוד הטמעה...' :
                      'כתוב תשובה...'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading || messages[messages.length - 1]?.buttons !== undefined}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !input.trim() || messages[messages.length - 1]?.buttons !== undefined}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 19l-7-7 7-7M19 12H5" />
                  </svg>
                </button>
              </form>
            </div>
          )}

          {/* Preview Button */}
          {step === 'preview' && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleSaveTask}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? '⏳ שומר...' : '🚀 סיום ויצירה'}
              </button>
            </div>
          )}
        </div>

        {/* Preview Column */}
        <div className="card" style={{ flex: '1 1 350px', minWidth: '300px', padding: '24px', height: '600px', overflow: 'auto' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>📋 סיכום המגנט</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>נושא</label>
              <input
                type="text"
                className="input"
                value={taskData.title}
                onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="נושא המגנט"
                style={{ fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>תיאור</label>
              <textarea
                className="input"
                value={taskData.description}
                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר"
                rows={2}
                style={{ fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>



            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>הנחיות לבוט</label>
              <textarea
                className="input"
                value={taskData.ai_prompt}
                onChange={(e) => setTaskData(prev => ({ ...prev, ai_prompt: e.target.value }))}
                placeholder="הנחיות לבוט"
                rows={5}
                style={{ fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>שאלה פותחת</label>
              <input
                type="text"
                className="input"
                value={taskData.first_question}
                onChange={(e) => setTaskData(prev => ({ ...prev, first_question: e.target.value }))}
                placeholder="שאלה פותחת"
                style={{ fontSize: '0.95rem' }}
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>קישור לפוסט</label>
              <input
                type="text"
                className="input"
                value={taskData.post_url}
                onChange={(e) => setTaskData(prev => ({ ...prev, post_url: e.target.value }))}
                placeholder="קישור לפוסט (אופציונלי)"
                style={{ fontSize: '0.95rem' }}
              />
            </div>

            {/* Settings Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>⚙️ הגדרות</h3>

              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>אימייל להודעות</label>
                <input
                  type="email"
                  className="input"
                  value={taskData.notify_email}
                  onChange={(e) => setTaskData(prev => ({ ...prev, notify_email: e.target.value }))}
                  placeholder="אימייל לקבלת התראות על לידים"
                  style={{ fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={taskData.is_public}
                    onChange={(e) => setTaskData(prev => ({ ...prev, is_public: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-start)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>הצג את המגנט באופן ציבורי</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={taskData.show_conversations}
                    onChange={(e) => setTaskData(prev => ({ ...prev, show_conversations: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-start)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>הצג תשובות משתתפים אחרים</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
