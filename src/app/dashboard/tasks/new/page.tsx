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
  video_url: string
  ai_prompt: string
  first_question: string
  is_public: boolean
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
  | 'video_question'
  | 'video_input'
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

  // Task data being built
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    description: '',
    video_url: '',
    ai_prompt: '',
    first_question: '',
    is_public: true,
    post_url: '',
  })

  // Temp data during wizard
  const [postContent, setPostContent] = useState('')
  const [suggestedTopic, setSuggestedTopic] = useState('')
  const [suggestedPrompt, setSuggestedPrompt] = useState('')
  const [currentPath, setCurrentPath] = useState<'post' | 'magnet' | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize chat
  useEffect(() => {
    if (messages.length === 0) {
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
    }
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

      case 'video_question':
        if (value === 'yes') {
          addBotMessage('הדבק קישור לסרטון (YouTube, Vimeo, או קישור ישיר):')
          setStep('video_input')
        } else {
          generatePrompt()
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
          addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
          setStep('preview')
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
        addBotMessage(
          'האם תרצה להוסיף סרטון שיופיע בראש המגנט?',
          [
            { label: '✅ כן, יש לי סרטון', value: 'yes' },
            { label: '⏭️ לא, נמשיך', value: 'no' }
          ]
        )
        setStep('video_question')
        break

      case 'video_input':
        setTaskData(prev => ({ ...prev, video_url: userInput }))
        addBotMessage('✅ הסרטון נשמר!')
        generatePrompt()
        break

      case 'prompt_manual':
        setTaskData(prev => ({ ...prev, ai_prompt: userInput }))
        generateFirstQuestion()
        break

      case 'question_manual':
        setTaskData(prev => ({ ...prev, first_question: userInput }))
        addBotMessage('🎉 מעולה! הכל מוכן.\n\nלחץ על "סיום ויצירה" לשמור את המגנט.')
        setStep('preview')
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
          description: taskData.description
        })
      })

      const data = await response.json()

      if (data.generatedPrompt) {
        setSuggestedPrompt(data.generatedPrompt)
        addBotMessage(
          `הנה ההנחיות שהכנתי למגנט הלידים שלך:

${data.generatedPrompt}

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

  const handleSaveTask = async () => {
    setLoading(true)
    setStep('saving')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
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
        <div className="card" style={{ flex: '1 1 400px', minWidth: '350px', display: 'flex', flexDirection: 'column', height: '600px' }}>
          {/* Chat Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
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
                      step === 'video_input' ? 'הדבק קישור לסרטון...' :
                        'כתוב תשובה...'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !input.trim()}
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
              <div style={{ color: taskData.title ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {taskData.title || '—'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>תיאור</label>
              <div style={{ color: taskData.description ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {taskData.description || '—'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>סרטון</label>
              <div style={{ color: taskData.video_url ? 'var(--text-primary)' : 'var(--text-muted)', wordBreak: 'break-all' }}>
                {taskData.video_url || '—'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>הנחיות לבוט</label>
              <div style={{
                color: taskData.ai_prompt ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                background: 'var(--bg-glass)',
                padding: taskData.ai_prompt ? '12px' : '0',
                borderRadius: '8px'
              }}>
                {taskData.ai_prompt || '—'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>שאלה פותחת</label>
              <div style={{ color: taskData.first_question ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {taskData.first_question || '—'}
              </div>
            </div>

            {taskData.post_url && (
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>קישור לפוסט</label>
                <a href={taskData.post_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-start)', wordBreak: 'break-all' }}>
                  {taskData.post_url}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
