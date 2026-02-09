import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function Header() {
  const { token, logout } = useAuth()

  return (
    <header className="header">
      <div className="brand">
        <Link to="/" className="logo">SmartLib</Link>
        <span className="tagline">AI-Powered Library</span>
      </div>
      <nav className="nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/books">Books</NavLink>
        {!token && <NavLink to="/login">Login</NavLink>}
        {!token && <NavLink to="/register">Register</NavLink>}
        {token && <button className="ghost" onClick={logout}>Logout</button>}
      </nav>
    </header>
  )
}
