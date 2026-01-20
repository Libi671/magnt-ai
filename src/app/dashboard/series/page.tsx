'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SeriesPage() {
    const [activeFaq, setActiveFaq] = useState<number | null>(null)

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero Section - The Pain */}
            <section style={{
                padding: '120px 20px 80px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(245, 87, 108, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    {/* Pain Badge */}
                    <div style={{
                        display: 'inline-block',
                        padding: '8px 20px',
                        background: 'rgba(245, 87, 108, 0.15)',
                        border: '1px solid rgba(245, 87, 108, 0.3)',
                        borderRadius: '50px',
                        color: '#f5576c',
                        fontSize: '0.9rem',
                        marginBottom: '24px'
                    }}>
                        😤 הבעיה שאף אחד לא מדבר עליה
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        marginBottom: '24px'
                    }}>
                        יש לך לידים,<br />
                        <span style={{ color: '#f5576c' }}>אבל הם לא סוגרים?</span>
                    </h1>

                    <p style={{
                        fontSize: '1.2rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        marginBottom: '32px'
                    }}>
                        הליד השאיר פרטים. מתקשרים אליו...<br />
                        <strong style={{ color: 'white' }}>"אני אחשוב על זה"</strong> 💨 ונעלם.
                    </p>

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        gap: '40px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f5576c' }}>80%</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>מהלידים לא יקנו לעולם</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f5576c' }}>5%</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>אחוז סגירה מליד קר</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#22c55e' }}>35%</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>אחוז סגירה מליד מחומם</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Visualization */}
            <section style={{
                padding: '60px 20px',
                background: 'var(--bg-glass)'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '48px' }}>
                        ההבדל בין ליד קר לליד מחומם 🔥
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Cold Lead */}
                        <div className="card" style={{
                            padding: '32px',
                            border: '2px solid rgba(245, 87, 108, 0.3)',
                            background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.08), transparent)'
                        }}>
                            <div style={{
                                fontSize: '2.5rem',
                                marginBottom: '16px',
                                filter: 'grayscale(50%)'
                            }}>❄️</div>
                            <h3 style={{ color: '#f5576c', marginBottom: '20px', fontSize: '1.3rem' }}>ליד קר</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📥</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>ליד נכנס</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📞</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>מתקשרים אליו</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🤔</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>"מי זה? מה זה?"</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>💨</span>
                                    <span style={{ color: '#f5576c', fontWeight: 600 }}>נעלם לנצח</span>
                                </div>
                            </div>
                        </div>

                        {/* Warm Lead */}
                        <div className="card" style={{
                            padding: '32px',
                            border: '2px solid rgba(34, 197, 94, 0.3)',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), transparent)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔥</div>
                            <h3 style={{ color: '#22c55e', marginBottom: '20px', fontSize: '1.3rem' }}>ליד מחומם</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📥</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>ליד נכנס</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🔄</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>עובר סדרת חימום</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>📞</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>"כן! חיכיתי לשיחה"</span>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.3rem' }}>💰</span>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>סוגר עסקה!</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* What is Warming Series - 3 Steps */}
            <section style={{ padding: '80px 20px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '16px' }}>
                        מה זה סדרת חימום? 🔥
                    </h2>
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginBottom: '48px',
                        maxWidth: '600px',
                        margin: '0 auto 48px'
                    }}>
                        תהליך אוטומטי שהופך ליד שהשאיר פרטים לליד שמבקש לקנות
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Step 1 */}
                        <div className="card" style={{
                            padding: '32px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '32px',
                                height: '32px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700
                            }}>1</div>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📱</div>
                            <h3 style={{ marginBottom: '12px' }}>הליד מקבל תרגיל</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                מיד אחרי שהשאיר פרטים, הוא מקבל תרגיל ראשון בוואטסאפ
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="card" style={{
                            padding: '32px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '32px',
                                height: '32px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700
                            }}>2</div>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔥</div>
                            <h3 style={{ marginBottom: '12px' }}>3-5 ימים של חימום</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                הליד עושה תרגילים, משתף, והבוט לומד עליו הכל
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="card" style={{
                            padding: '32px',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                width: '32px',
                                height: '32px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700
                            }}>3</div>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📞</div>
                            <h3 style={{ marginBottom: '12px' }}>דוח + תסריט שיחה</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                אתה מקבל דוח מלא על הליד + בדיוק מה להגיד לו בשיחה
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* What You Get Per Lead */}
            <section style={{
                padding: '80px 20px',
                background: 'var(--bg-glass)'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '48px' }}>
                        מה אתה מקבל על כל ליד? 📊
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        {[
                            { icon: '📊', title: 'דוח לקוח', desc: 'מה הכאבים שלו, מה מחפש, מה חשוב לו' },
                            { icon: '📝', title: 'תסריט שיחה', desc: 'בדיוק מה להגיד לו בשיחה הראשונה' },
                            { icon: '🌡️', title: 'מד חום', desc: 'כמה הוא מוכן לקנות (1-10)' },
                            { icon: '💬', title: 'היסטוריית שיחות', desc: 'כל מה שהוא אמר לבוט' }
                        ].map((item, i) => (
                            <div key={i} className="card" style={{
                                padding: '24px',
                                textAlign: 'center',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{item.icon}</div>
                                <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>{item.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Real Example - Mock Report */}
            <section style={{ padding: '80px 20px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '16px' }}>
                        דוגמה לדוח לקוח 📋
                    </h2>
                    <p style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginBottom: '32px'
                    }}>
                        ככה נראה דוח שתקבל על כל ליד מחומם
                    </p>

                    {/* Mock Report Card */}
                    <div className="card" style={{
                        padding: '32px',
                        background: 'linear-gradient(135deg, var(--bg-card), rgba(102, 126, 234, 0.1))',
                        border: '2px solid rgba(102, 126, 234, 0.3)'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px',
                            paddingBottom: '16px',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem'
                                }}>👤</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>ישראל ישראלי</h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>054-1234567</span>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                borderRadius: '50px',
                                color: '#22c55e',
                                fontWeight: 600
                            }}>
                                🌡️ 8/10
                            </div>
                        </div>

                        {/* Insights */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ marginBottom: '16px', color: 'var(--primary-start)' }}>📋 מה גילינו:</h4>
                            <ul style={{
                                listStyle: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {[
                                    'מחפש פתרון לחרדות לפני הרצאות',
                                    'ניסה בעבר טיפול שלא עבד',
                                    'תקציב: 300-400 ש"ח לפגישה',
                                    'זמינות: ימי שלישי אחה"צ'
                                ].map((item, i) => (
                                    <li key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span style={{ color: '#22c55e' }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Quote */}
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '24px',
                            borderRight: '3px solid var(--primary-start)'
                        }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>💬 ציטוט:</div>
                            <p style={{ fontStyle: 'italic', margin: 0 }}>"אני צריך משהו שיעבוד מהר, נמאס לי מהרגשה הזו"</p>
                        </div>

                        {/* Script */}
                        <div style={{
                            padding: '16px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                            <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: '8px' }}>📞 תסריט מומלץ:</div>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7 }}>
                                "היי ישראל, ראיתי שעשית את התרגיל להתמודדות עם חרדה. איך הרגשת אחריו? הרבה אנשים אומרים לי שזה עזר להם לא רק לפני הרצאות..."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Before/After Comparison Table */}
            <section style={{
                padding: '80px 20px',
                background: 'var(--bg-glass)'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '48px' }}>
                        לפני ואחרי סדרת חימום 📈
                    </h2>

                    <div className="card" style={{ overflow: 'hidden' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            textAlign: 'right'
                        }}>
                            <thead>
                                <tr style={{ background: 'rgba(102, 126, 234, 0.15)' }}>
                                    <th style={{ padding: '16px 20px', fontWeight: 600 }}>
                                        <span style={{ color: '#f5576c' }}>❄️ בלי חימום</span>
                                    </th>
                                    <th style={{ padding: '16px 20px', fontWeight: 600 }}>
                                        <span style={{ color: '#22c55e' }}>🔥 עם חימום</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['מתקשר לליד קר', 'מתקשר לליד שמכיר אותך'],
                                    ['"מי זה? מה זה?"', '"כן! חיכיתי לשיחה"'],
                                    ['ממציא מה להגיד', 'יש לך תסריט מותאם'],
                                    ['5% סגירה', '35% סגירה']
                                ].map((row, i) => (
                                    <tr key={i} style={{
                                        borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none'
                                    }}>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: i === 3 ? '#f5576c' : 'var(--text-secondary)',
                                            fontWeight: i === 3 ? 700 : 400,
                                            fontSize: i === 3 ? '1.1rem' : '0.95rem'
                                        }}>{row[0]}</td>
                                        <td style={{
                                            padding: '16px 20px',
                                            color: i === 3 ? '#22c55e' : 'white',
                                            fontWeight: i === 3 ? 700 : 400,
                                            fontSize: i === 3 ? '1.1rem' : '0.95rem'
                                        }}>{row[1]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '80px 20px',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
                        רוצה לידים שמבקשים לקנות? 🚀
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '32px',
                        fontSize: '1.1rem'
                    }}>
                        שדרג לתוכנית מקצועית וקבל גישה לסדרות חימום אוטומטיות
                    </p>

                    {/* Pricing Card */}
                    <div className="card" style={{
                        padding: '40px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                        border: '2px solid rgba(102, 126, 234, 0.3)',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            תוכנית מקצועית
                        </div>
                        <div style={{
                            fontSize: '3.5rem',
                            fontWeight: 800,
                            marginBottom: '8px'
                        }}>
                            499 <span style={{ fontSize: '1.2rem', fontWeight: 400 }}>ש"ח/חודש</span>
                        </div>

                        <ul style={{
                            listStyle: 'none',
                            textAlign: 'right',
                            marginBottom: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {[
                                'לידים ללא הגבלה',
                                'סדרות חימום אוטומטיות',
                                'חיבור לוואטסאפ',
                                'דוחות לקוח מפורטים',
                                'תסריטי שיחה מותאמים'
                            ].map((item, i) => (
                                <li key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span style={{ color: '#22c55e' }}>✅</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link href="/login" className="btn btn-primary btn-large" style={{
                            width: '100%',
                            fontSize: '1.1rem',
                            padding: '16px'
                        }}>
                            שדרג עכשיו
                        </Link>
                    </div>

                    {/* Bonus */}
                    <div style={{
                        padding: '20px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <p style={{ margin: 0 }}>
                            🎁 <strong>ל-10 הנרשמים הראשונים:</strong> 2 פגישות אפיון במתנה (שווי 600 ש"ח)
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section style={{
                padding: '80px 20px',
                background: 'var(--bg-glass)'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '48px' }}>
                        שאלות נפוצות ❓
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            {
                                q: 'כמה זמן לוקח לחמם ליד?',
                                a: 'בדרך כלל 3-5 ימים. הליד מקבל תרגיל כל יום והבוט לומד עליו יותר ויותר.'
                            },
                            {
                                q: 'מה אם הליד לא מגיב?',
                                a: 'הבוט יודע להתמודד! הוא שולח תזכורות ידידותיות ויודע מתי לוותר כדי לא להציק.'
                            },
                            {
                                q: 'האם זה עובד לכל תחום?',
                                a: 'כן! סדרות החימום מותאמות אישית לתחום שלך - קואצ\'ינג, טיפול, עסקים, ועוד.'
                            },
                            {
                                q: 'מה קורה אם הליד לא רוצה לקנות?',
                                a: 'לא בעיה! לפחות תדע את זה לפני שהשקעת שיחת מכירה. וגם, הרבה פעמים החימום משנה את דעתם.'
                            }
                        ].map((faq, i) => (
                            <div key={i} className="card" style={{
                                padding: '0',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                            >
                                <div style={{
                                    padding: '20px 24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{faq.q}</h4>
                                    <span style={{
                                        transition: 'transform 0.3s ease',
                                        transform: activeFaq === i ? 'rotate(180deg)' : 'none'
                                    }}>▼</span>
                                </div>
                                {activeFaq === i && (
                                    <div style={{
                                        padding: '0 24px 20px',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.7
                                    }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    📞 שאלות? צור קשר: 0525666536 | 📧 libi41@gmail.com
                </p>
                <Link href="/dashboard" className="btn btn-secondary">
                    חזרה לדאשבורד
                </Link>
            </section>
        </div>
    )
}
