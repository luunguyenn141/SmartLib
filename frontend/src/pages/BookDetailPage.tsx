import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import { useAuth } from '../lib/auth'

type Book = {
  id: number
  title: string
  author: string
  isbn?: string
  description?: string
  imageUrl?: string
  totalCopies?: number
  availableCopies?: number
}

export default function BookDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    apiGet<Book>(`/api/books/${id}`)
      .then(setBook)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  const addToMyLibrary = async () => {
    if (!book || !token) {
      setError('Please login to save this book to your library.')
      return
    }
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await apiPost('/api/my/books', { bookId: book.id, status: 'TO_READ' }, token)
      setNotice('Book added to My Library.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !book) {
    return <div className="page">Loading...</div>
  }

  if (!book) {
    return <div className="page">Book not found.</div>
  }

  return (
    <div className="page detail">
      <Link to="/books" className="ghost">Back to list</Link>
      <div className="detail-card">
        <div className="cover">
          {book.imageUrl ? (
            <img src={book.imageUrl} alt={book.title} />
          ) : (
            <div className="cover-fallback">No Cover</div>
          )}
        </div>
        <div className="detail-body">
          <h2>{book.title}</h2>
          <div className="detail-meta">{book.author || 'Unknown author'}</div>
          <div className="detail-meta">ISBN: {book.isbn || 'N/A'}</div>
          <div className="detail-meta">
            Available: {book.availableCopies ?? 0}/{book.totalCopies ?? 0}
          </div>
          <p>{book.description || 'No description available.'}</p>

          {!token && <div className="alert">Login to save this book.</div>}
          {error && <div className="alert">{error}</div>}
          {notice && <div className="ok-banner">{notice}</div>}

          {token && (
            <div className="actions">
              <button onClick={addToMyLibrary} disabled={loading}>
                Add to My Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
