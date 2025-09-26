"use client"

import Modal from "@/components/ui/Modal"

type LegalModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  id?: string
}

export default function LegalModal({ isOpen, onClose, title, content, id }: LegalModalProps) {
  const headingId = id || "legal-modal-title"
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabelledBy={headingId}>
      <h2 id={headingId} className="text-2xl font-bold mb-4">
        {title}
      </h2>
      <article className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
        {content}
      </article>
    </Modal>
  )
}


