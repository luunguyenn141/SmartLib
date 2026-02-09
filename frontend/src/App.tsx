import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BooksPage from './pages/BooksPage'
import Header from './components/Header'
import { useAuth } from './lib/useAuth'

export default function App() {
  const { token } = useAuth()

  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/login" element={token ? <Navigate to="/books" /> : <LoginPage />} />
          <Route path="/register" element={token ? <Navigate to="/books" /> : <RegisterPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
