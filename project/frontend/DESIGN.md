# Дизайн-система litekiz во фронтенде

Кабинет построен на дизайн-системе litekiz из Claude Design: тёмная тема «Графит»,
шрифты Mulish (заголовки, крупные цифры) и Golos Text (интерфейс). Светлые
поверхности по дизайн-системе предназначены для сайта и печати, не для кабинета,
поэтому переключателя темы в кабинете нет.

## Где что лежит

```
src/styles/litekiz-ds.css  дизайн-система как есть: токены --lk-*, алиасы (--surface-*, --text-*),
                           типографика (.lk-h1, .lk-num-xl …), компоненты (.lk-btn, .lk-input,
                           .lk-table, .lk-navitem, .lk-seg, .lk-chip, .lk-summary …).
                           Правится только вместе с дизайн-системой.
src/styles/fonts.css       @font-face на шрифты из public/fonts
src/styles/app.css         то, чего в дизайн-системе нет: каркас кабинета, плашки классов
                           расхождений, статусы, плитки сводки, срок ключа, пустые состояния.
                           Все значения — из токенов.
src/styles.css             точка входа: fonts → litekiz-ds → app
src/ui/index.jsx           React-обёртки над классами: Button, IconButton, Card, Table, ClassChip,
                           StatusBadge, StatusSelect, Field/Input/Select, Segmented, EmptyState,
                           StatTile, PlatformChip, Expiry
src/ui/icons.jsx           иконки одной линией (currentColor), формы статусов
src/ui/Logo.jsx            LogoMark (коробка с кодом) и Wordmark («lite kiz»)
public/fonts/              Mulish и Golos Text (woff2, подмножество с кириллицей) + лицензии OFL
public/favicon.svg         иконка вкладки
```

## Правила

- В компонентах и страницах нет HEX — только `var(--…)`. Цвета классов расхождений:
  `--lk-cls-codes-*`, `--lk-cls-goods-*`, `--lk-cls-stuck-*`, `--lk-cls-returns-*`.
- Семантика классов живёт в `DISCREPANCY_CLASSES` (`src/ui/index.jsx`): цвет, иконка
  и подпись всегда вместе — цвет никогда не единственный носитель смысла.
- Статусы работы различаются формой: пустое кольцо → полукольцо → залитый круг
  с галочкой; «не важно» — кольцо с чертой.
- Столбцы с цифрами получают класс `num` (табличные цифры, выравнивание вправо).
- Поля ввода — обёртка `.lk-input` с нативным `input`/`select` внутри (так в дизайн-системе).
- Названия площадок — нейтральной меткой `.tag`, без фирменных цветов маркетплейсов.
- Обновление дизайн-системы: экспортировать из Claude Design, вырезать блок `<style>`
  с токенами и `.lk-*`-классами (без `@font-face`) в `litekiz-ds.css`.

## Что не менялось

`api.js` (добавлена только `dateOnly`), `AccountContext.jsx`, `vite.config.js`, маршруты
и логика страниц. В `main.jsx` корню добавлен класс `lk-root`.
