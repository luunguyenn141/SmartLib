import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Header() {
  const { token, logout } = useAuth()

  return (
    <header className="header">
      <div className="brand">
        <Link to="/" className="logo">SMARTLIB</Link>
      </div>
      <nav className="nav">
        <NavLink to="/" end>Home</NavLink>
        {token && <NavLink to="/my-library">My Library</NavLink>}
        <NavLink to="/smart-search">SmartSearch</NavLink>
        <NavLink to="/books">Books</NavLink>
        {token && <button className="ghost" onClick={logout}>Logout</button>}
      </nav>
    </header>
  )
}
