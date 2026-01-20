import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="dashboard-layout-new">
      {/* Top Header Navigation */}
      <header className="dashboard-header">
        {/* Logo on right (RTL) */}
        <Link href="/dashboard" className="header-logo">
          <img
            src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
            alt="Magnt.AI"
            style={{ height: '55px' }}
          />
        </Link>

        {/* Center Navigation */}
        <nav className="header-nav">
          <Link href="/dashboard" className="header-nav-link active">ראשי</Link>
          <Link href="/dashboard/tasks" className="header-nav-link">משימות</Link>
          <Link href="/dashboard/series" className="header-nav-link">סדרות</Link>
          <Link href="/dashboard/leads" className="header-nav-link">לידים</Link>
          <Link href="/about" className="header-nav-link">על המערכת</Link>
        </nav>

        {/* User Avatar on left (RTL) */}
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
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  )
}
