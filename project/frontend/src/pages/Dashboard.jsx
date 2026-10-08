import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money, dateTime, dateOnly } from '../api.js'
import { useAccount } from '../AccountContext.jsx'
import {
  Button,
  Card,
  ClassChip,
  EmptyState,
  Expiry,
  IconKey,
  IconRefresh,
  PageHeader,
  StatTile,
  Table,
  classMeta,
} from '../ui/index.jsx'

export default function Dashboard() {
  const { account } = useAccount()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setData(await api.summary(account.id))
  }

  useEffect(() => {
    load()
  }, [account.id])

  async function runReconciliation() {
    setBusy(true)
    try {
      await api.runReconciliation(account.id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!data) return <div className="screen">Загрузка…</div>

  const maxAmount = Math.max(...data.by_type.map((t) => t.amount), 1)
  const totalAmount = data.by_type.reduce((s, t) => s + t.amount, 0)
  const totalQty = data.by_type.reduce((s, t) => s + t.qty, 0)

  return (
    <>
      <PageHeader
        title="Сводка"
        sub={data.as_of ? `Срез данных ${dateTime(data.as_of)} · цифры приблизительные` : 'Сверка ещё не запускалась'}
        actions={
          <Button variant="primary" icon={<IconRefresh />} onClick={runReconciliation} disabled={busy}>
            {busy ? 'Сверяю…' : 'Запустить сверку'}
          </Button>
        }
      />

      <div className="stack">
        <section className="tiles">
          <StatTile
            label="Сумма под риском"
            value={money(data.amount_at_risk)}
            hint={`около ${totalQty} кодов в ${data.by_type.filter((t) => t.count > 0).length} классах`}
            hero
          >
            {totalAmount > 0 && (
              <div className="hero-side">
                <div className="distribution" aria-hidden>
                  {data.by_type
                    .filter((t) => t.amount > 0)
                    .map((t) => (
                      <i key={t.type} style={{ flex: t.amount, background: `var(${classMeta(t.type).marker})` }} />
                    ))}
                </div>
                <div className="legend">
                  {data.by_type
                    .filter((t) => t.amount > 0)
                    .map((t) => (
                      <span key={t.type}>
                        <i className="dot" style={{ background: `var(${classMeta(t.type).marker})` }} />
                        {classMeta(t.type).label}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </StatTile>
          <StatTile label="Открытых расхождений" value={data.discrepancies_open} />
          <StatTile label="Кодов в обороте" value={data.codes_introduced} />
          <StatTile label="Остаток на складах" value={`${data.stock_total} шт`} />
          <StatTile label="Товаров в справочнике" value={data.products_total} />
          <StatTile
            label="Карточек без пары"
            value={data.items_unmatched}
            hint={data.items_unmatched > 0 ? 'Нужно досопоставить вручную' : 'Все сшиты'}
            attention={data.items_unmatched > 0}
          />
        </section>

        <Card title="Расхождения по классам" hint="Открытые расхождения: новые и в работе. Клик по классу открывает список.">
          <div className="bars">
            {data.by_type.map((row) => (
              <div key={row.type} className="bar-row">
                <div>
                  <Link to={`/discrepancies?type=${row.type}`} style={{ textDecoration: 'none' }}>
                    <ClassChip type={row.type} />
                  </Link>
                  <div className="meta">
                    {row.count} позиций · около {row.qty} шт
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(row.amount / maxAmount) * 100}%`,
                      background: `var(${classMeta(row.type).marker})`,
                    }}
                  />
                </div>
                <div className="bar-value lk-num-table">{money(row.amount)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          flush
          title="Ключи доступа"
          hint="Сроки разные: токен Wildberries — 180 дней, ключ Ozon — 3 месяца, токен ГИС МТ — около 10 часов. Просроченный ключ роняет интеграцию молча, с кодом 401."
          actions={
            <Link to="/credentials">
              <Button variant="secondary" size="s" icon={<IconKey />}>
                Управлять ключами
              </Button>
            </Link>
          }
        >
          <Table
            columns={[
              { key: 'label', title: 'Ключ' },
              { key: 'expires', title: 'Истекает' },
              { key: 'left', title: 'Осталось' },
              { key: 'check', title: 'Последняя проверка' },
            ]}
            empty={
              data.credentials_expiring.length === 0 && (
                <EmptyState
                  icon={<IconKey />}
                  title="Ключи не добавлены"
                  text="Без ключей сверка работает на демо-данных. Добавьте ключи площадок и ГИС МТ, чтобы сверять реальные остатки."
                />
              )
            }
          >
            {data.credentials_expiring.map((cred) => (
              <tr key={cred.id}>
                <td>
                  {cred.label}
                  <div className="cell-sub">{cred.hint}</div>
                </td>
                <td className="nowrap">{dateOnly(cred.expires_at)}</td>
                <td>
                  <Expiry daysLeft={cred.days_left} totalDays={cred.kind === 'ozon' ? 90 : cred.kind === 'gismt' ? 1 : 180} />
                </td>
                <td className="text-2 lk-body-s">{cred.last_check_message || '—'}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  )
}
