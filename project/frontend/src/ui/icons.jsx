const base = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconDashboard = (p) => (
  <svg {...base} {...p}>
    <rect x="2" y="2" width="5" height="5" rx="1.2" />
    <rect x="9" y="2" width="5" height="5" rx="1.2" />
    <rect x="2" y="9" width="5" height="5" rx="1.2" />
    <rect x="9" y="9" width="5" height="5" rx="1.2" />
  </svg>
)

export const IconList = (p) => (
  <svg {...base} {...p}>
    <path d="M5 4h9M5 8h9M5 12h9" />
    <circle cx="2.5" cy="4" r="0.6" fill="currentColor" />
    <circle cx="2.5" cy="8" r="0.6" fill="currentColor" />
    <circle cx="2.5" cy="12" r="0.6" fill="currentColor" />
  </svg>
)

export const IconBox = (p) => (
  <svg {...base} {...p}>
    <path d="M8 2 14 5v6l-6 3-6-3V5z" />
    <path d="M2 5l6 3 6-3M8 8v6" />
  </svg>
)

export const IconKey = (p) => (
  <svg {...base} {...p}>
    <circle cx="5.5" cy="10.5" r="3" />
    <path d="M7.7 8.3 14 2M11 5l2 2M9 7l1.5 1.5" />
  </svg>
)

export const IconSun = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
  </svg>
)

export const IconMoon = (p) => (
  <svg {...base} {...p}>
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
  </svg>
)

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 14 14" />
  </svg>
)

export const IconRefresh = (p) => (
  <svg {...base} {...p}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
    <path d="M13.5 2.5v3h-3" />
  </svg>
)

export const IconLink = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-1 1" />
    <path d="M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l1-1" />
  </svg>
)

export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M8 3v10M3 8h10" />
  </svg>
)

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4 4.5l.7 8.5h6.6l.7-8.5" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M3 8.5l3 3 7-7" />
  </svg>
)

export const IconAlert = (p) => (
  <svg {...base} {...p}>
    <path d="M8 2.5 14 13H2z" />
    <path d="M8 6.5v3M8 11.3v.2" />
  </svg>
)

export const IconInfo = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.5v4M8 5v.2" />
  </svg>
)

export const IconSparkle = (p) => (
  <svg {...base} {...p}>
    <path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3z" />
  </svg>
)

export const IconCodeCrossed = (p) => (
  <svg {...base} {...p}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 5h2v2H5zM9 5h2M5 9v2M9 9h2v2H9z" />
    <path d="M3 13 13 3" />
  </svg>
)

export const IconBoxDashed = (p) => (
  <svg {...base} {...p}>
    <path d="M8 2 14 5v6l-6 3-6-3V5z" />
    <path d="M2 5l6 3 6-3M8 8v6" />
    <path d="M11 9.5v2" strokeDasharray="1 1.4" />
  </svg>
)

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5V8l2.5 1.5" />
  </svg>
)

export const IconReturn = (p) => (
  <svg {...base} {...p}>
    <path d="M6 4 3 7l3 3" />
    <path d="M3 7h6.5a3.5 3.5 0 0 1 0 7H8" />
  </svg>
)

export const ShapeRing = (p) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

export const ShapeHalf = (p) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
  </svg>
)

export const ShapeCheck = ({ fill, ...p }) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <circle cx="8" cy="8" r="6.5" fill={fill || 'currentColor'} />
    <path d="M5 8.2l2 2L11 6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ShapeIgnored = (p) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4.5 11.5l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
