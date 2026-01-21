'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const words = ['למגנט לקוחות', 'לממיר']

interface Message {
    role: 'user' | 'model'
    content: string
    buttons?: { label: string; value: string }[]
}

// Helper function to convert URLs to clickable links
const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
        if (urlRegex.test(part)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#667eea',
                        textDecoration: 'underline',
                        fontWeight: 600
                    }}
                >
                    {part}
                </a>
            )
        }
        return part
    })
}

export default function HeroSection() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentText, setCurrentText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    // Chat state
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [chatStarted, setChatStarted] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Typewriter effect
    useEffect(() => {
        const word = words[currentWordIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (currentText.length < word.length) {
                    setCurrentText(word.substring(0, currentText.length + 1))
                } else {
                    setTimeout(() => setIsDeleting(true), 2000)
                }
            } else {
                if (currentText.length > 0) {
                    setCurrentText(word.substring(0, currentText.length - 1))
                } else {
                    setIsDeleting(false)
                    setCurrentWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }, isDeleting ? 50 : 100)

        return () => clearTimeout(timeout)
    }, [currentText, isDeleting, currentWordIndex])

    // Initialize chat with first message
    useEffect(() => {
        if (!chatStarted) {
            setMessages([{
                role: 'model',
                content: 'היי, כאן היועץ לצמיחה עסקית של Magnt AI. רוצה להפסיק להיות תלוי בחסדי האלגוריתם, ולהשיג הרבה יותר לידים ולהגדיל הכנסה?',
                buttons: [
                    { label: 'בטח!', value: 'בטח! אני רוצה להשיג יותר לידים ולהגדיל הכנסה.' },
                    { label: 'לא כרגע', value: 'לא כרגע, אולי בהמשך.' }
                ]
            }])
            setChatStarted(true)
        }
    }, [chatStarted])

    // Scroll to bottom when messages change (only within chat container)
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages, loading])

    const sendMessage = async (userMessage: string) => {
        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            // Prepare history for API (without buttons)
            const history = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))

            const response = await fetch('/api/hero-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history
                })
            })

            const data = await response.json()

            if (data.response) {
                setMessages(prev => [...prev, { role: 'model', content: data.response }])
            } else {
                setMessages(prev => [...prev, {
                    role: 'model',
                    content: 'אופס, משהו השתבש. נסה שוב או התחבר למערכת כדי להמשיך.'
                }])
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                role: 'model',
                content: 'אופס, משהו השתבש. נסה שוב או התחבר למערכת כדי להמשיך.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleButtonClick = (value: string) => {
        sendMessage(value)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const message = input.trim()
        setInput('')
        sendMessage(message)
    }

    return (
        <section className="hero-section">
            <div className="hero-glow" />

            {/* Badge */}
            <div className="hero-badge">✨ מפוסט לסליקה באמצעות מגנט AI</div>

            <h1 className="hero-title">
                הפכו כל פוסט{' '}
                <span className="glow-text">
                    {currentText}
                    <span className="typewriter-cursor">|</span>
                </span>
            </h1>

            <p className="hero-subtitle">
                נמאס לך להשקיע בתוכן ולקבל &apos;לייקים&apos; במקום לקוחות?
                <br />
                יוצרים מגנט ויראלי ואוספים לידים במינימום מאמץ.
                <br />
                ה-AI שלנו ינהל את השיחה, ויביא לך לקוחות חמים לסגירה.
            </p>

            {/* Interactive Chat */}
            <div className="hero-chat-preview">
                <h3 className="hero-chat-title">🎯 תרגיל אבחון מהיר - גלה את הפוטנציאל שלך</h3>

                <div className="hero-chat-window">
                    {/* Messages */}
                    <div
                        ref={chatContainerRef}
                        className="hero-chat-messages"
                        style={{
                            maxHeight: '350px',
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}
                    >
                        {messages.map((msg, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end'
                            }}>
                                {/* Message bubble */}
                                <div className={`hero-chat-message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                    {msg.role === 'model' && <div className="hero-chat-avatar">🤖</div>}
                                    <div className="hero-chat-bubble" style={{
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                            : 'rgba(40, 40, 55, 0.9)',
                                        borderRadius: msg.role === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        <p>{linkifyText(msg.content)}</p>
                                    </div>
                                </div>

                                {msg.buttons && msg.buttons.length > 0 && index === messages.length - 1 && !loading && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginTop: '12px',
                                        marginRight: '44px',
                                        justifyContent: 'flex-start'
                                    }}>
                                        {msg.buttons.map((btn, btnIndex) => (
                                            <button
                                                key={btnIndex}
                                                onClick={() => handleButtonClick(btn.value)}
                                                className="btn"
                                                style={{
                                                    padding: '10px 20px',
                                                    background: btnIndex === 0
                                                        ? 'linear-gradient(135deg, #667eea, #764ba2)'
                                                        : 'rgba(255,255,255,0.1)',
                                                    border: btnIndex === 0 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="hero-chat-message bot">
                                <div className="hero-chat-avatar">🤖</div>
                                <div className="hero-chat-bubble" style={{
                                    background: 'rgba(40, 40, 55, 0.9)',
                                    display: 'flex',
                                    gap: '6px',
                                    padding: '16px 20px'
                                }}>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="hero-chat-input">
                        <input
                            type="text"
                            placeholder="כתוב את התשובה שלך..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 19l-7-7 7-7M19 12H5" />
                            </svg>
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link href="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                        התחבר וצור את המגנט שלך בחינם
                    </Link>
                </div>

                {/* Trust Badges */}
                <div className="hero-trust-badges">
                    <span>✓ ללא כרטיס אשראי</span>
                    <span>✓ התחילו תוך 3 דקות</span>
                    <span>✓ קבלו 25 לידים ראשונים בחינם</span>
                </div>
            </div>
        </section>
    )
}
