const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

async function request(path, { method='GET', body, token } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (token) headers['authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const text = await res.text()
  let data = null; try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) { const err = new Error(data?.error || res.statusText); err.status = res.status; err.data = data; throw err }
  return data
}

export const api = {
  health: () => request('/api/health'),
  register: (email, password) => request('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/api/auth/me', { token }),

  listBooks: () => request('/api/books'),
  createBook: (token, book) => request('/api/books', { method: 'POST', body: book, token }),
  deleteBook: (token, id) => request(`/api/books/${id}`, { method: 'DELETE', token }),
}
