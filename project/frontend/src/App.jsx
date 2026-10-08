import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { api } from './api.js'
import { AccountContext } from './AccountContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Discrepancies from './pages/Discrepancies.jsx'
import Products from './pages/Products.jsx'
import Credentials from './pages/Credentials.jsx'
import { Button, IconBox, IconDashboard, IconKey, IconList, LogoMark, Wordmark } from './ui/index.jsx'

export default function App() {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await api.summary()
      setAccount(data.account)
      setError('')
    } catch (e) {
      setError('Бэкенд недоступен. Запустите uvicorn на порту 8000.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function seed() {
    setLoading(true)
    await api.seedDemo(18)
    await load()
  }

  if (loading) {
    return (
      <div className="screen">
        <LogoMark size={72} className="logo" />
        <p>Загрузка…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen">
        <LogoMark size={72} className="logo" />
        <h1 className="lk-h1">Нет связи с сервером</h1>
        <p>{error}</p>
        <Button variant="secondary" onClick={load}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="screen">
        <LogoMark size={72} className="logo" />
        <h1 className="lk-h1">База пуста</h1>
        <p>
          Наполните её демонстрационными данными: карточки площадок, остатки и коды маркировки —
          и кабинет сразу покажет, как выглядит сверка.
        </p>
        <Button variant="primary" onClick={seed}>
          Загрузить демо-данные
        </Button>
      </div>
    )
  }

  return (
    <AccountContext.Provider value={{ account, reload: load }}>
      <div className="layout">
        <aside className="sidebar">
          <NavLink to="/dashboard" className="brand">
            <LogoMark size={36} className="brand-logo" />
            <div>
              <Wordmark height={16} className="brand-word" />
              <div className="brand-sub">сверка маркировки</div>
            </div>
          </NavLink>

          <nav className="nav" aria-label="Разделы">
            <NavLink to="/dashboard" className="lk-navitem">
              <IconDashboard /> Сводка
            </NavLink>
            <NavLink to="/discrepancies" className="lk-navitem">
              <IconList /> Расхождения
            </NavLink>
            <NavLink to="/products" className="lk-navitem">
              <IconBox /> Товары
            </NavLink>
            <NavLink to="/credentials" className="lk-navitem">
              <IconKey /> Кабинеты и ключи
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <div className="account-card">
              <span className="lk-overline">Кабинет</span>
              <div className="name">{account.name}</div>
              <div className="inn">ИНН {account.inn}</div>
            </div>
          </div>
        </aside>

        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discrepancies" element={<Discrepancies />} />
            <Route path="/products" element={<Products />} />
            <Route path="/credentials" element={<Credentials />} />
          </Routes>
        </main>
      </div>
    </AccountContext.Provider>
  )
}
