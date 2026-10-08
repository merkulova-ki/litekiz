const base = '/api'

async function request(path, options = {}) {
  const response = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status}: ${text}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  health: () => request('/health'),

  summary: (accountId) =>
    request(`/dashboard/summary${accountId ? `?account_id=${accountId}` : ''}`),

  accounts: () => request('/accounts'),

  credentials: (accountId) => request(`/credentials?account_id=${accountId}`),
  createCredential: (payload) =>
    request('/credentials', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCredential: (id) => request(`/credentials/${id}`, { method: 'DELETE' }),
  checkCredential: (id) => request(`/credentials/${id}/check`, { method: 'POST' }),

  products: (accountId, search = '') =>
    request(`/catalog/products?account_id=${accountId}&search=${encodeURIComponent(search)}`),
  unmatched: (accountId) => request(`/catalog/unmatched?account_id=${accountId}`),
  autoMatch: (accountId) => request(`/catalog/auto-match?account_id=${accountId}`, { method: 'POST' }),
  matchItem: (itemId, productId) =>
    request('/catalog/match', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, product_id: productId }),
    }),
  createProductFromItem: (itemId) =>
    request(`/catalog/items/${itemId}/create-product`, { method: 'POST' }),

  discrepancies: (accountId, filters = {}) => {
    const params = new URLSearchParams({ account_id: accountId })
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    return request(`/reconciliation/discrepancies?${params}`)
  },
  runReconciliation: (accountId) =>
    request(`/reconciliation/run?account_id=${accountId}`, { method: 'POST' }),
  updateDiscrepancy: (id, status) =>
    request(`/reconciliation/discrepancies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  seedDemo: (count = 18) => request(`/demo/seed?products_count=${count}`, { method: 'POST' }),
  resetDemo: () => request('/demo/reset', { method: 'POST' }),
}

export function money(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function dateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

export function dateOnly(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}
