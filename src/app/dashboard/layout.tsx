import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'

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
        {/* Mobile Navigation - appears first for RTL (right side) */}
        <MobileNav />

        {/* Logo */}
        <Link href="/dashboard" className="header-logo">
          <img
            src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/h7SVISj2gc8u4uM3tWvn/pub/HpsRFj9upJPibhNfMR0q.png"
            alt="Magnt.AI"
            style={{ height: '55px' }}
          />
        </Link>

        {/* Center Navigation - Desktop */}
        <nav className="header-nav">
          <Link href="/dashboard" className="header-nav-link active">ראשי</Link>
          <Link href="/dashboard/tasks" className="header-nav-link">מגנטים</Link>
          <Link href="/dashboard/series" className="header-nav-link">מרתיחי לידים</Link>
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
