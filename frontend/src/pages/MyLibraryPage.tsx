import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiDelete, apiGet, apiPatch } from '../lib/api'
import { useAuth } from '../lib/auth'

type ReadingStatus = 'TO_READ' | 'READING' | 'FINISHED' | 'DROPPED'
type StatusFilter = 'ALL' | ReadingStatus

type MyBook = {
  id: number
  bookId: number
  title: string
  author: string
  imageUrl?: string
  status: ReadingStatus
  rating?: number
  progressPercent: number
}

type ReadingSession = {
  id: number
  bookId: number
  minutesRead: number
  pagesRead: number
}

const statusOptions: ReadingStatus[] = ['TO_READ', 'READING', 'FINISHED', 'DROPPED']

export default function MyLibraryPage() {
  const { token } = useAuth()
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [books, setBooks] = useState<MyBook[]>([])
  const [sessionStatsByBookId, setSessionStatsByBookId] = useState<Record<number, { minutes: number; pages: number }>>({})
  const [loading, setLoading] = useState(false)
  const [busyBookId, setBusyBookId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`
      const [booksData, sessionsData] = await Promise.all([
        apiGet<MyBook[]>(`/api/my/books${query}`, token),
        apiGet<ReadingSession[]>('/api/my/sessions', token)
      ])
      setBooks(booksData)
      const nextStats: Record<number, { minutes: number; pages: number }> = {}
      for (const session of sessionsData) {
        const key = session.bookId
        if (!nextStats[key]) nextStats[key] = { minutes: 0, pages: 0 }
        nextStats[key].minutes += session.minutesRead || 0
        nextStats[key].pages += session.pagesRead || 0
      }
      setSessionStatsByBookId(nextStats)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter, token])

  useEffect(() => {
    load()
  }, [load])

  const updateBook = async (book: MyBook, patch: Record<string, unknown>, message: string) => {
    if (!token) return
    setBusyBookId(book.id)
    setError(null)
    setSuccess(null)
    try {
      await apiPatch(`/api/my/books/${book.id}`, patch, token)
      await load()
      setSuccess(message)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyBookId(null)
    }
  }

  const removeBook = async (book: MyBook) => {
    if (!token) return
    const ok = window.confirm(`Remove "${book.title}" from your library?`)
    if (!ok) return
    setBusyBookId(book.id)
    setError(null)
    setSuccess(null)
    try {
      await apiDelete(`/api/my/books/${book.id}`, token)
      await load()
      setSuccess('Book removed from your library.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyBookId(null)
    }
  }

  if (!token) {
    return (
      <div className="page dashboard">
        <div className="dashboard-section">
          <h2>My Library</h2>
          <p className="muted-text">Login to manage your personal reading library.</p>
          <div className="loan-actions">
            <Link className="ghost" to="/login">Login</Link>
            <Link className="ghost" to="/register">Create account</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page dashboard">
      <section className="dashboard-header">
        <div>
          <h1>My Library</h1>
          <p>Track status, minutes read, pages read, and rating for each saved book.</p>
        </div>
        <div className="loan-actions">
          <Link to="/books" className="ghost">Browse books</Link>
          <Link to="/smart-search" className="ghost">SmartSearch</Link>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="library-filter">
          {(['ALL', ...statusOptions] as StatusFilter[]).map((value) => (
            <button
              key={value}
              className={filter === value ? '' : 'ghost'}
              onClick={() => setFilter(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="alert">{error}</div>}
      {success && <div className="ok-banner">{success}</div>}
      {loading && <div className="loading">Loading...</div>}

      <section className="library-grid">
        {books.map((book) => (
          <article key={book.id} className="card book-card">
            <div className="book-cover">
              {book.imageUrl ? <img src={book.imageUrl} alt={book.title} /> : <div className="cover-fallback">No Cover</div>}
            </div>
            <div className="book-info">
              <div className="card-title">{book.title}</div>
              <div className="card-meta">{book.author || 'Unknown author'}</div>
              <div className="library-fields">
                <label>
                  Status
                  <select
                    value={book.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as ReadingStatus
                      updateBook(book, { status: nextStatus }, 'Status updated.')
                    }}
                    disabled={busyBookId === book.id}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Minutes read
                  <input
                    type="number"
                    value={sessionStatsByBookId[book.bookId]?.minutes ?? 0}
                    readOnly
                  />
                </label>
                <label>
                  Pages read
                  <input
                    type="number"
                    value={sessionStatsByBookId[book.bookId]?.pages ?? 0}
                    readOnly
                  />
                </label>
                <label>
                  Rating (1-5)
                  <select
                    value={book.rating ?? 0}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      updateBook(book, { rating: value === 0 ? null : value }, 'Rating updated.')
                    }}
                    disabled={busyBookId === book.id}
                  >
                    <option value={0}>No rating</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </label>
              </div>
              <div className="library-card-actions">
                <Link to={`/books/${book.bookId}`} className="ghost">Details</Link>
                <button
                  className="ghost"
                  onClick={() => removeBook(book)}
                  disabled={busyBookId === book.id}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
        {!loading && books.length === 0 && (
          <div className="card empty">No books in this list yet.</div>
        )}
      </section>
    </div>
  )
}
