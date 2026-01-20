'use client'

import { useState, useEffect } from 'react'

const words = ['לחוויה אינטראקטיבית', 'לממיר לידים', 'לוויראלי']

export default function TypewriterText() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentText, setCurrentText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const word = words[currentWordIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (currentText.length < word.length) {
                    setCurrentText(word.substring(0, currentText.length + 1))
                } else {
                    // Wait before deleting
                    setTimeout(() => setIsDeleting(true), 2000)
                }
            } else {
                // Deleting
                if (currentText.length > 0) {
                    setCurrentText(word.substring(0, currentText.length - 1))
                } else {
                    setIsDeleting(false)
                    setCurrentWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }, isDeleting ? 50 : 100)

        return () => clearTimeout(timeout)
    }, [currentText, isDeleting, currentWordIndex])

    return (
        <span className="typewriter-text">
            {currentText}
            <span className="typewriter-cursor">|</span>
        </span>
    )
}
