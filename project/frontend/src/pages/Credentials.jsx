import { useEffect, useState } from 'react'
import { api, dateTime, dateOnly } from '../api.js'
import { useAccount } from '../AccountContext.jsx'
import {
  Button,
  Card,
  EmptyState,
  Expiry,
  Field,
  IconAlert,
  IconButton,
  IconCheck,
  IconKey,
  IconRefresh,
  IconTrash,
  Input,
  PageHeader,
  PlatformChip,
  Select,
  Table,
} from '../ui/index.jsx'

const KINDS = [
  { value: 'wb', label: 'Wildberries · токен продавца', hint: 'Личный кабинет → API-интеграции. Живёт 180 дней.', total: 180 },
  { value: 'ozon', label: 'Ozon · Seller API', hint: 'Настройки → Seller API. Новые ключи живут 3 месяца.', total: 90 },
  { value: 'gismt', label: 'ГИС МТ · «Честный ЗНАК»', hint: 'Токен True API живёт около 10 часов и обновляется фоном.', total: 1 },
]

const EMPTY_FORM = { kind: 'wb', label: '', secret: '', expires_at: '' }

export default function Credentials() {
  const { account } = useAccount()
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setRows(await api.credentials(account.id))
  }

  useEffect(() => {
    load()
  }, [account.id])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.createCredential({
        account_id: account.id,
        kind: form.kind,
        label: form.label,
        secret: form.secret,
        expires_at: form.expires_at || null,
      })
      setForm(EMPTY_FORM)
      await load()
    } catch (e) {
      setError(String(e.message))
    } finally {
      setSaving(false)
    }
  }

  const list = rows || []
  const kindMeta = KINDS.find((k) => k.value === form.kind)

  return (
    <>
      <PageHeader
        title="Кабинеты и ключи"
        sub="Ключи хранятся зашифрованными: в базе лежит только шифртекст, ключ шифрования — в окружении сервера."
      />

      <div className="stack">
        <Card flush title="Подключённые ключи" hint={rows ? `${list.length} ключей` : 'Загрузка…'}>
          <Table
            columns={[
              { key: 'label', title: 'Ключ' },
              { key: 'system', title: 'Система' },
              { key: 'expires', title: 'Срок' },
              { key: 'check', title: 'Проверка' },
              { key: 'actions', title: '' },
            ]}
            empty={
              rows &&
              list.length === 0 && (
                <EmptyState icon={<IconKey />} title="Ключей пока нет" text="Добавьте первый ключ в форме ниже — сервис проверит его и покажет срок действия." />
              )
            }
          >
            {list.map((cred) => (
              <tr key={cred.id}>
                <td>
                  <span className="nowrap">{cred.label || <span className="text-3">без названия</span>}</span>
                  <div className="cell-sub mono">{cred.hint}</div>
                </td>
                <td>
                  <PlatformChip platform={cred.kind} />
                </td>
                <td>
                  <Expiry daysLeft={cred.days_left} totalDays={KINDS.find((k) => k.value === cred.kind)?.total || 180} />
                  <div className="cell-sub nowrap">{cred.expires_at ? `до ${dateOnly(cred.expires_at)}` : 'без срока'}</div>
                </td>
                <td className="lk-body-s min-w">
                  <span className={cred.last_check_ok === false ? 'text-danger' : 'text-2'}>
                    {cred.last_check_message || '—'}
                  </span>
                  <div className="cell-sub">{dateTime(cred.last_check_at)}</div>
                </td>
                <td className="actions-cell">
                  <span className="row tight">
                    <Button
                      size="s"
                      variant="ghost"
                      icon={<IconRefresh />}
                      onClick={async () => {
                        await api.checkCredential(cred.id)
                        await load()
                      }}
                    >
                      Проверить
                    </Button>
                    <IconButton
                      size="s"
                      aria-label="Удалить ключ"
                      title="Удалить ключ"
                      onClick={async () => {
                        await api.deleteCredential(cred.id)
                        await load()
                      }}
                    >
                      <IconTrash />
                    </IconButton>
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className="narrow" title="Добавить ключ" hint="Ключ отправляется на сервер один раз и дальше не показывается.">
          <form className="form" onSubmit={submit}>
            <Field label="Система" help={kindMeta?.hint}>
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Название">
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Например: основной кабинет · статистика"
              />
            </Field>
            <Field label="Ключ">
              <Input
                type="password"
                value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                placeholder="Вставьте токен"
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Действителен до" help="Если площадка не показывает срок — оставьте пустым.">
              <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </Field>
            <div className="submit">
              <Button variant="primary" type="submit" icon={<IconCheck />} disabled={saving}>
                {saving ? 'Сохраняю…' : 'Сохранить ключ'}
              </Button>
            </div>
            {error && (
              <div className="notice danger" role="alert">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}
          </form>
        </Card>
      </div>
    </>
  )
}
