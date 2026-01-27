'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Task {
    id: string
    title: string
    description: string
    is_public: boolean
    created_at: string
    users: {
        name: string
        avatar_url: string
        email: string
    }
    leads: { count: number }[]
}

interface AllExercisesModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AllExercisesModal({ isOpen, onClose }: AllExercisesModalProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchAllPublicTasks()
        }
    }, [isOpen])

    const fetchAllPublicTasks = async () => {
        setLoading(true)
        const supabase = createClient()

        const { data } = await supabase
            .from('tasks')
            .select('*, users(name, avatar_url, email), leads(count)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })

        if (data) {
            // Sort by leads count (descending)
            const sortedTasks = data.sort((a, b) => {
                const aLeads = a.leads?.[0]?.count || 0
                const bLeads = b.leads?.[0]?.count || 0
                return bLeads - aLeads
            })
            setTasks(sortedTasks)
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    maxWidth: '900px',
                    width: '100%',
                    maxHeight: '85vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        כל התרגילים האינטרקטיביים 🎯
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '8px',
                            lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                            <p style={{ color: 'var(--text-secondary)' }}>טוען תרגילים...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                            <p style={{ color: 'var(--text-secondary)' }}>אין תרגילים ציבוריים כרגע</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {tasks.map((task) => (
                                <Link key={task.id} href={`/t/${task.id}`} style={{ textDecoration: 'none' }} onClick={onClose}>
                                    <div className="card task-card" style={{
                                        padding: '20px',
                                        height: '100%',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'pointer'
                                    }}>
                                        <h3 style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            marginBottom: '10px',
                                            color: 'white',
                                            lineHeight: 1.4
                                        }}>
                                            {task.title}
                                        </h3>
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.5,
                                            marginBottom: '16px'
                                        }}>
                                            {task.description?.substring(0, 80)}{task.description?.length > 80 ? '...' : ''}
                                        </p>

                                        <div style={{ marginTop: 'auto' }}>
                                            <span className="btn btn-primary" style={{
                                                width: '100%',
                                                justifyContent: 'center',
                                                fontSize: '0.9rem',
                                                padding: '10px 16px'
                                            }}>
                                                התחל תרגיל →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        סה״כ {tasks.length} תרגילים ציבוריים
                    </p>
                </div>
            </div>
        </div>
    )
}
