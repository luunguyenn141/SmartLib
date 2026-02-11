import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unexpected frontend error'
    }
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Frontend error</h2>
          <p>The app hit a runtime error after reload. Please refresh once.</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
