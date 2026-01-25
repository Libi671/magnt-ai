import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

export default async function AboutPage() {
    const supabase = await createClient()

    // Get current user for avatar
    const { data: { user } } = await supabase.auth.getUser()

    // Get some public tasks for the feed with leads count
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
            {/* Header - Same as Dashboard */}
            <header className="dashboard-header">
                {/* Mobile Navigation - appears first for RTL (right side) */}
                <MobileNav />

                {/* Logo on right (RTL) */}
                <Link href="/dashboard" className="header-logo">
                    <img
                        src="/logo.png"
                        alt="Magnt.AI"
                        style={{ height: '55px' }}
                    />
                </Link>

                {/* Center Navigation */}
                <nav className="header-nav">
                    <Link href="/dashboard" className="header-nav-link">ראשי</Link>
                    <Link href="/dashboard/tasks" className="header-nav-link">מגנטים</Link>
                    <Link href="/dashboard/series" className="header-nav-link">מרתיחי לידים</Link>
                    <Link href="/dashboard/leads" className="header-nav-link">לידים</Link>
                    <Link href="/about" className="header-nav-link active">על המערכת</Link>
                </nav>

                {/* User Avatar on left (RTL) */}
                {user && (
                    <div className="header-user">
                        {user.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt={user.user_metadata?.full_name || 'User'}
                                className="header-avatar"
                            />
                        ) : (
                            <div className="header-avatar-placeholder">
                                {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Hero Section - Compact */}
            <section style={{ paddingTop: '140px', paddingBottom: '80px', textAlign: 'center' }}>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
                        על <span className="glow-text">Magnt.AI</span>
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        הפלטפורמה שמאפשרת למאמנים, מטפלים ויועצים להפוך את התוכן שלהם למכונת לידים אוטומטית
                    </p>
                </div>

                {/* Scroll indicator */}
                <div style={{ marginTop: '24px', animation: 'bounce 2s infinite' }}>
                    <a href="#problem" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
                        גלול למטה ↓
                    </a>
                </div>
            </section>

            {/* The Problem Section - Reordered */}
            <section id="problem" className="section" style={{ background: 'var(--bg-glass)' }}>
                <div className="container">
                    <h2 className="section-title">הבעיה 😤</h2>

                    <div className="card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* First - Hard to convert */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <span style={{ fontSize: '2rem' }}>💸</span>
                                <div>
                                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>קשה להמיר עוקבים ללקוחות</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        אין דרך קלה לאסוף פרטים של מתעניינים ולהמשיך איתם את השיחה מחוץ לרשת.
                                    </p>
                                </div>
                            </div>

                            {/* Second - Cold leads */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <span style={{ fontSize: '2rem' }}>❄️</span>
                                <div>
                                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>הלידים שלכם קרים מדי</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        הלידים שמגיעים מהרשתות החברתיות לא עברו תהליכי חימום. הם לא מכירים אתכם מספיק ולא מוכנים לקנות.
                                    </p>
                                </div>
                            </div>

                            {/* Third - Content investment */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <span style={{ fontSize: '2rem' }}>📱</span>
                                <div>
                                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>משקיעים זמן ביצירת תוכן</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        אתם כותבים פוסטים, מעלים סרטונים, יוצרים תוכן מעולה... אבל מקבלים בעיקר לייקים ותגובות.
                                    </p>
                                </div>
                            </div>

                            {/* Fourth - Algorithm */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <span style={{ fontSize: '2rem' }}>😩</span>
                                <div>
                                    <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>תלויים באלגוריתם</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        הפידים משתנים כל הזמן, והחשיפה יורדת. קשה להגיע לקהל היעד בצורה עקבית.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Solution Section - Updated text */}
            <section id="solution" className="section">
                <div className="container">
                    <h2 className="section-title">הפתרון 💡</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 40px' }}>
                        Magnt.AI הופך כל פוסט שלכם ל"מגנט לידים" - כלי אינטראקטיבי שאוסף פרטים של מתעניינים <strong style={{ color: 'var(--text-primary)' }}>ומחמם אותם אוטומטית</strong> עד שהם מוכנים לרכישה
                    </p>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">🎯</div>
                            <h3>צור מגנט</h3>
                            <p>הגדר נושא, שאלות וזרימת שיחה. ה-AI יוביל את השיחה עם המשתתפים.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">📱</div>
                            <h3>שתף בתוכן</h3>
                            <p>הוסף את הקישור לפוסט, סטורי או ביו. העוקבים לוחצים ומקבלים חוויה אינטראקטיבית.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">🔥</div>
                            <h3>ויראליות</h3>
                            <p>האלגוריתם מעדיף תוכן אינטראקטיבי. הפוסטים שלך זוכים ליותר חשיפה.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">4</div>
                            <div className="step-icon">💰</div>
                            <h3>קבל לידים</h3>
                            <p>כל משתתף משאיר פרטים. אתה מקבל רשימה של לקוחות פוטנציאליים.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">5</div>
                            <div className="step-icon">🔄</div>
                            <h3>חימום אוטומטי</h3>
                            <p>המערכת שולחת באופן אוטומטי סדרת מסרים למתעניינים עד שהם מוכנים לרכישה.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Who Is This For */}
            <section className="section" style={{ background: 'var(--bg-glass)' }}>
                <div className="container">
                    <h2 className="section-title">למי זה מתאים? 🎯</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
                        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧘</div>
                            <h3 style={{ marginBottom: '12px' }}>מאמנים ומטפלים</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                הפכו את הפוסטים שלכם לכלי שאוסף לידים של אנשים שמחפשים שינוי
                            </p>
                        </div>

                        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💼</div>
                            <h3 style={{ marginBottom: '12px' }}>יועצים ומנטורים</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                צרו חוויות אינטראקטיביות שמדגימות את הערך שלכם ואוספות לקוחות פוטנציאליים
                            </p>
                        </div>

                        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎨</div>
                            <h3 style={{ marginBottom: '12px' }}>יוצרי תוכן</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                הפכו את הקהל שלכם לרשימת תפוצה שתוכלו לשווק לה מוצרים ושירותים
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section - New Design */}
            <section id="pricing" className="section">
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
                                    <li style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                        <span>❌</span> מחקר לקוח
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

            {/* FAQ Section */}
            <section id="faq" className="section" style={{ background: 'var(--bg-glass)' }}>
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
                            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>האם אני יכול לראות את השיחות?</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                בהחלט! כל שיחה נשמרת, ותוכלו לראות בדיוק מה כל ליד אמר. זה נותן לכם הבנה עמוקה של מה הלקוחות הפוטנציאליים שלכם מחפשים.
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

            {/* About Me Section */}
            <section className="section">
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

            {/* Feed Section - Updated */}
            <section id="feed" className="section" style={{ background: 'var(--bg-glass)' }}>
                <div className="container">
                    <h2 className="section-title">מגנטים פופולריים</h2>

                    {sortedTasks && sortedTasks.length > 0 ? (
                        <>
                            <div className="feed-grid">
                                {sortedTasks.slice(0, 6).map((task) => (
                                    <Link key={task.id} href={`/t/${task.id}`} style={{ textDecoration: 'none' }}>
                                        <div className="card task-card" style={{ padding: '24px', height: '100%' }}>
                                            {/* Task Info */}
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

                                            {/* CTA */}
                                            <div style={{ marginTop: 'auto' }}>
                                                <span className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                                    התחל מגנט →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {sortedTasks.length > 6 && (
                                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                    <Link href="/dashboard/tasks" className="btn btn-secondary">
                                        לכל המגנטים
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
                            <h3 style={{ marginBottom: '12px' }}>עוד אין מגנטים ציבוריים</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                בקרוב תוכלו לראות כאן מגנטים מרהיבים מיוצרי תוכן וחברות
                            </p>
                        </div>
                    )}
                </div>
            </section>

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
