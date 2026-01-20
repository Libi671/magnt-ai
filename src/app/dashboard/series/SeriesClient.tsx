'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Message {
    role: 'bot' | 'user'
    content: string
    buttons?: { label: string; value: string }[]
}

interface SeriesClientProps {
    leadsCount: number
    userName?: string
}

export default function SeriesClient({ leadsCount = 0, userName = '' }: SeriesClientProps) {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('') // For potential future text input
    const [loading, setLoading] = useState(false)
    const [showDemoInput, setShowDemoInput] = useState(false)
    const [demoPhone, setDemoPhone] = useState('')

    const chatContainerRef = useRef<HTMLDivElement>(null)
    const [activeFaq, setActiveFaq] = useState<number | null>(null)

    // Initial Bot Message
    useEffect(() => {
        // Delay slightly for effect
        setTimeout(() => {
            if (leadsCount > 40) {
                addBotMessage(
                    `היי ${userName}! 👋
וואו, השגת כבר ${leadsCount} לידים דרך המערכת! 🚀

אבל השאלה החשובה היא... כמה מהם הצלחת באמת לסגור? 🤔
אם התשובה היא "לא מספיק", כנראה שחסר לך שלב קריטי של **חימום לפני המכירה**.

מה הסטטוס אצלך?`,
                    [
                        { label: 'באמת קשה לסגור אותם 😕', value: 'pain_yes' },
                        { label: 'רוצה אחוזי סגירה גבוהים יותר 🔥', value: 'want_warm' },
                        { label: 'איך פותרים את זה?', value: 'solution' }
                    ]
                )
            } else {
                addBotMessage(
                    `היי ${userName ? userName : ''}! 👋 
זיהיתי שכבר התחלת לאסוף לידים... אבל הסוד האמיתי הוא מה שקורה אחר כך.

ראיתי שרוב בעלי העסקים נופלים ב"שלב החימום".
הליד משאיר פרטים, אבל כשהם מתקשרים אליו... הוא קר. ❄️

איך זה אצלך?`,
                    [
                        { label: 'גם אצלי זה ככה 😕', value: 'pain_yes' },
                        { label: 'רוצה לידים חמים יותר 🔥', value: 'want_warm' },
                        { label: 'איך פותרים את זה?', value: 'solution' }
                    ]
                )
            }
        }, 500)
    }, [leadsCount, userName])

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, loading])

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

        setLoading(true)

        // Simulate thinking delay
        setTimeout(() => {
            setLoading(false)
            processBotResponse(value)
        }, 1000)
    }

    const processBotResponse = (value: string) => {
        switch (value) {
            case 'pain_yes':
            case 'want_warm':
            case 'solution':
                addBotMessage(
                    `בדיוק. הסטטיסטיקה מראה ש-80% מהלידים לא יקנו לעולם אם לא יחממו אותם, ורק 5% יסגרו בשיחה קרה. 📉

הפתרון הוא **סדרת חימום אוטומטית**.
במקום לרדוף אחרי לידים קרים, הבוט שולח להם סדרת תרגילים בוואטסאפ במשך 3-5 ימים.

התוצאה? כשהם מגיעים לשיחה, הם כבר מכירים אותך, סומכים עליך ורוצים לקנות. 🔥

רוצה לראות איך זה עובד "על אמת" בווטסאפ שלך?`,
                    [
                        { label: 'כן! שלח לי דמו לווטסאפ 📱', value: 'demo' },
                        { label: 'איך יוצרים את זה?', value: 'how_to' }
                    ]
                )
                break

            case 'demo':
                setShowDemoInput(true)
                addBotMessage(
                    `מעולה! 
הכנס את מספר הטלפון שלך, ואשלח לך סדרת הדגמה לווטסאפ עכשיו. 👇`
                )
                break

            case 'send_demo':
                addBotMessage(
                    `🚀 הדמו נשלח אליך! תבדוק את הווטסאפ.

בינתיים, אתה יכול לראות כאן למטה איך בדיוק זה עובד ומה אתה מקבל עם המערכת.

מוכן לקחת את זה לשלב הבא?`,
                    [
                        { label: 'אני רוצה להתחיל! 🚀', value: 'pricing' },
                        { label: 'יש לי כמה שאלות...', value: 'meeting' }
                    ]
                )
                break

            case 'how_to':
                addBotMessage(
                    `זה פשוט מאוד:
1. אנחנו מגדירים יחד את הסדרה שלך
2. כל ליד חדש נכנס אוטומטית לתהליך
3. אתה מקבל דוחות חמים לנייד

זה עובד 24/7 בשבילך. רוצה לראות דמו או לדבר איתי?`,
                    [
                        { label: 'שלח לי דמו', value: 'demo' },
                        { label: 'בוא נקבע שיחה', value: 'meeting' },
                        { label: 'כמה זה עולה?', value: 'pricing' }
                    ]
                )
                break

            case 'pricing':
                document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })
                addBotMessage(
                    `גוללתי אותך לאזור התמחור למטה. 👇
יש לנו הצעה מיוחדת ל-10 הנרשמים הראשונים!`
                )
                break

            case 'meeting':
                addBotMessage(
                    `בשמחה! בוא נבדוק אם זה מתאים לעסק שלך.
לחץ כאן לקביעת שיחת אפיון קצרה:`,
                    [
                        { label: '📅 לקביעת פגישה ביומן', value: 'calendar_link' }
                    ]
                )
                break

            case 'calendar_link':
                window.open('https://calendar.app.google/CRFCj1XM5NKBSEGB8', '_blank')
                addBotMessage('פתחתי לך את היומן בחלון חדש. נתראה שם! 👋')
                break
        }
    }

    const handleDemoSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!demoPhone) return;

        // TODO: Trigger Webhook here
        console.log('Sending demo to:', demoPhone)

        addUserMessage(`שלח דמו ל-${demoPhone}`)
        setShowDemoInput(false)
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            processBotResponse('send_demo')
        }, 1000)
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>

            {/* Split Hero Section */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap-reverse', // On mobile chat is bottom? no, we want chat top usually. Let's do row-reverse on desktop maybe?
                // Actually regular wrap is fine if we order them.
                gap: '40px',
                padding: '40px 20px',
                maxWidth: '1200px',
                margin: '0 auto',
                alignItems: 'start'
            }}>

                {/* Right Column: Chat (Sales Bot) */}
                <div className="card" style={{
                    flex: '1 1 400px',
                    minWidth: '350px',
                    height: '650px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0',
                    overflow: 'hidden',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(90deg, var(--bg-card), rgba(102, 126, 234, 0.1))',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <img
                                src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
                                alt="Magnt AI"
                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                right: -2,
                                width: '12px',
                                height: '12px',
                                background: '#22c55e',
                                borderRadius: '50%',
                                border: '2px solid var(--bg-card)'
                            }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Magnt Sales Assistant</h3>
                            <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>מחובר כעת</span>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div
                        ref={chatContainerRef}
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'rgba(0,0,0,0.2)'
                        }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '85%',
                                    padding: '16px',
                                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    background: msg.role === 'user' ? 'var(--primary-start)' : 'var(--bg-glass)',
                                    color: 'white',
                                    border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.content}
                                </div>
                                {msg.buttons && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginTop: '12px',
                                        maxWidth: '90%'
                                    }}>
                                        {msg.buttons.map((btn, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleButtonClick(btn.value)}
                                                className="btn btn-secondary"
                                                style={{
                                                    padding: '10px 18px',
                                                    fontSize: '0.9rem',
                                                    borderRadius: '20px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(102, 126, 234, 0.4)',
                                                    color: 'var(--text-primary)',
                                                    transition: 'all 0.2s'
                                                }}
                                                disabled={loading}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Demo Input Form */}
                        {showDemoInput && !loading && (
                            <form onSubmit={handleDemoSubmit} style={{
                                marginTop: '12px',
                                alignSelf: 'flex-start',
                                width: '100%',
                                maxWidth: '300px',
                                background: 'var(--bg-glass)',
                                padding: '16px',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>מספר נייד (לווטסאפ):</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="tel"
                                        value={demoPhone}
                                        onChange={e => setDemoPhone(e.target.value)}
                                        placeholder="050-1234567"
                                        className="input"
                                        style={{ flex: 1, padding: '10px' }}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                                        🚀
                                    </button>
                                </div>
                            </form>
                        )}

                        {loading && (
                            <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--bg-glass)', borderRadius: '20px', alignSelf: 'flex-start', width: 'fit-content' }}>
                                <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
                                <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                                <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Column: Visuals & Content */}
                <div style={{ flex: '1 1 500px' }}>
                    {/* Pain/Headlines */}
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            background: 'rgba(245, 87, 108, 0.15)',
                            border: '1px solid rgba(245, 87, 108, 0.3)',
                            borderRadius: '50px',
                            color: '#f5576c',
                            fontSize: '0.9rem',
                            marginBottom: '16px'
                        }}>
                            🔥 המנגנון הסודי לסגירת עסקאות
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: '24px'
                        }}>
                            לידים קרים? <br />
                            <span className="glow-text">תתחיל לחמם אותם.</span>
                        </h1>
                        <p style={{
                            fontSize: '1.2rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            marginBottom: '32px',
                            maxWidth: '500px'
                        }}>
                            רוב הלידים לא קונים מיד. הם צריכים שתבנה איתם אמון.
                            המערכת שלנו עושה את זה אוטומטית, 24/7, בווטסאפ האישי שלהם.
                        </p>
                    </div>

                    {/* Cold vs Warm Mini-Viz */}
                    <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '8px', filter: 'grayscale(1)' }}>❄️</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ליד קר</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f5576c' }}>5% סגירה</div>
                            </div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>⬅️</div>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔥</div>
                                <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>ליד מחומם</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>35% סגירה</div>
                            </div>
                        </div>

                    </div>

                    {/* Contact / Meeting Mobile Only? No, keep it handy */}
                    <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <a href="https://calendar.app.google/CRFCj1XM5NKBSEGB8" target="_blank" className="btn btn-primary">
                            📅 קבע פגישת הדגמה
                        </a>
                        <a href="tel:0525666536" className="btn btn-secondary">
                            📞 052-5666536
                        </a>
                    </div>
                </div>
            </div>

            {/* Rest of the Page Content (Below Fold) */}
            <div id="content-flow">
                {/* 3 Steps */}
                <section style={{ padding: '80px 20px' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '16px' }}>
                            איך זה עובד? 3 צעדים פשוטים 🚀
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px',
                            marginTop: '48px'
                        }}>
                            {/* Step 1 */}
                            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📱</div>
                                <h3>1. הליד מקבל תרגיל</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>אוטומטית לווטסאפ, מיד אחרי ההרשמה</p>
                            </div>
                            {/* Step 2 */}
                            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
                                <h3>2. אימון אינטראקטיבי</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>הבוט מלווה אותו 3-5 ימים, נותן פידבק ובונה אמון</p>
                            </div>
                            {/* Step 3 */}
                            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                                <h3>3. ליד חם לשיחה</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>אתה מקבל דוח מלא על הלקוח עוד לפני שהרמת טלפון</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mock Report Section */}
                <section style={{
                    padding: '80px 20px',
                    background: 'var(--bg-glass)'
                }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: '1 1 400px' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>
                                תדע הכל על הלקוח <br />
                                <span style={{ color: 'var(--primary-start)' }}>לפני השיחה הראשונה</span>
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px' }}>
                                במקום לשאול שאלות בסיסיות, תגיע לשיחה כשאתה כבר יודע:
                            </p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {['מה הכאב הכי גדול שלו', 'כמה הוא מוכן לשלם', 'מה הניסיון שלו בעבר'].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                        <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Mock Report Card */}
                        <div style={{ flex: '1 1 400px' }}>
                            <div className="card" style={{
                                padding: '32px',
                                background: 'var(--bg-card)',
                                border: '1px solid rgba(102, 126, 234, 0.3)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>ישראל ישראלי</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>לפני 10 דקות</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '20px', height: 'fit-content', fontWeight: 700 }}>🔥 חם מאוד</div>
                                </div>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>תקציב:</div>
                                    <div>״מוכן להשקיע עד 4,000 ש״ח אם זה פותר את הבעיה״</div>
                                </div>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>תסריט שיחה:</div>
                                    <div>״היי ישראל, ראיתי שכתבת שהבעיה העיקרית היא...״</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing-section" style={{ padding: '80px 20px', textAlign: 'center' }}>
                    <div className="card" style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        padding: '60px 40px',
                        background: 'linear-gradient(145deg, var(--bg-card), rgba(102, 126, 234, 0.05))',
                        border: '2px solid rgba(102, 126, 234, 0.5)'
                    }}>
                        <h2 style={{ marginBottom: '16px' }}>תוכנית Premium</h2>
                        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary-start)', marginBottom: '8px' }}>
                            499 <span style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>₪</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>לחודש, ללא התחייבות</p>

                        <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {['סדרות חימום ללא הגבלה', 'חיבור לוואטסאפ אישי', 'דוחות בינה מלאכותית', 'תסריטי שיחה מותאמים'].map((item, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    ✅ {item}
                                </li>
                            ))}
                        </ul>

                        <a href="tel:0525666536" className="btn btn-primary btn-large" style={{ width: '100%', fontSize: '1.2rem', padding: '16px', display: 'block', textDecoration: 'none' }}>
                            אני רוצה לשדרג עכשיו 🚀
                        </a>
                        <div style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            או <a href="https://calendar.app.google/CRFCj1XM5NKBSEGB8" target="_blank" style={{ color: 'var(--primary-start)' }}>קבע שיחת הדגמה</a>
                        </div>
                    </div>
                </section>

                {/* Contact Footer of Layout */}
            </div>

            {/* Sticky Contact Bar for Mobile? Or just section */}
            <section style={{
                borderTop: '1px solid var(--border-color)',
                padding: '40px 20px',
                textAlign: 'center',
                background: 'var(--bg-dark)'
            }}>
                <h3 style={{ marginBottom: '24px' }}>עדיין מתלבט? דבר איתי</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                    <a href="mailto:libi41@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        📧 libi41@gmail.com
                    </a>
                    <a href="tel:0525666536" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        📞 052-5666536
                    </a>
                </div>
            </section>
        </div>
    )
}
