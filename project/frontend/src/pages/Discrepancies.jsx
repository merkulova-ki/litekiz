import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, money, dateTime } from '../api.js'
import { useAccount } from '../AccountContext.jsx'
import {
  Card,
  ClassChip,
  DISCREPANCY_CLASSES,
  EmptyState,
  IconList,
  PageHeader,
  STATUSES,
  Select,
  StatusSelect,
  Table,
} from '../ui/index.jsx'

const TYPE_OPTIONS = [
  { value: '', label: 'Все классы' },
  ...Object.entries(DISCREPANCY_CLASSES).map(([value, meta]) => ({ value, label: meta.label })),
]

export default function Discrepancies() {
  const { account } = useAccount()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('')
  const type = params.get('type') || ''

  async function load() {
    setRows(await api.discrepancies(account.id, { type, status }))
  }

  useEffect(() => {
    load()
  }, [account.id, type, status])

  async function changeStatus(id, next) {
    await api.updateDiscrepancy(id, next)
    await load()
  }

  const list = rows || []
  const total = list.reduce((sum, row) => sum + row.amount, 0)
  const filtered = Boolean(type || status)

  return (
    <>
      <PageHeader
        title="Расхождения"
        sub={rows ? `${list.length} позиций на ${money(total)} · оценка приблизительная` : 'Загрузка…'}
      />

      <div className="toolbar">
        <Select
          value={type}
          onChange={(e) => setParams(e.target.value ? { type: e.target.value } : {})}
          aria-label="Класс расхождения"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
          <option value="">Любой статус</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <Card flush>
        <Table
          columns={[
            { key: 'product', title: 'Товар' },
            { key: 'type', title: 'Класс расхождения' },
            { key: 'qty', title: 'Штук', num: true },
            { key: 'amount', title: 'Оценка', num: true },
            { key: 'detected', title: 'Обнаружено' },
            { key: 'status', title: 'Статус' },
          ]}
          empty={
            rows &&
            list.length === 0 && (
              <EmptyState
                icon={<IconList />}
                title={filtered ? 'Под этот фильтр ничего не попало' : 'Расхождений нет'}
                text={
                  filtered
                    ? 'Снимите фильтры или выберите другой класс.'
                    : 'Сверка ещё не находила расхождений. Запустите её на странице «Сводка».'
                }
              />
            )
          }
        >
          {list.map((row) => (
            <tr key={row.id}>
              <td className="min-w">
                {row.product_name}
                <div className="cell-sub mono">GTIN {row.gtin}</div>
              </td>
              <td>
                <ClassChip type={row.type} />
                {row.comment && <div className="cell-sub">{row.comment}</div>}
              </td>
              <td className="num">около {row.qty}</td>
              <td className="num">{money(row.amount)}</td>
              <td className="text-2 lk-body-s nowrap">{dateTime(row.detected_at)}</td>
              <td className="actions-cell">
                <StatusSelect value={row.status} onChange={(next) => changeStatus(row.id, next)} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}
