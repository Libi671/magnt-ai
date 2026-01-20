'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EditTaskModal from './EditTaskModal'

interface EditTaskButtonProps {
    task: any
    className?: string
    style?: React.CSSProperties
}

export default function EditTaskButton({ task, className = "btn btn-secondary", style = {} }: EditTaskButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleUpdate = () => {
        router.refresh()
    }

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(true)
                }}
                className={className}
                style={style}
            >
                עריכה
            </button>

            {isOpen && (
                <EditTaskModal
                    task={task}
                    onClose={() => setIsOpen(false)}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    )
}
