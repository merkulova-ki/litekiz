const cells3 = [
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 1],
]

export function LogoMark({ size = 36, className, title = 'litekiz' }) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      fill="none"
    >
      <g transform="translate(0 -10)">
        <g stroke="currentColor" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round">
          <path d="M128 36 L204 80 V168 L128 212 L52 168 V80 Z" />
          <path d="M52 80 L128 124 L204 80" />
          <path d="M128 124 V212" />
        </g>
        <g transform="skewY(-30)" fill="var(--lk-accent)">
          {cells3.flatMap((row, r) =>
            row.map((v, c) =>
              v ? <rect key={`${r}${c}`} x={137 + c * 22} y={212 + r * 22} width="16" height="16" rx="3" /> : null,
            ),
          )}
        </g>
        <path d="M96 238 H160" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

const K = [
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 1],
  [1, 0, 1, 0],
  [1, 1, 0, 0],
  [1, 0, 1, 0],
  [1, 0, 0, 1],
]
const I = [[1], [0], [1], [1], [1], [1], [1]]
const Z = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 1],
  [0, 0, 1, 0],
  [0, 1, 0, 0],
  [1, 1, 1, 1],
]

function Pixels({ grid, x0 }) {
  return grid.flatMap((row, r) =>
    row.map((v, c) =>
      v ? <rect key={`${x0}-${r}-${c}`} x={x0 + c * 18} y={20 + r * 18} width="14" height="14" rx="2" /> : null,
    ),
  )
}

export function Wordmark({ height = 18, className }) {
  return (
    <svg
      viewBox="20 12 396 138"
      height={height}
      className={className}
      role="img"
      aria-label="lite kiz"
      fill="none"
    >
      <g stroke="currentColor" strokeWidth="16" strokeLinecap="round">
        <path d="M28 28 V134" />
        <path d="M60 64 V134" />
        <rect x="52" y="20" width="16" height="16" rx="3" fill="currentColor" stroke="none" />
        <path d="M96 32 V134" />
        <path d="M80 64 H112" />
        <path d="M185 99 A35 35 0 1 0 178.7 119.1" />
        <path d="M115 99 H185" />
      </g>
      <g fill="var(--lk-accent)">
        <Pixels grid={K} x0={222} />
        <Pixels grid={I} x0={308} />
        <Pixels grid={Z} x0={340} />
      </g>
    </svg>
  )
}
