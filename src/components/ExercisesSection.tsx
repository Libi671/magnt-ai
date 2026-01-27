'use client'

import { useState } from 'react'
import Link from 'next/link'
import AllExercisesModal from './AllExercisesModal'

interface Task {
    id: string
    title: string
    description: string
    is_public: boolean
    created_at: string
    users?: {
        name: string
        avatar_url: string
        email: string
    }
    leads?: { count: number }[]
}

interface ExercisesSectionProps {
    tasks: Task[]
}

export default function ExercisesSection({ tasks }: ExercisesSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <section id="feed" className="section" style={{ background: 'var(--bg-glass)' }}>
                <div className="container">
                    <h2 className="section-title">תרגילים אינטרקטיביים פופולריים</h2>

                    {tasks && tasks.length > 0 ? (
                        <>
                            <div className="feed-grid">
                                {tasks.slice(0, 6).map((task) => (
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
                                                    התחל תרגיל →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="btn btn-secondary"
                                    style={{ cursor: 'pointer' }}
                                >
                                    עוד תרגילים
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎯</div>
                            <h3 style={{ marginBottom: '12px' }}>עוד אין תרגילים ציבוריים</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                בקרוב תוכלו לראות כאן מגנטים מרהיבים מיוצרי תוכן וחברות
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <AllExercisesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
