"use client"

import { useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  ariaLabelledBy?: string
}

export default function Modal({ isOpen, onClose, children, ariaLabelledBy }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    lastActiveElementRef.current = (document.activeElement as HTMLElement) || null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
      if (lastActiveElementRef.current) {
        try {
          lastActiveElementRef.current.focus()
        } catch {}
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const node = dialogRef.current
    if (node) {
      node.focus()
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"))
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || active === dialog) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
      onMouseDown={handleOverlayClick}
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-background text-foreground font-inherit rounded-2xl p-6 shadow-xl w-full max-w-3xl max-h-[80vh] overflow-auto relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}


