import type { TrendPoint } from '../../lib/admin-dashboard-data'

type TrendChartProps = {
  data: TrendPoint[]
}

type ChartPoint = {
  x: number
  y: number
}

const WIDTH = 760
const HEIGHT = 280
const PADDING = { top: 20, right: 16, bottom: 12, left: 16 }

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

function getVisibleLabels(data: TrendPoint[]) {
  if (data.length <= 8) return data.map((point) => point.label)

  const indexes = [0, 6, 12, 18, 24, data.length - 1]
  return indexes.map((index) => data[index].label)
}

export default function TrendChart({ data }: TrendChartProps) {
  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom

  const omzetMax = Math.max(...data.map((point) => point.omzet)) * 1.14
  const ordersMax = Math.max(...data.map((point) => point.orders)) * 1.18

  const getX = (index: number) => PADDING.left + (innerWidth * index) / (data.length - 1)
  const getOmzetY = (value: number) => PADDING.top + innerHeight - (value / omzetMax) * innerHeight
  const getOrdersY = (value: number) =>
    PADDING.top + innerHeight - (value / ordersMax) * innerHeight

  const omzetPoints = data.map((point, index) => ({ x: getX(index), y: getOmzetY(point.omzet) }))
  const ordersPoints = data.map((point, index) => ({ x: getX(index), y: getOrdersY(point.orders) }))

  const omzetPath = buildSmoothPath(omzetPoints)
  const ordersPath = buildSmoothPath(ordersPoints)
  const baseline = HEIGHT - PADDING.bottom
  const areaPath = `${omzetPath} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`
  const lastPoint = omzetPoints[omzetPoints.length - 1]
  const labels = getVisibleLabels(data)
  const showMarkers = data.length <= 8

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Grafik tren omzet harian dan frekuensi pesanan"
      >
        <defs>
          <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((line) => {
          const y = PADDING.top + (innerHeight * line) / 3
          return (
            <line
              key={line}
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          )
        })}

        <path d={areaPath} fill="url(#trendAreaFill)" />
        <path
          d={ordersPath}
          fill="none"
          stroke="#5eead4"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path d={omzetPath} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />

        {showMarkers &&
          omzetPoints.slice(0, -1).map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#ffffff"
              stroke="#0f766e"
              strokeWidth="2"
            />
          ))}

        <circle cx={lastPoint.x} cy={lastPoint.y} r="8" fill="#ccfbf1" />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4.5"
          fill="#0f766e"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </svg>

      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-medium text-slate-400">
        {labels.map((label) => (
          <span key={label} className={label === 'Hari Ini' ? 'font-bold text-primary' : undefined}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
