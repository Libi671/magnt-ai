'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Task {
    id: string
    title: string
    description?: string
    ai_prompt?: string
    first_question?: string
    is_public: boolean
    show_conversations: boolean
    notify_email?: string
    post_url?: string
}

interface EditTaskModalProps {
    task: Task
    onClose: () => void
    onUpdate: () => void
}

export default function EditTaskModal({ task, onClose, onUpdate }: EditTaskModalProps) {
    const [loading, setLoading] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState<Task>({
        ...task,
        description: task.description || '',
        ai_prompt: task.ai_prompt || '',
        first_question: task.first_question || '',
        notify_email: task.notify_email || '',
        post_url: task.post_url || ''
    })

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Debug logging
    console.log('EditTaskModal received task:', task)

    // Ensure state updates if task prop changes deeply (though unmounting should handle it)
    useEffect(() => {
        setFormData({
            ...task,
            description: task.description || '',
            ai_prompt: task.ai_prompt || '',
            first_question: task.first_question || '',
            notify_email: task.notify_email || '',
            post_url: task.post_url || ''
        })
    }, [task])

    const handleSave = async () => {
        setLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: formData.title,
                    description: formData.description,
                    ai_prompt: formData.ai_prompt,
                    first_question: formData.first_question,
                    is_public: formData.is_public,
                    show_conversations: formData.show_conversations,
                    notify_email: formData.notify_email || null,
                    post_url: formData.post_url || null
                })
                .eq('id', task.id)

            if (error) throw error

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error updating task:', error)
            alert('שגיאה בשמירת השינויים')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true)
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)

            if (error) throw error

            onUpdate()
            onClose()
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('שגיאה במחיקת המשימה')
        } finally {
            setLoading(false)
            setShowDeleteConfirm(false)
        }
    }

    if (!mounted) return null

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div className="card" style={{
                width: '600px',
                minWidth: '600px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ fontSize: '1.4rem', margin: 0 }}>עריכת משימה</h2>
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        style={{ padding: '8px', minWidth: 'auto' }}
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>נושא</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="נושא המגנט"
                            style={{ fontSize: '0.95rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>תיאור</label>
                        <textarea
                            className="input"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="תיאור קצר"
                            rows={2}
                            style={{ fontSize: '0.95rem', resize: 'vertical' }}
                        />
                    </div>



                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>הנחיות לבוט</label>
                        <textarea
                            className="input"
                            value={formData.ai_prompt}
                            onChange={(e) => setFormData(prev => ({ ...prev, ai_prompt: e.target.value }))}
                            placeholder="הנחיות לבוט"
                            rows={5}
                            style={{ fontSize: '0.9rem', resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>שאלה פותחת</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.first_question}
                            onChange={(e) => setFormData(prev => ({ ...prev, first_question: e.target.value }))}
                            placeholder="שאלה פותחת"
                            style={{ fontSize: '0.95rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>קישור לפוסט</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.post_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, post_url: e.target.value }))}
                            placeholder="קישור לפוסט (אופציונלי)"
                            style={{ fontSize: '0.95rem' }}
                        />
                    </div>

                    {/* Settings Section */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>⚙️ הגדרות</h3>

                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>אימייל להודעות</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.notify_email}
                                onChange={(e) => setFormData(prev => ({ ...prev, notify_email: e.target.value }))}
                                placeholder="אימייל לקבלת התראות על לידים"
                                style={{ fontSize: '0.95rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-start)' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>הצג את המגנט באופן ציבורי</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.show_conversations}
                                    onChange={(e) => setFormData(prev => ({ ...prev, show_conversations: e.target.checked }))}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-start)' }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>הצג תשובות משתתפים אחרים</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    justifyContent: 'space-between'
                }}>
                    {/* Delete Button - Left Side */}
                    <button
                        onClick={handleDelete}
                        className="btn btn-secondary"
                        disabled={loading}
                        style={{
                            background: showDeleteConfirm ? 'linear-gradient(135deg, #f5576c, #f093fb)' : undefined,
                            color: showDeleteConfirm ? 'white' : undefined
                        }}
                    >
                        {showDeleteConfirm ? '⚠️ בטוח? לחץ שוב' : '🗑️ מחק משימה'}
                    </button>

                    {/* Right Side Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(false)
                                onClose()
                            }}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'שומר...' : 'שמור שינויים'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        , document.body)
}
