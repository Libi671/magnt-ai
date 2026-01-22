'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
    | 'description_generating'
    | 'description_suggestion'
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

export default function DashboardWizardChat() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<WizardStep>('welcome')
    const [showSummary, setShowSummary] = useState(false)
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
    const [suggestedDescription, setSuggestedDescription] = useState('')
    const [currentPath, setCurrentPath] = useState<'post' | 'magnet' | null>(null)
    const [generatedFacebookPost, setGeneratedFacebookPost] = useState('')

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [createdTask, setCreatedTask] = useState<{ id: string, title: string } | null>(null)

    const scrollToBottom = () => {
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
    const [mounted, setMounted] = useState(false)

    // Initialize chat
    useEffect(() => {
        setMounted(true)
        if (initialized.current) return
        initialized.current = true

        addBotMessage(
            `שלום 🤖

אני כאן לעזור לך להפוך את הפוסט שלך למגנט לידים

מגנט לידים הוא כלי חכם שעובד דרך האתר או הרשתות החברתיות שלך.
מפרסמים אותו באתר, מתחת פוסט שלך או כפוסט חדש, כשמישהו לוחץ על הקישור - הוא מקבל חוויה אינטראקטיבית, ואתה מקבל את הפרטים שלו + מידע עמוק מהשיחה.

בוא נתחיל! יש לך פוסט קיים שתרצה להוסיף לו מגנט, או שנתחיל מאפס?`,
            [
                { label: '✨ מתחילים מאפס', value: 'magnet' },
                { label: '📱 מתחילים מפוסט', value: 'post' }
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

        // Show summary panel with animation after first button click
        if (!showSummary) {
            setShowSummary(true)
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
                    generateDescription(suggestedTopic)
                } else {
                    addBotMessage('בסדר, מה הנושא שאתה רוצה למגנט הלידים?')
                    setStep('topic_manual')
                }
                break

            case 'description_suggestion':
                if (value === 'accept') {
                    setTaskData(prev => ({ ...prev, description: suggestedDescription }))
                    generatePrompt()
                } else {
                    addBotMessage('בסדר, תאר בקצרה - מה המשתמש יקבל מהמגנט הזה?')
                    setStep('description_input')
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

        // Show summary after first interaction
        if (!showSummary) {
            setShowSummary(true)
        }

        switch (step) {
            case 'post_input':
                await analyzePost(userInput)
                break

            case 'topic_manual':
                setTaskData(prev => ({ ...prev, title: userInput }))
                setSuggestedTopic(userInput)
                generateDescription(userInput)
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

    const generateDescription = async (topic: string) => {
        setLoading(true)
        setStep('description_generating')
        addBotMessage('💭 חושב מה המשתמשים יקבלו מהמגנט הזה...')

        try {
            const response = await fetch('/api/analyze-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate_description',
                    topic: topic
                })
            })

            const data = await response.json()

            if (data.suggestedDescription) {
                setSuggestedDescription(data.suggestedDescription)
                addBotMessage(
                    `הנה הצעה לתיאור מה המשתמשים יקבלו מהמגנט:

"${data.suggestedDescription}"

מה אתה אומר?`,
                    [
                        { label: '✅ מאשר', value: 'accept' },
                        { label: '✏️ אכתוב בעצמי', value: 'manual' }
                    ]
                )
                setStep('description_suggestion')
            } else {
                addBotMessage('תאר בקצרה - מה המשתמש יקבל מהמגנט הזה?')
                setStep('description_input')
            }
        } catch (error) {
            console.error('Error generating description:', error)
            addBotMessage('תאר בקצרה - מה המשתמש יקבל מהמגנט הזה?')
            setStep('description_input')
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
                setGeneratedFacebookPost(data.facebookPost)
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

            const { data, error } = await supabase
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
                .select()
                .single()

            if (error) throw error

            addBotMessage('🎉 המגנט נוצר בהצלחה!')
            setStep('done')

            if (data) {
                setCreatedTask({ id: data.id, title: data.title })
                setShowSuccessModal(true)
            }
        } catch (error) {
            console.error('Error creating task:', error)
            addBotMessage('שגיאה ביצירת המשימה. נסה שוב.')
            setStep('preview')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('הקישור הועתק ללוח!')
        })
    }

    return (
        <div style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 28, 1) 0%, rgba(30, 32, 44, 1) 100%)',
            padding: showSummary ? '40px 20px' : '40px 10px',
            borderRadius: '24px',
            marginBottom: '60px',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                transition: 'all 0.4s ease-in-out',
                alignItems: 'flex-start'
            }}>
                {/* Chat Column */}
                <div
                    className="card wizard-chat-card"
                    style={{
                        flex: showSummary ? '1 1 400px' : '1 1 100%',
                        minWidth: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 0 40px rgba(102, 126, 234, 0.3), 0 0 80px rgba(102, 126, 234, 0.15)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.4s ease-in-out',
                        maxHeight: '550px',
                        position: 'relative'
                    }}
                >
                    {/* Avatar - top right corner outside the box */}
                    {!showSummary && (
                        <div style={{
                            position: 'absolute',
                            top: '-60px',
                            right: '-10px',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid rgba(102, 126, 234, 0.5)',
                            boxShadow: '0 0 20px rgba(102, 126, 234, 0.3)',
                            zIndex: 10
                        }}>
                            <img
                                src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/R1Qb57WwXsoLOwTIfPuf/%D7%A7%D7%95%D7%A4%D7%A8%D7%99%D7%98%D7%A8%20%D7%A9%D7%9C%20WAMAGNT%20(400%20x%20400%20%D7%A4%D7%99%D7%A7%D7%A1%D7%9C).png"
                                alt="Magnt AI Bot"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    )}
                    {/* Chat Messages */}
                    <div
                        ref={chatContainerRef}
                        className="wizard-chat-messages"
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {messages.map((msg, index) => (
                            <div key={index}>
                                <div
                                    className={`chat-message ${msg.role === 'user' ? 'user' : 'bot'}`}
                                    style={{ marginBottom: '12px', color: 'white' }}
                                >
                                    {msg.content}
                                </div>
                                {msg.buttons && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginBottom: showSummary ? '16px' : '8px',
                                        justifyContent: 'flex-end',
                                        maxWidth: '80%',
                                        marginLeft: 'auto'
                                    }}>
                                        {msg.buttons.map((btn, btnIndex) => (
                                            <button
                                                key={btnIndex}
                                                onClick={() => handleButtonClick(btn.value)}
                                                className={btnIndex === 0 ? 'btn btn-primary' : 'btn btn-secondary'}
                                                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
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

                {/* Summary Column - Hidden initially, appears with animation */}
                <div
                    className="card"
                    style={{
                        flex: '1 1 350px',
                        minWidth: '300px',
                        padding: '24px',
                        maxHeight: '550px',
                        overflow: 'auto',
                        opacity: showSummary ? 1 : 0,
                        transform: showSummary ? 'translateX(0)' : 'translateX(50px)',
                        transition: 'all 0.4s ease-in-out',
                        display: showSummary ? 'block' : 'none'
                    }}
                >
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
                                rows={4}
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
            {/* Success Modal */}
            {
                showSuccessModal && createdTask && mounted && createPortal(
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(5px)',
                        padding: '20px'
                    }}>
                        <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '32px', textAlign: 'center', position: 'relative' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>המגנט מוכן!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                עכשיו, כדי שזה יעבוד - עליך לצרף את הקישור לפוסט שלך.
                            </p>

                            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                                    {`${window.location.origin}/t/${createdTask.id}`}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/t/${createdTask.id}`)}
                                    className="btn btn-secondary"
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    העתק קישור 📋
                                </button>
                            </div>

                            {/* Generated Post Text - show only if no post_url */}
                            {!taskData.post_url && generatedFacebookPost && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '8px', textAlign: 'right' }}>📝 הפוסט שלך (העתק ופרסם ברשתות):</label>
                                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', position: 'relative' }}>
                                        <textarea
                                            readOnly
                                            value={`${generatedFacebookPost}\n\n🔗 ${window.location.origin}/t/${createdTask.id}`}
                                            style={{
                                                width: '100%',
                                                minHeight: '120px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                resize: 'none',
                                                direction: 'rtl',
                                                textAlign: 'right'
                                            }}
                                        />
                                        <button
                                            onClick={() => copyToClipboard(`${generatedFacebookPost}\n\n🔗 ${window.location.origin}/t/${createdTask.id}`)}
                                            className="btn btn-secondary"
                                            style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            העתק פוסט 📋
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`הכנתי לכם הפתעה! 🎁\nכנסו לקישור וגלו:\n${window.location.origin}/t/${createdTask.id}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                    style={{ background: '#25D366', color: 'white', justifyContent: 'center' }}
                                >
                                    שתף בווטסאפ 📱
                                </a>
                                {taskData.post_url ? (
                                    <a
                                        href={taskData.post_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn"
                                        style={{ background: '#1877F2', color: 'white', justifyContent: 'center' }}
                                    >
                                        חזרה לפוסט שלך 🔙
                                    </a>
                                ) : (
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/t/${createdTask.id}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn"
                                        style={{ background: '#1877F2', color: 'white', justifyContent: 'center' }}
                                    >
                                        שתף בפייסבוק 👍
                                    </a>
                                )}
                            </div>

                            <button
                                onClick={() => router.push('/dashboard/tasks')}
                                className="btn btn-primary btn-large"
                                style={{ width: '100%' }}
                            >
                                מעולה, הבנתי! עבור ללוח הבקרה
                            </button>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    )
}
