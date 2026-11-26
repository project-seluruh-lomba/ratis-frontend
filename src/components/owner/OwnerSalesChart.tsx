import type { OwnerTrendPoint } from '../../lib/owner-dashboard-data'

type OwnerSalesChartProps = {
  data: OwnerTrendPoint[]
}

type ChartPoint = {
  x: number
  y: number
}

const WIDTH = 760
const HEIGHT = 300
const PADDING = { top: 46, right: 18, bottom: 32, left: 44 }
const Y_MAX = 650000

const yTicks = [
  { value: 600000, label: '600k' },
  { value: 450000, label: '450k' },
  { value: 300000, label: '300k' },
  { value: 0, label: '0' },
]

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length < 2) return ''

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const afterNext = points[index + 2] ?? next

    const control1x = current.x + (next.x - previous.x) / 6
    const control1y = current.y + (next.y - previous.y) / 6
    const control2x = next.x - (afterNext.x - current.x) / 6
    const control2y = next.y - (afterNext.y - current.y) / 6

    path += ` C ${control1x} ${control1y}, ${control2x} ${control2y}, ${next.x} ${next.y}`
  }

  return path
}

function getVisibleLabels(data: OwnerTrendPoint[]) {
  if (data.length <= 8) return data.map((point) => point.label)

  const indexes = [0, 6, 12, 18, 24, data.length - 1]
  return indexes.map((index) => data[index].label)
}

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

export default function OwnerSalesChart({ data }: OwnerSalesChartProps) {
  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom

  const getX = (index: number) =>
    data.length <= 1 ? PADDING.left : PADDING.left + (innerWidth * index) / (data.length - 1)
  const getY = (value: number) =>
    PADDING.top + innerHeight - (Math.min(value, Y_MAX) / Y_MAX) * innerHeight

  const points = data.map((point, index) => ({ x: getX(index), y: getY(point.omzet) }))
  const linePath = buildSmoothPath(points)
  const baseline = PADDING.top + innerHeight
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`
  const labels = getVisibleLabels(data)
  const showMarkers = data.length <= 8

  let peakIndex = 0
  data.forEach((point, index) => {
    if (point.omzet > data[peakIndex].omzet) peakIndex = index
  })

  const peakPoint = points[peakIndex]
  const peakValue = data[peakIndex].omzet
  const bubbleWidth = 92
  const bubbleHeight = 28
  const bubbleX = Math.min(
    Math.max(peakPoint.x - bubbleWidth / 2, PADDING.left),
    WIDTH - PADDING.right - bubbleWidth,
  )
  const bubbleY = Math.max(peakPoint.y - bubbleHeight - 16, 4)

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Grafik tren penjualan dan omzet toko"
      >
        <defs>
          <linearGradient id="ownerTrendAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = getY(tick.value)
          return (
            <g key={tick.value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <text
                x={PADDING.left - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fontWeight="500"
                fill="#94a3b8"
              >
                {tick.label}
              </text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#ownerTrendAreaFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#0f766e"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {showMarkers &&
          points.map((point, index) => {
            if (index === peakIndex) return null
            const isLast = index === points.length - 1
            return (
              <g key={data[index].label}>
                {isLast && (
                  <circle cx={point.x} cy={point.y} r="9" fill="#ccfbf1" opacity="0.8" />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isLast ? 4.5 : 4}
                  fill={isLast ? '#0f766e' : '#ffffff'}
                  stroke={isLast ? '#ffffff' : '#0f766e'}
                  strokeWidth={isLast ? 2 : 2.25}
                />
              </g>
            )
          })}

        <circle cx={peakPoint.x} cy={peakPoint.y} r="11" fill="#ccfbf1" opacity="0.7" />
        <circle
          cx={peakPoint.x}
          cy={peakPoint.y}
          r="5"
          fill="#ffffff"
          stroke="#0f766e"
          strokeWidth="3"
        />

        <g>
          <rect
            x={bubbleX}
            y={bubbleY}
            width={bubbleWidth}
            height={bubbleHeight}
            rx="8"
            fill="#0f766e"
          />
          <path
            d={`M ${peakPoint.x - 5} ${bubbleY + bubbleHeight} L ${peakPoint.x} ${
              bubbleY + bubbleHeight + 6
            } L ${peakPoint.x + 5} ${bubbleY + bubbleHeight} Z`}
            fill="#0f766e"
          />
          <text
            x={bubbleX + bubbleWidth / 2}
            y={bubbleY + 18}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
          >
            {formatRupiah(peakValue)}
          </text>
        </g>

        {labels.map((label, index) => {
          const labelIndexes =
            data.length <= 8
              ? data.map((_, pointIndex) => pointIndex)
              : [0, 6, 12, 18, 24, data.length - 1]
          return (
            <text
              key={`${label}-${index}`}
              x={getX(labelIndexes[index])}
              y={HEIGHT - 10}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="500"
              fill={label === 'Sab' ? '#0f766e' : '#94a3b8'}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
