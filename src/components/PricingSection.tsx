'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingSection() {
    const [showModal, setShowModal] = useState(false)

    const calendarUrl = 'https://calendar.app.google/73nkXWeKk2EhtrpB6'

    return (
        <>
            {/* Pricing Section - Dark */}
            <section id="pricing" className="section">
                <div className="container">
                    <h2 className="section-title">תמחור 💳</h2>

                    {/* Simplified Pricing Box */}
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '650px',
                        margin: '0 auto',
                        padding: '32px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                            💡 כמה עולה לך היום כל ליד מפייסבוק? <strong>50-100 ש״ח?</strong><br />
                            וכמה מהם באמת הופכים ללקוחות משלמים?
                        </p>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '20px' }}>
                            עם מערכת חימום אוטומטית, הלידים שלך מגיעים <strong style={{ color: 'var(--text-primary)' }}>מוכנים לקנות</strong>.
                        </p>

                        {/* Free tier highlights */}
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px'
                        }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>מתחילים בחינם:</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>
                                ✅ מגנטים ללא הגבלה  ✅ עד 25 לידים  ✅ צ׳אט AI מתקדם
                            </p>
                            <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                                מתחילים בחינם עכשיו!
                            </Link>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn btn-secondary"
                                style={{ padding: '12px 24px' }}
                            >
                                לכל התוכניות
                            </button>
                            <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ padding: '12px 24px' }}
                            >
                                נשמח לפגישת הדרכה
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    overflow: 'auto'
                }} onClick={() => setShowModal(false)}>
                    <div
                        style={{
                            maxWidth: '850px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '32px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                color: 'white'
                            }}
                        >
                            ✕
                        </button>

                        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.8rem' }}>תוכניות תמחור</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                            {/* Free Plan */}
                            <div className="card" style={{ padding: '28px' }}>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', textAlign: 'center' }}>חינמי</h3>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>0 ש״ח</div>
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>לנצח</p>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <ul style={{ listStyle: 'none', marginBottom: '20px' }}>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> מגנטים ללא הגבלה
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> עד 25 לידים
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> צ׳אט AI מתקדם
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            <span>❌</span> סדרת חימום
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            <span>❌</span> חיבור לוואטסאפ
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                            <span>❌</span> מערכת CRM
                                        </li>
                                    </ul>
                                </div>

                                <Link href="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                                    התחל בחינם
                                </Link>
                            </div>

                            {/* Pro Plan */}
                            <div className="card" style={{ padding: '28px', border: '2px solid var(--primary-start)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--gradient-primary)',
                                    padding: '6px 20px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}>
                                    ⭐ מומלץ
                                </div>

                                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', textAlign: 'center' }}>מקצועי</h3>

                                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.1rem' }}>599 ש״ח</span>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center' }} className="glow-text">499 ש״ח</div>
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>לחודש</p>

                                <div style={{
                                    background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    marginBottom: '20px'
                                }}>
                                    🔥 מחיר השקה לזמן מוגבל
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <ul style={{ listStyle: 'none', marginBottom: '20px' }}>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> מגנטים ללא הגבלה
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> לידים ללא הגבלה
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> צ׳אט AI מתקדם
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> סדרת חימום
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> חיבור מלא לוואטסאפ
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> מערכת CRM מתקדמת
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> מחקר לקוח + תסריט שיחה
                                        </li>
                                        <li style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#22c55e' }}>✅</span> בוט מענה אישי 24/7
                                        </li>
                                    </ul>
                                </div>

                                <a
                                    href={calendarUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ width: '100%', textAlign: 'center', display: 'block' }}
                                >
                                    ← קדימה בוא נדבר על זה
                                </a>
                            </div>
                        </div>

                        {/* Bonus Banner - Inside Modal */}
                        <div style={{
                            marginTop: '32px',
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(245, 87, 108, 0.2))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(102, 126, 234, 0.3)',
                            textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
                                🎁 בונוס ל-10 הנרשמים הראשונים:
                            </p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                פגישות הדרכה ואפיון אישיות להתאמה מושלמת של המערכת לעסק שלך<br />
                                <strong style={{ color: 'var(--text-primary)' }}>(שווי 450 ש״ח - במתנה!)</strong>
                            </p>
                            <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-accent"
                                style={{ padding: '12px 24px' }}
                            >
                                📅 קבע פגישה ביומן
                            </a>
                        </div>

                        {/* Close text */}
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                display: 'block',
                                margin: '24px auto 0',
                                color: 'var(--text-muted)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            סגור
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
