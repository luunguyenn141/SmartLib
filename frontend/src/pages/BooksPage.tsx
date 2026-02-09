import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../lib/api'

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

type Page<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export default function BooksPage() {
  const [q, setQ] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<Page<Book> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (availableOnly) params.set('available', 'true')
    params.set('page', String(page))
    params.set('size', '12')
    return params.toString()
  }, [q, availableOnly, page])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError(null)
    apiGet<Page<Book>>(`/api/books?${query}`)
      .then((res) => {
        if (!ignore) setData(res)
      })
      .catch((e) => {
        if (!ignore) setError((e as Error).message)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [query])

  return (
    <div className="page">
      <section className="toolbar">
        <div className="field">
          <label>Keyword</label>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="title, author, isbn..." />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => { setAvailableOnly(e.target.checked); setPage(0) }}
          />
          Only available
        </label>
        <div className="meta">
          {data && <span>{data.totalElements} results</span>}
        </div>
      </section>

      {error && <div className="alert">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="grid">
        {data?.content.map((b) => (
          <div key={b.id} className="card">
            <div className="card-title">{b.title}</div>
            <div className="card-meta">{b.author || 'Unknown'}</div>
            <div className="card-desc">{b.description || 'No description available.'}</div>
            <div className="card-meta">
              ISBN: {b.isbn || 'N/A'} · Available: {b.availableCopies ?? 0}/{b.totalCopies ?? 0}
            </div>
          </div>
        ))}
        {!loading && data && data.content.length === 0 && (
          <div className="card empty">Không có sách phù hợp.</div>
        )}
      </div>

      {data && (
        <div className="pager">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Prev
          </button>
          <span>Page {data.number + 1} / {data.totalPages || 1}</span>
          <button onClick={() => setPage((p) => (data.totalPages ? Math.min(data.totalPages - 1, p + 1) : p + 1))} disabled={data.totalPages !== 0 && page >= data.totalPages - 1}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}
