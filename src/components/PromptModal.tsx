import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'

interface PromptOptions {
  title: string
  label?: string
  initialValue?: string
  placeholder?: string
  confirmText?: string
  type?: 'text' | 'password' | 'number'
}

type PromptFn = (opts: PromptOptions) => Promise<string | null>

const PromptContext = createContext<PromptFn | null>(null)

export function PromptProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<PromptOptions | null>(null)
  const [value, setValue] = useState('')
  const resolver = useRef<(v: string | null) => void>(() => {})

  const prompt = useCallback<PromptFn>((o) => {
    setOpts(o)
    setValue(o.initialValue ?? '')
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: string | null) => {
    resolver.current(result)
    setOpts(null)
  }

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      {opts && (
        <Modal
          title={opts.title}
          onClose={() => close(null)}
          actions={
            <>
              <button className="btn" onClick={() => close(null)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={() => close(value)}>
                {opts.confirmText ?? '확인'}
              </button>
            </>
          }
        >
          <div className="field">
            {opts.label && <label>{opts.label}</label>}
            <input
              className="input"
              type={opts.type ?? 'text'}
              value={value}
              placeholder={opts.placeholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && close(value)}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </PromptContext.Provider>
  )
}

export function usePrompt(): PromptFn {
  const ctx = useContext(PromptContext)
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider')
  return ctx
}
