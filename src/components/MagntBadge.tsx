'use client'

import Link from 'next/link'

export default function MagntBadge() {
    return (
        <Link
            href="/"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 50,
                textDecoration: 'none'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(40, 40, 60, 0.95))',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(102, 126, 234, 0.5)',
                borderRadius: '50px',
                fontSize: '1rem',
                color: 'white',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
                className="magnt-badge"
            >
                <img
                    src="/logo.png"
                    alt="Magnt.AI"
                    style={{ height: '32px', width: 'auto' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-start)' }}>Magnt.AI</span>
                    <span style={{ fontSize: '0.85rem', color: '#ccc' }}>נוצר עם Magnt.AI - ללקוחות ועסקאות</span>
                </div>
            </div>

            <style jsx>{`
        .magnt-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          border-color: rgba(102, 126, 234, 0.5);
        }
      `}</style>
        </Link>
    )
}
