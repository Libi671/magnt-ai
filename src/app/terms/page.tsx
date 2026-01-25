import Link from 'next/link'

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <header className="landing-header">
                <Link href="/" className="header-logo">
                    <img
                        src="/logo.png"
                        alt="Magnt.AI"
                        style={{ height: '65px' }}
                    />
                </Link>

                <Link href="/" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                    לעמוד הבית
                </Link>
            </header>

            {/* Content */}
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '60px', maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '40px', textAlign: 'center' }}>
                    תקנון האתר
                </h1>

                <div className="card" style={{ padding: '40px' }}>
                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>1. הגדרות</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            "האתר" - אתר Magnt.AI ושירותיו.<br />
                            "המשתמש" - כל אדם הגולש באתר או משתמש בשירותיו.<br />
                            "היוצר" - בעל עסק או יוצר תוכן שמשתמש בפלטפורמה ליצירת מגנטים.<br />
                            "מגנט" - כלי אינטראקטיבי ליצירת קשר ואיסוף פרטים.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>2. קבלת התנאים</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            השימוש באתר ובשירותיו מהווה הסכמה לתנאים אלה. אם אינך מסכים לתנאים, אנא הימנע משימוש באתר.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>3. שירותי האתר</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            Magnt.AI מספק פלטפורמה ליצירת כלים אינטראקטיביים (מגנטים) לאיסוף לידים וניהול שיחות עם לקוחות פוטנציאליים באמצעות בינה מלאכותית.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>4. הסכמה לדיוור ותקשורת שיווקית</h2>
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
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>5. פרטיות ואבטחת מידע</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            אנו מתחייבים לשמור על פרטיות המידע שלך בהתאם לחוק הגנת הפרטיות. המידע שנאסף ישמש אך ורק למטרות המפורטות בתקנון זה.<br /><br />
                            המידע נשמר בשרתים מאובטחים ולא יימסר לצדדים שלישיים, למעט ליוצר המגנט בו השתתפת.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>6. זכויות יוצרים וקניין רוחני</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            כל התכנים באתר, לרבות עיצוב, טקסטים, לוגו, קוד וטכנולוגיה, הם קניינה הבלעדי של Magnt.AI ואין לעשות בהם שימוש ללא אישור בכתב.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>7. אחריות</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            האתר מסופק "כמות שהוא" (AS IS). איננו אחראים לנזקים ישירים או עקיפים שעלולים להיגרם כתוצאה משימוש באתר.<br /><br />
                            יוצרי המגנטים הם האחראים הבלעדיים לתוכן שהם יוצרים ולהתקשרות עם הלקוחות שלהם.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>8. שינויים בתקנון</h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            אנו שומרים לעצמנו את הזכות לעדכן תקנון זה מעת לעת. המשך השימוש באתר לאחר עדכון התקנון מהווה הסכמה לתנאים המעודכנים.
                        </p>
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: 'var(--primary-start)' }}>9. יצירת קשר</h2>
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
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <img
                            src="/logo.png"
                            alt="Magnt.AI"
                            style={{ height: '30px', opacity: 0.7 }}
                        />
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        © 2026 Magnt.AI - פלטפורמת מגנטי לידים מבוססת AI
                    </div>
                </div>
            </footer>
        </div>
    )
}
