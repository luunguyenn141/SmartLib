import { useState } from 'react'
import { apiPost } from '../lib/api'

type SearchResult = {
  id: number
  title: string
  author: string
  description: string
  score: number
  google_books_id?: string
  image_url?: string
  published_date?: string
}

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiPost<SearchResult[]>('/api/search', { query, top_k: 6 })
      setResults(data || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page hero">
      <section className="hero-card">
        <div className="hero-copy">
          <h1>Find the next book you actually want to read.</h1>
          <p>
            Search by meaning, not exact keywords. Try: “cậu bé phù thủy có vết sẹo”.
          </p>
          <div className="search-bar">
            <input
              placeholder="Nhập mô tả hoặc từ khóa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={runSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="alert">{error}</div>}
        </div>
        <div className="hero-panel">
          <div className="stat">
            <div className="stat-value">3,296+</div>
            <div className="stat-label">books indexed</div>
          </div>
          <div className="stat">
            <div className="stat-value">~15ms</div>
            <div className="stat-label">avg search</div>
          </div>
          <div className="stat">
            <div className="stat-value">AI</div>
            <div className="stat-label">semantic engine</div>
          </div>
        </div>
      </section>

      <section className="results">
        <h2>Semantic Results</h2>
        <div className="grid">
          {results.map((r) => (
            <div key={r.id} className="card">
              <div className="card-title">{r.title}</div>
              <div className="card-meta">{r.author || 'Unknown'} · {r.published_date || 'N/A'}</div>
              <div className="card-desc">{r.description || 'No description available.'}</div>
              <div className="card-score">Score: {r.score.toFixed(3)}</div>
            </div>
          ))}
          {!results.length && (
            <div className="card empty">
              Chưa có kết quả. Hãy thử tìm kiếm bằng mô tả nội dung.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
