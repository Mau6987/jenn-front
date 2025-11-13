"use client"

import { useState, useEffect } from "react"

interface ImageSequenceProps {
  images: string[]
  alt: string
  delay?: number
  className?: string
}

export function ImageSequence({ images, alt, delay = 3000, className = "" }: ImageSequenceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, delay)

    return () => clearInterval(interval)
  }, [images.length, delay])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={images[currentIndex] || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-contain transition-opacity duration-500"
      />
    </div>
  )
}
