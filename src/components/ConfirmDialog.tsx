import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'

interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(v: boolean) => void>(() => {})

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    resolver.current(result)
    setOpts(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <Modal
          title={opts.title}
          onClose={() => close(false)}
          actions={
            <>
              <button className="btn" onClick={() => close(false)}>
                {opts.cancelText ?? '취소'}
              </button>
              <button
                className={`btn ${opts.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
              >
                {opts.confirmText ?? '확인'}
              </button>
            </>
          }
        >
          {opts.message && (
            <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 'var(--fs-md)' }}>
              {opts.message}
            </p>
          )}
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
