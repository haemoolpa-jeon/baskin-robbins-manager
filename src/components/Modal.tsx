import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title?: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Footer action buttons. */
  actions?: ReactNode
}

/** A bottom-sheet (phone) / centered card (tablet) modal rendered in a portal.
 *  Closes on backdrop click and the Escape key. */
export function Modal({ title, subtitle, onClose, children, actions }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {title && <div className="modal-title">{title}</div>}
        {subtitle && <div className="modal-subtitle">{subtitle}</div>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
