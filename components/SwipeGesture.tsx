'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SwipeGestureProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  children: React.ReactNode
  className?: string
}

export default function SwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  children,
  className = ''
}: SwipeGestureProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout>()

  // Calcular distância do swipe
  const minSwipeDistance = threshold

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
    setIsLongPress(false)
    
    // Detectar long press
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
    }, 500)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    if (!touchStart || !touchEnd || isLongPress) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance
    const isDownSwipe = distanceY < -minSwipeDistance

    // Determinar se é swipe horizontal ou vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Swipe horizontal
      if (isLeftSwipe && onSwipeLeft) {
        e.preventDefault()
        onSwipeLeft()
      }
      if (isRightSwipe && onSwipeRight) {
        e.preventDefault()
        onSwipeRight()
      }
    } else {
      // Swipe vertical
      if (isUpSwipe && onSwipeUp) {
        e.preventDefault()
        onSwipeUp()
      }
      if (isDownSwipe && onSwipeDown) {
        e.preventDefault()
        onSwipeDown()
      }
    }
  }

  // Adicionar feedback visual durante o swipe
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null)

  useEffect(() => {
    if (!touchStart || !touchEnd) {
      setSwipeDirection(null)
      return
    }

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      setSwipeDirection(distanceX > 0 ? 'left' : 'right')
    } else {
      setSwipeDirection(distanceY > 0 ? 'up' : 'down')
    }
  }, [touchStart, touchEnd])

  return (
    <div
      ref={containerRef}
      className={`relative swipe-container ${className} ${
        swipeDirection ? 'swipe-active' : ''
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch',
        transition: swipeDirection ? 'transform 0.1s ease' : 'none',
        transform: swipeDirection ? 'scale(0.99)' : 'scale(1)'
      }}
    >
      {children}
      
      {/* Indicador visual de swipe */}
      {swipeDirection && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-black/20 text-white px-4 py-2 rounded-lg flex items-center">
            {swipeDirection === 'left' && (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Próxima
              </>
            )}
            {swipeDirection === 'right' && (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </>
            )}
            {swipeDirection === 'up' && (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Salvar
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook personalizado para gestos
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 100
) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = threshold

  const onTouchStartHandler = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMoveHandler = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndHandler = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft()
    if (isRightSwipe && onSwipeRight) onSwipeRight()
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, minSwipeDistance])

  useEffect(() => {
    const target = document.body

    target.addEventListener('touchstart', onTouchStartHandler)
    target.addEventListener('touchmove', onTouchMoveHandler)
    target.addEventListener('touchend', onTouchEndHandler)

    return () => {
      target.removeEventListener('touchstart', onTouchStartHandler)
      target.removeEventListener('touchmove', onTouchMoveHandler)
      target.removeEventListener('touchend', onTouchEndHandler)
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, onTouchEndHandler])
}