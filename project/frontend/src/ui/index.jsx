import {
  IconBoxDashed,
  IconClock,
  IconCodeCrossed,
  IconReturn,
  ShapeCheck,
  ShapeHalf,
  ShapeIgnored,
  ShapeRing,
} from './icons.jsx'

export * from './icons.jsx'
export { LogoMark, Wordmark } from './Logo.jsx'

export function Button({ variant = 'secondary', size = 'm', icon, children, className = '', ...rest }) {
  const cls = ['lk-btn', `lk-btn--${variant}`, size !== 'm' ? `lk-btn--${size}` : '', className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ size = 'm', outlined, children, className = '', ...rest }) {
  const cls = ['lk-iconbtn', size === 's' ? 'lk-iconbtn--s' : '', outlined ? 'lk-iconbtn--outlined' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

export function Card({ title, hint, actions, flush, children, className = '' }) {
  return (
    <section className={`card ${flush ? 'flush' : ''} ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h2 className="lk-h3">{title}</h2>}
            {hint && <p className="hint">{hint}</p>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, sub, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="lk-h1">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  )
}

export function StatTile({ label, value, hint, hero, attention, children }) {
  return (
    <div className={`tile lk-summary ${hero ? 'hero' : ''} ${attention ? 'attention' : ''}`}>
      <div className="label">{label}</div>
      <div className={`value ${hero ? 'lk-num-xl' : 'lk-num-l'}`}>{value}</div>
      {hint && <div className="hint">{hint}</div>}
      {children}
    </div>
  )
}

export function Table({ columns, children, empty }) {
  return (
    <div className="table-wrap">
      <table className="lk-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.num ? 'num' : ''} style={c.width ? { width: c.width } : undefined}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  )
}

export const DISCREPANCY_CLASSES = {
  CODE_WITHOUT_STOCK: { tone: 'codes', label: 'Коды без товара', Icon: IconCodeCrossed, marker: '--lk-cls-codes-marker' },
  STOCK_WITHOUT_CODE: { tone: 'goods', label: 'Товар без кодов', Icon: IconBoxDashed, marker: '--lk-cls-goods-marker' },
  FROZEN_CODES: { tone: 'stuck', label: 'Зависшие коды', Icon: IconClock, marker: '--lk-cls-stuck-marker' },
  RETURN_NOT_REINTRODUCED: { tone: 'returns', label: 'Невозвращённые возвраты', Icon: IconReturn, marker: '--lk-cls-returns-marker' },
}

export function classMeta(type) {
  return DISCREPANCY_CLASSES[type] || { tone: 'returns', label: type, Icon: IconReturn, marker: '--lk-cls-returns-marker' }
}

export function ClassChip({ type, label }) {
  const meta = classMeta(type)
  const Icon = meta.Icon
  return (
    <span className={`class-chip ${meta.tone}`}>
      <i className="dot" />
      <Icon />
      {label || meta.label}
    </span>
  )
}

export const STATUSES = [
  { value: 'new', label: 'Новое', Shape: ShapeRing },
  { value: 'in_progress', label: 'В работе', Shape: ShapeHalf },
  { value: 'resolved', label: 'Решено', Shape: ShapeCheck },
  { value: 'ignored', label: 'Не важно', Shape: ShapeIgnored },
]

export function StatusBadge({ value }) {
  const meta = STATUSES.find((s) => s.value === value) || STATUSES[0]
  const Shape = meta.Shape
  return (
    <span className={`status ${meta.value}`}>
      <Shape fill={meta.value === 'resolved' ? 'var(--lk-st-done)' : undefined} />
      {meta.label}
    </span>
  )
}

export function StatusSelect({ value, onChange }) {
  return (
    <span className="status-select">
      <StatusBadge value={value} />
      <Select compact value={value} onChange={(e) => onChange(e.target.value)} aria-label="Сменить статус">
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </span>
  )
}

export function Field({ label, help, children }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {help && <span className="help">{help}</span>}
    </label>
  )
}

export function Input({ className = '', mono, error, icon, ...rest }) {
  const cls = ['lk-input', mono ? 'lk-input--mono' : '', error ? 'lk-input--error' : '', className].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      {icon}
      <input {...rest} />
    </span>
  )
}

const Caret = () => (
  <svg className="caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 6l4 4 4-4" />
  </svg>
)

export function Select({ className = '', compact, children, ...rest }) {
  return (
    <span className={`lk-input ${className}`} style={compact ? { height: 'var(--ctl-h-s)', padding: '0 8px', borderRadius: 'var(--radius-s)' } : undefined}>
      <select {...rest}>{children}</select>
      <Caret />
    </span>
  )
}

export function Segmented({ items, value, onChange }) {
  return (
    <div className="lk-seg" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          className="lk-seg__item"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count !== undefined && <span className="lk-chip__count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty">
      {icon}
      <div className="title">{title}</div>
      {text && <div className="text">{text}</div>}
      {action}
    </div>
  )
}

const PLATFORM_LABELS = { wb: 'Wildberries', ozon: 'Ozon', gismt: 'ГИС МТ' }
export function PlatformChip({ platform }) {
  return <span className={`tag ${platform}`}>{PLATFORM_LABELS[platform] || platform}</span>
}

export function Expiry({ daysLeft, totalDays = 180 }) {
  if (daysLeft === null || daysLeft === undefined) return <span className="text-3">бессрочно</span>
  const ratio = Math.max(0, Math.min(1, daysLeft / totalDays))
  const tone = daysLeft <= 3 ? 'danger' : daysLeft <= 14 ? 'warn' : ''
  return (
    <span className={`expiry ${tone}`}>
      <span className="expiry-track">
        <span className="expiry-fill" style={{ width: `${ratio * 100}%` }} />
      </span>
      {daysLeft <= 0 ? 'истёк' : `${daysLeft} дн.`}
    </span>
  )
}
