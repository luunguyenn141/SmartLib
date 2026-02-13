import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet, apiPatch, apiPost, apiPut } from '../lib/api'
import { useAuth } from '../lib/auth'

type User = {
  username: string
  email: string
}

type ReadingStatus = 'TO_READ' | 'READING' | 'FINISHED' | 'DROPPED'

type MyBook = {
  id: number
  bookId: number
  title: string
  author: string
  imageUrl?: string
  status: ReadingStatus
  rating?: number
  progressPercent: number
  startedAt?: string
  finishedAt?: string
}

type RecentSession = {
  id: number
  bookId: number
  bookTitle: string
  sessionDate: string
  minutesRead: number
  pagesRead: number
}

type ReadingSessionItem = {
  id: number
  bookId: number
  minutesRead: number
  pagesRead: number
}

type MonthlyCount = {
  month: string
  count: number
}

type Dashboard = {
  totalBooks: number
  toReadBooks: number
  readingBooks: number
  finishedBooks: number
  minutesReadThisMonth: number
  minutesReadToday: number
  booksPerMonthGoal: number
  minutesPerDayGoal: number
  monthlyFinished: MonthlyCount[]
  recentSessions: RecentSession[]
}

type SearchResult = {
  id: number
  title: string
  author: string
  description: string
  score?: number
  image_url?: string
  published_date?: string
}

const defaultDashboard: Dashboard = {
  totalBooks: 0,
  toReadBooks: 0,
  readingBooks: 0,
  finishedBooks: 0,
  minutesReadThisMonth: 0,
  minutesReadToday: 0,
  booksPerMonthGoal: 2,
  minutesPerDayGoal: 20,
  monthlyFinished: [],
  recentSessions: []
}

