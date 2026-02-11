import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import type { AuthResponse } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<AuthResponse>('/api/auth/register', { username, email, password })
      login(res.token)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth">
      <form className="form" onSubmit={submit}>
        <h2>Create account</h2>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div className="alert">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
