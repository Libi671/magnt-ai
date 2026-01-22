'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Hamburger Button - shows only on mobile */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="תפריט"
            >
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsOpen(false)}>
                    <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <Link href="/dashboard" className="mobile-menu-link" onClick={() => setIsOpen(false)}>
                            🏠 ראשי
                        </Link>
                        <Link href="/dashboard/tasks" className="mobile-menu-link" onClick={() => setIsOpen(false)}>
                            🧲 מגנטים
                        </Link>
                        <Link href="/dashboard/series" className="mobile-menu-link" onClick={() => setIsOpen(false)}>
                            🔥 מרתיחי לידים
                        </Link>
                        <Link href="/dashboard/leads" className="mobile-menu-link" onClick={() => setIsOpen(false)}>
                            👥 לידים
                        </Link>
                        <Link href="/about" className="mobile-menu-link" onClick={() => setIsOpen(false)}>
                            ℹ️ על המערכת
                        </Link>
                    </nav>
                </div>
            )}
        </>
    )
}