function normalizeDashboard(input?: Partial<Dashboard> | null): Dashboard {
  return {
    totalBooks: input?.totalBooks ?? 0,
    toReadBooks: input?.toReadBooks ?? 0,
    readingBooks: input?.readingBooks ?? 0,
    finishedBooks: input?.finishedBooks ?? 0,
    minutesReadThisMonth: input?.minutesReadThisMonth ?? 0,
    minutesReadToday: input?.minutesReadToday ?? 0,
    booksPerMonthGoal: input?.booksPerMonthGoal ?? 2,
    minutesPerDayGoal: input?.minutesPerDayGoal ?? 20,
    monthlyFinished: Array.isArray(input?.monthlyFinished) ? input!.monthlyFinished : [],
    recentSessions: Array.isArray(input?.recentSessions) ? input!.recentSessions : []
  }
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function normalizeText(value?: string | null): string {
  return (value ?? '').normalize('NFC')
}

export default function UserHomePage() {
  const { token } = useAuth()
  const [me, setMe] = useState<User | null>(null)
  const [myBooks, setMyBooks] = useState<MyBook[]>([])
  const [dashboard, setDashboard] = useState<Dashboard>(defaultDashboard)
  const [recommendations, setRecommendations] = useState<SearchResult[]>([])
  const [goalBooks, setGoalBooks] = useState(2)
  const [goalMinutes, setGoalMinutes] = useState(20)
  const [loading, setLoading] = useState(false)
  const [savingBookId, setSavingBookId] = useState<number | null>(null)
  const [sessionBusyBookId, setSessionBusyBookId] = useState<number | null>(null)
  const [activeSessionMyBookId, setActiveSessionMyBookId] = useState<number | null>(null)
  const [activeSessionBookId, setActiveSessionBookId] = useState<number | null>(null)
  const [lastPageByBook, setLastPageByBook] = useState<Record<number, number>>({})
  const [totalMinutesByBook, setTotalMinutesByBook] = useState<Record<number, number>>({})
  const [stopModalOpen, setStopModalOpen] = useState(false)
  const [stopCurrentPage, setStopCurrentPage] = useState('')
  const [pendingStop, setPendingStop] = useState<{ myBookId: number; bookId: number } | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const [savingGoals, setSavingGoals] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPersonalData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [user, books, dash, sessions] = await Promise.all([
        apiGet<User>('/api/users/me', token),
        apiGet<MyBook[]>('/api/my/books', token),
        apiGet<Dashboard>('/api/my/dashboard', token),
        apiGet<ReadingSessionItem[]>('/api/my/sessions', token)
      ])
      setMe(user)
      setMyBooks(books)
      const normalized = normalizeDashboard(dash)
      setDashboard(normalized)
      setGoalBooks(normalized.booksPerMonthGoal)
      setGoalMinutes(normalized.minutesPerDayGoal)
      const pageMap: Record<number, number> = {}
      const minutesMap: Record<number, number> = {}
      for (const s of sessions) {
        const key = s.bookId
        if (!key) continue
        pageMap[key] = (pageMap[key] || 0) + (s.pagesRead || 0)
        minutesMap[key] = (minutesMap[key] || 0) + (s.minutesRead || 0)
      }
      setLastPageByBook(pageMap)
      setTotalMinutesByBook(minutesMap)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadPersonalData()
  }, [loadPersonalData])

  useEffect(() => {
    if (activeSessionMyBookId === null) return
    const timerId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [activeSessionMyBookId])

  const grouped = useMemo(() => {
    const toRead = myBooks.filter((b) => b.status === 'TO_READ')
    const reading = myBooks.filter((b) => b.status === 'READING')
    const finished = myBooks.filter((b) => b.status === 'FINISHED')
    return { toRead, reading, finished }
  }, [myBooks])

  const recommendationSeed = useMemo(() => {
    const finishedTop = grouped.finished.find((b) => (b.rating || 0) >= 4)
    if (finishedTop) return `${finishedTop.title} ${finishedTop.author}`
    if (grouped.reading.length > 0) return `${grouped.reading[0].title} ${grouped.reading[0].author}`
    if (grouped.toRead.length > 0) return `${grouped.toRead[0].title} ${grouped.toRead[0].author}`
    return 'sach hay ve ky nang va tu duy'
  }, [grouped])

  useEffect(() => {
    apiPost<SearchResult[]>('/api/search', { query: recommendationSeed, top_k: 6 })
      .then(setRecommendations)
      .catch(() => setRecommendations([]))
  }, [recommendationSeed])

  const updateMyBook = async (id: number, payload: Record<string, unknown>) => {
    if (!token) return
    setSavingBookId(id)
    setError(null)
    try {
      await apiPatch(`/api/my/books/${id}`, payload, token)
      await loadPersonalData()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSavingBookId(null)
    }
  }

  const startReadingSession = (myBookId: number, bookId: number) => {
    if (activeSessionMyBookId !== null && activeSessionMyBookId !== myBookId) {
      setError('Please stop the current active session before starting another one.')
      return
    }
    setError(null)
    setSessionMessage(null)
    setActiveSessionMyBookId(myBookId)
    setActiveSessionBookId(bookId)
    setElapsedSeconds(0)
  }

  const openStopSessionModal = (myBookId: number, bookId: number) => {
    const lastPage = lastPageByBook[bookId] ?? 0
    setPendingStop({ myBookId, bookId })
    setStopCurrentPage(String(lastPage))
    setStopModalOpen(true)
    setError(null)
    setSessionMessage(null)
  }

  const closeStopSessionModal = () => {
    setStopModalOpen(false)
    setPendingStop(null)
    setStopCurrentPage('')
  }

  const submitStopReadingSession = async () => {
    if (!token || !pendingStop || activeSessionMyBookId !== pendingStop.myBookId || activeSessionBookId === null) return
    const currentPage = Number(stopCurrentPage)
    if (!Number.isInteger(currentPage) || currentPage < 0) {
      setError('Current page must be a non-negative integer.')
      return
    }

    const previousPage = lastPageByBook[pendingStop.bookId] ?? 0
    if (currentPage < previousPage) {
      setError(`Current page cannot be less than previous page (${previousPage}).`)
      return
    }

    const pagesRead = currentPage - previousPage
    setSessionBusyBookId(pendingStop.myBookId)
    setError(null)
    setSessionMessage(null)
    try {
      const minutesRead = Math.max(1, Math.round(elapsedSeconds / 60))
      await apiPost('/api/my/sessions', {
        bookId: pendingStop.bookId,
        sessionDate: todayIso(),
        minutesRead,
        pagesRead,
        note: 'Tracked with reading timer'
      }, token)
      await apiPatch(`/api/my/books/${pendingStop.myBookId}`, { status: 'READING' }, token)
      await loadPersonalData()
      setLastPageByBook((prev) => ({ ...prev, [pendingStop.bookId]: currentPage }))
      setSessionMessage(`Session saved: ${minutesRead} minute(s), +${pagesRead} page(s).`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      closeStopSessionModal()
      setActiveSessionMyBookId(null)
      setActiveSessionBookId(null)
      setElapsedSeconds(0)
      setSessionBusyBookId(null)
    }
  }

  const finishBook = async (myBookId: number) => {
    if (activeSessionMyBookId === myBookId) {
      setError('Please stop the active session first and enter current page.')
      return
    }
    await updateMyBook(myBookId, { status: 'FINISHED' })
  }

  const dropBook = async (myBookId: number) => {
    if (activeSessionMyBookId === myBookId) {
      setError('Please stop the active session first and enter current page.')
      return
    }
    await updateMyBook(myBookId, { status: 'DROPPED' })
  }

  const saveGoals = async () => {
    if (!token) return
    setSavingGoals(true)
    setError(null)
    try {
      await apiPut('/api/my/goals', { booksPerMonth: goalBooks, minutesPerDay: goalMinutes }, token)
      await loadPersonalData()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSavingGoals(false)
    }
  }

  const maxChart = useMemo(() => {
    const values = (dashboard.monthlyFinished || []).map((x) => x.count || 0)
    return Math.max(1, ...values, 1)
  }, [dashboard.monthlyFinished])

  if (!token) {
    return (
      <div className="page dashboard">
        <div className="hero-card">
          <div className="hero-copy">
            <h1>Welcome to SmartLib</h1>
            <p>Login to track habits, keep personal library and get tailored recommendations.</p>
            <div className="actions">
              <Link className="ghost" to="/login">Login</Link>
              <Link className="ghost" to="/register">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page dashboard">
      <section className="dashboard-header">
        <div>
          <h1>{me?.username || 'Reader'} - Personal Reading Center</h1>
          <p>Keep track of your reading habits, goals, and progress.</p>
        </div>
        <div className="loan-actions">
          <Link to="/books" className="ghost">Find books</Link>
          <Link to="/smart-search" className="ghost">SmartSearch</Link>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}
      {sessionMessage && <div className="ok-banner">{sessionMessage}</div>}
      {loading && <div className="loading">Loading...</div>}

      <section className="dashboard-grid">
        <div className="stat">
          <div className="stat-value">{dashboard.totalBooks}</div>
          <div className="stat-label">my library</div>
        </div>
        <div className="stat">
          <div className="stat-value">{dashboard.readingBooks}</div>
          <div className="stat-label">reading now</div>
        </div>
        <div className="stat">
          <div className="stat-value">{dashboard.finishedBooks}</div>
          <div className="stat-label">finished</div>
        </div>
        <div className="stat">
          <div className="stat-value">{dashboard.minutesReadToday}/{dashboard.minutesPerDayGoal}</div>
          <div className="stat-label">minutes today</div>
        </div>
      </section>

      <section className="dashboard-section chart-section">
        <h2>Reading Output (last 6 months)</h2>
        <div className="read-chart">
          {(dashboard.monthlyFinished || []).map((point, idx) => (
            <div key={`${point.month || 'm'}-${idx}`} className="chart-col">
              <div className="chart-count">{point.count || 0}</div>
              <div className="chart-bar-wrap">
                <div className="chart-bar" style={{ height: `${((point.count || 0) / maxChart) * 100}%` }} />
              </div>
              <div className="chart-label">{(point.month || '').slice(5) || '--'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section goal-form">
        <h2>Reading Goals</h2>
        <div className="goal-row">
          <label>
            Books per month
            <input type="number" min={1} value={goalBooks} onChange={(e) => setGoalBooks(Number(e.target.value))} />
          </label>
          <label>
            Minutes per day
            <input type="number" min={1} value={goalMinutes} onChange={(e) => setGoalMinutes(Number(e.target.value))} />
          </label>
          <button onClick={saveGoals} disabled={savingGoals}>{savingGoals ? 'Saving...' : 'Save goals'}</button>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Currently Reading</h2>
        <div className="grid">
          {grouped.reading.map((item) => (
            <div key={item.id} className="card book-card">
              <div className="book-cover">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <div className="cover-fallback">No Cover</div>}
              </div>
              <div className="book-info">
                <div className="card-title">{normalizeText(item.title)}</div>
                <div className="card-meta">{normalizeText(item.author) || 'Unknown'}</div>
                <div className="card-meta">
                  Session timer: {activeSessionMyBookId === item.id ? formatDuration(elapsedSeconds) : '00:00:00'}
                </div>
                <div className="card-meta">Total minutes read: {totalMinutesByBook[item.bookId] ?? 0}</div>
                <div className="card-meta">Current page: {lastPageByBook[item.bookId] ?? 0}</div>
                <div className="loan-actions">
                  {activeSessionMyBookId === item.id ? (
                    <button
                      className="ghost"
                      onClick={() => openStopSessionModal(item.id, item.bookId)}
                      disabled={sessionBusyBookId === item.id}
                    >
                      Stop session
                    </button>
                  ) : (
                    <button
                      className="ghost"
                      onClick={() => startReadingSession(item.id, item.bookId)}
                      disabled={activeSessionMyBookId !== null}
                    >
                      Start timer
                    </button>
                  )}
                  <button
                    onClick={() => finishBook(item.id)}
                    disabled={savingBookId === item.id || sessionBusyBookId === item.id}
                  >
                    Finish
                  </button>
                  <button
                    className="ghost"
                    onClick={() => dropBook(item.id)}
                    disabled={savingBookId === item.id || sessionBusyBookId === item.id}
                  >
                    Drop
                  </button>
                </div>
              </div>
            </div>
          ))}
          {grouped.reading.length === 0 && <div className="card empty">No books in READING yet.</div>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>To Read Queue</h2>
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {grouped.toRead.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.author || 'Unknown'}</td>
                  <td><span className="status-pill borrowed">TO_READ</span></td>
                  <td>
                    <button onClick={() => updateMyBook(item.id, { status: 'READING' })} disabled={savingBookId === item.id}>Start reading</button>
                  </td>
                </tr>
              ))}
              {grouped.toRead.length === 0 && (
                <tr><td colSpan={4}>Queue is empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recent Sessions</h2>
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Date</th>
                <th>Minutes</th>
                <th>Pages</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.recentSessions || []).map((s, idx) => (
                <tr key={s.id ?? idx}>
                  <td>{s.bookTitle}</td>
                  <td>{s.sessionDate}</td>
                  <td>{s.minutesRead}</td>
                  <td>{s.pagesRead}</td>
                </tr>
              ))}
              {dashboard.recentSessions.length === 0 && (
                <tr><td colSpan={4}>No sessions logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recommendations For You</h2>
        <div className="grid">
          {recommendations.map((r) => (
            <div key={r.id} className="card book-card">
              <div className="book-cover">
                {r.image_url ? <img src={r.image_url} alt={r.title} /> : <div className="cover-fallback">No Cover</div>}
              </div>
              <div className="book-info">
                <div className="card-title">{normalizeText(r.title)}</div>
                <div className="card-meta">
                  {normalizeText(r.author) || 'Unknown'} | score {typeof r.score === 'number' ? r.score.toFixed(3) : 'N/A'}
                </div>
                <div className="card-desc">{r.description || 'No description available.'}</div>
                <div className="loan-actions">
                  <button onClick={() => apiPost('/api/my/books', { bookId: r.id, status: 'TO_READ' }, token).then(loadPersonalData).catch((e) => setError((e as Error).message))}>Add to queue</button>
                  <Link to={`/books/${r.id}`} className="ghost">Details</Link>
                </div>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && <div className="card empty">No recommendations yet.</div>}
        </div>
      </section>

      {stopModalOpen && pendingStop && (
        <div className="session-modal-backdrop">
          <div className="session-modal">
            <h3>Stop Reading Session</h3>
            <p>Enter your current page to save this session.</p>
            <label>
              Current page
              <input
                type="number"
                min={0}
                step={1}
                value={stopCurrentPage}
                onChange={(e) => setStopCurrentPage(e.target.value)}
              />
            </label>
            <div className="session-modal-actions">
              <button className="ghost" onClick={closeStopSessionModal}>Cancel</button>
              <button onClick={submitStopReadingSession}>Save session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
