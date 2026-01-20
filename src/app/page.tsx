import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HeroSection from '@/components/HeroSection'

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
          <a href="#feed" className="landing-nav-link">משימות</a>
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

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🎯</div>
              <h3>צור משימה</h3>
              <p>הגדר נושא, שאלות וזרימת שיחה. ה-AI יעשה את השאר.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📱</div>
              <h3>שתף בפוסט</h3>
              <p>הוסף את הקישור לפוסט שלך. עוקבים לוחצים ומתחילים חוויה.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🔥</div>
              <h3>ויראליות</h3>
              <p>האלגוריתם מעדיף תוכן אינטראקטיבי. הפוסט שלך מתפשט.</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">💰</div>
              <h3>קבל לידים</h3>
              <p>כל משתתף משאיר פרטים. אתה מקבל רשימה של לקוחות מעוניינים.</p>
            </div>

            <div className="step-card">
              <div className="step-number">5</div>
              <div className="step-icon">🔄</div>
              <h3>מחממים את הלידים</h3>
              <p>שולחים באופן אוטומטי למתעניינים סדרת מסרים ומקבלים לידים שרוצים לסלוק.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feed Section - Dark */}
      <section id="feed" className="section">
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

      {/* Pricing Section - Light */}
      <section id="pricing" className="section" style={{ background: 'var(--bg-glass)' }}>
        <div className="container">
          <h2 className="section-title">תמחור 💳</h2>

          {/* Price Anchoring */}
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 40px',
            padding: '24px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
              💡 כמה עולה לך היום כל ליד מפייסבוק? <strong>50-100 ש״ח?</strong><br />
              וכמה מהם באמת הופכים ללקוחות משלמים?
            </p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
              עם מערכת חימום אוטומטית, הלידים שלך מגיעים <strong style={{ color: 'var(--text-primary)' }}>מוכנים לקנות</strong>.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '750px', margin: '0 auto' }}>
            {/* Free Plan */}
            <div className="card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>חינמי</h3>
              <div style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>0 ש״ח</div>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>לנצח</p>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> מגנטים ללא הגבלה
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> עד 25 לידים
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> צ׳אט AI מתקדם
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    <span>❌</span> סדרת חימום
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    <span>❌</span> חיבור לוואטסאפ
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    <span>❌</span> מערכת CRM
                  </li>
                </ul>
              </div>

              <Link href="/login" className="btn btn-secondary" style={{ width: '100%' }}>
                התחל בחינם
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card" style={{ padding: '32px', border: '2px solid var(--primary-start)', position: 'relative' }}>
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

              <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center' }}>מקצועי</h3>

              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem' }}>599 ש״ח</span>
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center' }} className="glow-text">499 ש״ח</div>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>לחודש</p>

              <div style={{
                background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                🔥 מחיר השקה לזמן מוגבל
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <ul style={{ listStyle: 'none', marginBottom: '24px' }}>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> מגנטים ללא הגבלה
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> לידים ללא הגבלה
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> צ׳אט AI מתקדם
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> סדרת חימום
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> חיבור מלא לוואטסאפ
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> מערכת CRM מתקדמת
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> מחקר לקוח + תסריט שיחה
                  </li>
                  <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#22c55e' }}>✅</span> בוט מענה אישי 24/7
                  </li>
                </ul>
              </div>

              <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                הצטרף עכשיו
              </Link>
            </div>
          </div>

          {/* Bonus Banner */}
          <div style={{
            maxWidth: '750px',
            margin: '40px auto 0',
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
              2 פגישות אפיון אישיות להתאמה מושלמת של המערכת לעסק שלך<br />
              <strong style={{ color: 'var(--text-primary)' }}>(שווי 600 ש״ח - במתנה!)</strong>
            </p>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              📞 0525666536 | 📧 libi41@gmail.com
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Dark */}
      <section id="faq" className="section">
        <div className="container">
          <h2 className="section-title">שאלות נפוצות ❓</h2>

          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>איך זה שונה מלפרסם קישור לדף נחיתה רגיל?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                מגנט AI יוצר חוויה אינטראקטיבית ואישית עם כל מבקר. במקום טופס קר ומרוחק, הלקוח מנהל שיחה אמיתית עם AI שמבין את הצרכים שלו, וזה מגדיל משמעותית את יחסי ההמרה.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>מה קורה עם הלידים שנאספו?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                נשלח לכם מייל מסודר אחרי כל ליד שהשגתם. במייל תקבלו את פרטי הקשר של הליד ודוח מסכם על הלקוח. בנוסף, הלידים נשמרים בדאשבורד שלכם. אתם מקבלים גישה מלאה לפרטים, כולל השם, הטלפון, האימייל ותמליל השיחה המלא.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>כמה זמן לוקח להקים מגנט?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                דקות ספורות! אתם מגדירים נושא, כותבים תיאור קצר ושאלה פותחת - והמערכת עושה את השאר. ה-AI יודע לנהל את השיחה בצורה טבעית.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>האם זה עובד בעברית?</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                כן! המערכת תוכננה מהיסוד לעבוד בעברית, כולל תמיכה ב-RTL ובינה מלאכותית שמבינה ומדברת עברית באופן טבעי.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Me Section - Light */}
      <section id="about-me" className="section" style={{ background: 'var(--bg-glass)' }}>
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
          </div>
        </div>
      </section>

      {/* Final CTA - Dark */}
      <section className="section">
        <div className="container">
          <div className="card cta-card">
            <h2>הגיע הזמן להפוך תוכן להכנסה</h2>
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
