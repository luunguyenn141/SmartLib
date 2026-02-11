import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import UserHomePage from './pages/UserHomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BooksPage from './pages/BooksPage'
import Header from './components/Header'
import { useAuth } from './lib/auth'
import BookDetailPage from './pages/BookDetailPage'
import MyLibraryPage from './pages/MyLibraryPage'

export default function App() {
  const { token } = useAuth()

  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<UserHomePage />} />
          <Route path="/my-library" element={<MyLibraryPage />} />
          <Route path="/smart-search" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route
            path="/login"
            element={
              token
                ? <Navigate to="/" />
                : <LoginPage />
            }
          />
          <Route path="/register" element={token ? <Navigate to="/" /> : <RegisterPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
