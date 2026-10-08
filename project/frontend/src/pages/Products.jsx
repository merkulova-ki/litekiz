import { useEffect, useState } from 'react'
import { api, money } from '../api.js'
import { useAccount } from '../AccountContext.jsx'
import {
  Button,
  Card,
  EmptyState,
  IconBox,
  IconLink,
  IconPlus,
  IconSparkle,
  Input,
  PageHeader,
  PlatformChip,
  Segmented,
  Select,
  Table,
} from '../ui/index.jsx'

export default function Products() {
  const { account } = useAccount()
  const [tab, setTab] = useState('matched')
  const [products, setProducts] = useState([])
  const [unmatched, setUnmatched] = useState([])
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [p, u] = await Promise.all([api.products(account.id, search), api.unmatched(account.id)])
    setProducts(p)
    setUnmatched(u)
  }

  useEffect(() => {
    load()
  }, [account.id, search])

  async function runAutoMatch() {
    setBusy(true)
    try {
      await api.autoMatch(account.id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Товары"
        sub="Единый справочник: карточки разных площадок сшиты по штрихкоду и артикулу"
        actions={
          <Button variant="primary" icon={<IconSparkle />} onClick={runAutoMatch} disabled={busy}>
            {busy ? 'Сшиваю…' : 'Автосопоставление'}
          </Button>
        }
      />

      <div className="toolbar">
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            { value: 'matched', label: 'Сопоставленные', count: products.length },
            { value: 'unmatched', label: 'Без пары', count: unmatched.length },
          ]}
        />
        {tab === 'matched' && (
          <Input
            className="search"
            placeholder="Поиск по названию или GTIN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск"
          />
        )}
      </div>

      <Card flush>
        {tab === 'matched' ? (
          <Table
            columns={[
              { key: 'name', title: 'Товар' },
              { key: 'platforms', title: 'Площадки' },
              { key: 'stock', title: 'Остаток', num: true },
              { key: 'introduced', title: 'В обороте', num: true },
              { key: 'frozen', title: 'Зависло кодов', num: true },
              { key: 'cost', title: 'Себестоимость', num: true },
            ]}
            empty={
              products.length === 0 && (
                <EmptyState
                  icon={<IconBox />}
                  title={search ? 'Ничего не найдено' : 'Справочник пуст'}
                  text={search ? 'Попробуйте другое название или GTIN.' : 'Запустите автосопоставление, чтобы сшить карточки площадок в товары.'}
                />
              )
            }
          >
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name}
                  <div className="cell-sub mono">GTIN {p.gtin}</div>
                </td>
                <td>
                  <span className="row tight">
                    {p.platforms.map((platform) => (
                      <PlatformChip key={platform} platform={platform} />
                    ))}
                  </span>
                </td>
                <td className="num">{p.stock}</td>
                <td className="num">{p.codes_introduced}</td>
                <td className="num">{p.codes_frozen}</td>
                <td className="num">{money(p.cost_price)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <UnmatchedTable items={unmatched} products={products} onDone={load} />
        )}
      </Card>
    </>
  )
}

function UnmatchedTable({ items, products, onDone }) {
  const [selection, setSelection] = useState({})

  async function link(itemId) {
    const productId = selection[itemId]
    if (!productId) return
    await api.matchItem(itemId, Number(productId))
    onDone()
  }

  async function createProduct(itemId) {
    await api.createProductFromItem(itemId)
    onDone()
  }

  return (
    <Table
      columns={[
        { key: 'name', title: 'Карточка' },
        { key: 'platform', title: 'Площадка' },
        { key: 'codes', title: 'Штрихкод / артикул' },
        { key: 'action', title: 'Привязать к товару' },
      ]}
      empty={
        items.length === 0 && (
          <EmptyState icon={<IconLink />} title="Все карточки сопоставлены" text="Новые карточки без пары появятся здесь после следующей загрузки данных." />
        )
      }
    >
      {items.map((item) => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>
            <PlatformChip platform={item.platform} />
          </td>
          <td className="mono text-2">
            {item.barcode}
            <div className="cell-sub mono">{item.offer_code}</div>
          </td>
          <td className="actions-cell">
            <span className="row tight">
              <Select
                compact
                value={selection[item.id] || ''}
                onChange={(e) => setSelection({ ...selection, [item.id]: e.target.value })}
                aria-label="Товар для привязки"
              >
                <option value="">— выбрать товар —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Button size="s" variant="secondary" icon={<IconLink />} onClick={() => link(item.id)} disabled={!selection[item.id]}>
                Связать
              </Button>
              <Button size="s" variant="ghost" icon={<IconPlus />} onClick={() => createProduct(item.id)}>
                Новый товар
              </Button>
            </span>
          </td>
        </tr>
      ))}
    </Table>
  )
}
