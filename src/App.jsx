import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api'

function useToken() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  useEffect(() => { token ? localStorage.setItem('token', token) : localStorage.removeItem('token') }, [token])
  return [token, setToken]
}

function Section({ title, right, children }) {
  return (<div className="card"><div className="toolbar"><h2>{title}</h2><div>{right}</div></div>{children}</div>)
}

export default function App() {
  const [token, setToken] = useToken()
  const [me, setMe] = useState(null)
  const [health, setHealth] = useState(null)
  const [reg, setReg] = useState({ email: '', password: '' })
  const [login, setLogin] = useState({ email: '', password: '' })
  const [book, setBook] = useState({ title: '', author: '', year: '', tags: '' })
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

  async function refresh() {
    setLoading(true); setMsg('')
    try {
      const [h, list] = await Promise.all([api.health(), api.listBooks()])
      setHealth(h)
      setBooks(list.items || [])
      if (token) {
        try { const m = await api.me(token); setMe(m.user) } catch { setMe(null) }
      } else setMe(null)
    } catch (e) { setMsg(`Error: ${e.message}`) } finally { setLoading(false) }
  }
  useEffect(() => { refresh() }, [token])

  async function doRegister(e) {
    e.preventDefault(); setLoading(true); setMsg('')
    try { const { token: t } = await api.register(reg.email, reg.password); setToken(t); setReg({ email:'', password:'' }); setMsg('Registered ✔') }
    catch (e) { setMsg(e.data?.errors ? e.data.errors.map(x=>x.msg).join(', ') : e.message) }
    finally { setLoading(false) }
  }
  async function doLogin(e) {
    e.preventDefault(); setLoading(true); setMsg('')
    try { const { token: t } = await api.login(login.email, login.password); setToken(t); setLogin({ email:'', password:'' }); setMsg('Logged in ✔') }
    catch (e) { setMsg(e.message) }
    finally { setLoading(false) }
  }
  function doLogout() { setToken(''); setMe(null); setMsg('Logged out') }

  async function createBook(e) {
    e.preventDefault(); setLoading(true); setMsg('')
    try {
      const payload = { title: book.title, author: book.author || undefined, year: book.year ? Number(book.year) : undefined, tags: book.tags ? book.tags.split(',').map(s=>s.trim()).filter(Boolean) : [] }
      await api.createBook(token, payload); setBook({ title:'', author:'', year:'', tags:'' }); setMsg('Book created ✔'); await refresh()
    } catch (e) { setMsg(e.message) } finally { setLoading(false) }
  }
  async function removeBook(id) {
    if (!confirm('Delete this book?')) return
    setLoading(true); setMsg('')
    try { await api.deleteBook(token, id); setMsg('Deleted ✔'); await refresh() } catch (e) { setMsg(e.message) } finally { setLoading(false) }
  }
  const tokenShort = useMemo(() => token ? token.slice(0, 12) + '…' : '', [token])

  return (
    <div className="app">
      <h1>Books App <small className="muted">React client</small></h1>
      <div className="card">
        <div className="toolbar">
          <div><small className="muted">API base:</small> <span className="kbd">{apiBase}</span></div>
          <div><small className="muted">Health:</small> {health ? 'OK' : '—'}</div>
        </div>
        <div className="note">Set <span className="kbd">VITE_API_BASE</span> in <span className="kbd">.env</span></div>
      </div>

      <Section title="Auth" right={<small className="muted">{me ? `Signed in as ${me.email}` : 'Not signed in'}</small>}>
        <div className="row">
          <form onSubmit={doRegister}>
            <label>Email</label>
            <input value={reg.email} onChange={e=>setReg(v=>({...v, email:e.target.value}))} required />
            <label>Password (min 8 chars)</label>
            <input type="password" value={reg.password} onChange={e=>setReg(v=>({...v, password:e.target.value}))} required />
            <div style={{marginTop:8, display:'flex', gap:8}}>
              <button disabled={loading}>Register</button>
            </div>
          </form>

          <form onSubmit={doLogin}>
            <label>Email</label>
            <input value={login.email} onChange={e=>setLogin(v=>({...v, email:e.target.value}))} required />
            <label>Password</label>
            <input type="password" value={login.password} onChange={e=>setLogin(v=>({...v, password:e.target.value}))} required />
            <div style={{marginTop:8, display:'flex', gap:8}}>
              <button className="ok" disabled={loading}>Login</button>
              <button type="button" className="ghost" onClick={doLogout}>Logout</button>
              {token && <small className="muted">Token: <span className="kbd">{tokenShort}</span></small>}
            </div>
          </form>
        </div>
      </Section>

      <Section title="Create Book">
        <form onSubmit={createBook}>
          <div className="row">
            <div><label>Title</label><input value={book.title} onChange={e=>setBook(v=>({...v, title:e.target.value}))} required /></div>
            <div><label>Author</label><input value={book.author} onChange={e=>setBook(v=>({...v, author:e.target.value}))} /></div>
            <div><label>Year</label><input value={book.year} onChange={e=>setBook(v=>({...v, year:e.target.value}))} /></div>
            <div><label>Tags (comma separated)</label><input value={book.tags} onChange={e=>setBook(v=>({...v, tags:e.target.value}))} /></div>
          </div>
          <div style={{marginTop:12}}>
            <button disabled={loading || !token}>Create (requires login)</button>
            {!token && <small className="muted" style={{marginLeft:8}}>Login to enable writes</small>}
          </div>
        </form>
      </Section>

      <Section title="Books" right={<button className="ghost" onClick={refresh} disabled={loading}>Refresh</button>}>
        <div className="list">
          {books.length === 0 && <small className="muted">No books yet.</small>}
          {books.map(b => (
            <div className="item" key={b._id || b.id}>
              <div>
                <div className="item-title">{b.title}</div>
                <small className="muted">by {b.author || 'Unknown'} • {b.year || '—'}</small>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="danger" onClick={() => removeBook(b._id || b.id)} disabled={!token || loading}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {msg && <div className="card"><small className="muted">{msg}</small></div>}
    </div>
  )
}
