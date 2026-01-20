'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const words = ['למגנט לקוחות', 'לממיר']

export default function HeroSection() {
    const router = useRouter()
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentText, setCurrentText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        const word = words[currentWordIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (currentText.length < word.length) {
                    setCurrentText(word.substring(0, currentText.length + 1))
                } else {
                    // Wait before deleting
                    setTimeout(() => setIsDeleting(true), 2000)
                }
            } else {
                // Deleting
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        router.push('/login')
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

            {/* Chat Preview */}
            <div className="hero-chat-preview">
                <h3 className="hero-chat-title">מוכנים להתחיל לאסוף לידים?</h3>

                <div className="hero-chat-window">
                    {/* Bot Message */}
                    <div className="hero-chat-message bot">
                        <div className="hero-chat-avatar">🤖</div>
                        <div className="hero-chat-bubble">
                            <p>רוצה להשיג עוד לידים ולהגדיל הכנסה? נמאס לך להיות תלוי בחסדי האלגוריתם?</p>
                            <p style={{ marginTop: '12px' }}>יוצרים מגנט AI שיכול להביא לך הרבה לידים!</p>
                            <p style={{ marginTop: '12px' }}>באיזה נושא תרצה לכתוב את המגנט?</p>
                            <p style={{ marginTop: '8px', fontSize: '0.85rem', opacity: 0.8 }}>(אפשר לכתוב את הנושא של הפוסט האחרון שכתבת בפייסבוק או נושא אחר)</p>
                        </div>
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="hero-chat-input">
                        <input
                            type="text"
                            placeholder="כתוב את הנושא שלך..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button type="submit">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 19l-7-7 7-7M19 12H5" />
                            </svg>
                        </button>
                    </form>
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
