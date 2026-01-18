'use client'

export default function CopyLinkButton({ taskId }: { taskId: string }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/t/${taskId}`)
    }

    return (
        <button
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={handleCopy}
        >
            העתק קישור
        </button>
    )
}
