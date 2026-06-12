import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Catches render errors so a bug never leaves the owner staring at a blank
 *  white screen — shows a friendly message + a reload button instead. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-screen">
          <div className="login-box">
            <div className="login-logo">😵</div>
            <h1 className="login-title" style={{ fontSize: 'var(--fs-xl)' }}>
              문제가 발생했습니다
            </h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 'var(--sp-4)' }}>
              앱을 다시 시작해 주세요.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
              다시 시작
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
