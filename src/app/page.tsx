import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import PricingSection from '@/components/PricingSection'

export default async function LandingPage() {
  const supabase = await createClient()

  // Get public tasks with leads count
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, users(name, avatar_url, email), leads(count)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)

  // Sort tasks: by leads count (descending), then libi41@gmail.com first
  const sortedTasks = tasks?.sort((a, b) => {
    const aLeads = a.leads?.[0]?.count || 0
    const bLeads = b.leads?.[0]?.count || 0
    if (aLeads !== bLeads) return bLeads - aLeads // More leads first
    const aIsLibi = a.users?.email === 'libi41@gmail.com' ? 0 : 1
    const bIsLibi = b.users?.email === 'libi41@gmail.com' ? 0 : 1
    return aIsLibi - bIsLibi
  }).slice(0, 6)

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="landing-header">
        <Link href="/" className="header-logo">
          <img
            src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
            alt="Magnt.AI"
            style={{ height: '65px' }}
          />
        </Link>

        <nav className="landing-nav">
          <a href="#how" className="landing-nav-link">איך זה עובד</a>
          <a href="#pricing" className="landing-nav-link">תמחור</a>
          <a href="#faq" className="landing-nav-link">שאלות נפוצות</a>
          <a href="#about-me" className="landing-nav-link">עלי</a>
        </nav>

        <Link href="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
          התחבר
        </Link>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* How It Works - Light */}
      <section id="how" className="section" style={{ background: 'var(--bg-glass)' }}>
        <div className="container">
          <h2 className="section-title">איך זה עובד?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '-20px', marginBottom: '40px' }}>
            יוצרים מגנט ⬅ מקבלים לידים,<br />
            יוצרים אתגר ⬅ משיגים לקוחות.
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🎯</div>
              <h3>צור מגנט</h3>
              <p>הכנס פוסט או הגדר נושא. ה-AI יצור לך מגנט לידים עם קישור לשתף.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📱</div>
              <h3>שתף בפוסט</h3>
              <p>הוסף את הקישור לפוסט שלך. עוקבים לוחצים ומתחילים חוויה.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">💰</div>
              <h3>קבל לידים</h3>
              <p>כל משתתף משאיר פרטים. אתה מקבל רשימה של לקוחות מעוניינים.</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">🔄</div>
              <h3>מחממים את הלידים</h3>
              <p>שולחים באופן אוטומטי למתעניינים סדרת מסרים ומקבלים לידים שרוצים לסלוק.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feed Section - Dark - HIDDEN */}
      <section id="feed" className="section" style={{ display: 'none' }}>
        <div className="container">
          <h2 className="section-title">משימות פופולריות</h2>

          {sortedTasks && sortedTasks.length > 0 ? (
            <>
              <div className="feed-grid">
                {sortedTasks.slice(0, 6).map((task) => (
                  <Link key={task.id} href={`/t/${task.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card task-card" style={{ padding: '24px', height: '100%' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: 'white' }}>
                        {task.title}
                      </h3>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        marginBottom: '16px'
                      }}>
                        {task.description?.substring(0, 100)}{task.description?.length > 100 ? '...' : ''}
                      </p>

                      <div style={{ marginTop: 'auto' }}>
                        <span className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                          התחל משימה →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {sortedTasks.length >= 6 && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <Link href="/login" className="btn btn-secondary">
                    לכל המשימות
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
              <h3 style={{ marginBottom: '12px' }}>עוד אין משימות ציבוריות</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                היה הראשון ליצור משימה!
              </p>
              <Link href="/login" className="btn btn-primary">
                התחבר וצור משימה
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section - Light */}
      <section id="faq" className="section" style={{ background: 'var(--bg-glass)' }}>
        <div className="container">
          <h2 className="section-title">שאלות נפוצות ❓</h2>

          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>איך זה שונה מלפרסם קישור לדף נחיתה או לשלוח מדריך בPDF?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                מגנט AI יוצר חוויה אינטראקטיבית ואישית עם כל מבקר. במקום טופס קר ומרוחק, הלקוח מנהל שיחה אמיתית עם AI שמבין את הצרכים שלו, וזה מגדיל משמעותית את יחסי ההמרה.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>מה קורה עם הלידים שנאספו?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                נשלח לכם מייל מסודר אחרי כל ליד שהשגתם. במייל תקבלו את פרטי הקשר של הליד ודוח מסכם עם כאבים צרכים ותסריט שיחה של הלקוח. בנוסף תוכלו להעביר את הלידים סדרת חימום על ידי אתגר AI.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>כמה זמן לוקח להקים מגנט?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                3 דקות! מעלים פוסט שכתבתם או מגדירים נושא וה-AI עושה בשבילך את כל השאר. סקפטי? תפעיל טיימר ותנסה - <Link href="/login" style={{ color: 'var(--primary-start)' }}>התחבר ונסה עכשיו</Link>.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>זה מסובך??</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                ממש לא! תנסה בעצמך, אם בכל זאת הסתבכת אפשר ליצור איתי קשר ונעשה את זה ביחד:<br />
                <a href="tel:0525666536" style={{ color: 'var(--primary-start)' }}>052-5666536 (אליסף)</a>
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>האם זה עובד בעברית?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                בטח! המערכת תוכננה מהיסוד לעבוד בעברית, כולל תמיכה ב-RTL ובינה מלאכותית שמבינה ומדברת עברית באופן טבעי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Me Section - Dark */}
      <section id="about-me" className="section">
        <div className="container">
          <h2 className="section-title">עלי 👋</h2>

          <div className="card" style={{ padding: '40px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <img
              src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HgkE3WgtCQzmtdQ6uo5b.png"
              alt="אליסף ליבי"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '0 auto 24px',
                border: '4px solid var(--primary-start)'
              }}
            />

            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>אליסף ליבי</h3>
            <p style={{ color: 'var(--primary-start)', marginBottom: '20px' }}>יזם ומנכ״ל</p>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '1.05rem' }}>
              אני אוהב ללמוד וללמד, לפתח ולהשפיע בגדול.
              <br /><br />
              אני לא אוהב לשווק ולמכור - לכן יצרתי מערכת AI חכמה שעושה בשבילי את כל העבודה השחורה.
              <br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>אני משוכנע שהיא תעזור גם לך.</strong>
            </p>

            {/* Contact Icons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
              <a href="tel:0525666536" title="שיחה" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(102, 126, 234, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)',
                transition: 'background 0.3s'
              }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </a>
              <a href="https://wa.me/972525666536" target="_blank" rel="noopener noreferrer" title="ווטסאפ" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(37, 211, 102, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#25D366',
                transition: 'background 0.3s'
              }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5.16-1.34C8.62 21.51 10.27 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.58 0-3.07-.41-4.37-1.12l-.31-.18-3.24.84.86-3.15-.2-.32A7.963 7.963 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </a>
              <a href="mailto:libi41@gmail.com" title="אימייל" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(102, 126, 234, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)',
                transition: 'background 0.3s'
              }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
              <a href="https://calendar.app.google/73nkXWeKk2EhtrpB6" target="_blank" rel="noopener noreferrer" title="קבע פגישה" style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(245, 87, 108, 0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#f5576c',
                transition: 'background 0.3s'
              }}>
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Light */}
      <section className="section" style={{ background: 'var(--bg-glass)' }}>
        <div className="container">
          <div className="card cta-card">
            <h2>הגיע הזמן שלך להפוך למגנט של לקוחות ועסקאות</h2>
            <p>הצטרפו לאלפי יוצרים שכבר משתמשים ב-Magnt.AI</p>
            <Link href="/login" className="btn btn-primary btn-large">
              התחילו בחינם עכשיו
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <img
              src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
              alt="Magnt.AI"
              style={{ height: '30px', opacity: 0.7 }}
            />
          </div>
          <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            תקנון
          </Link>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            © 2026 Magnt.AI - פלטפורמת מגנטי לידים מבוססת AI
          </div>
        </div>
      </footer>
    </div>
  )
}
