type ChartPoint = {
  label: string
  gross: number
  disbursed: number
  commission: number
}

type FinanceTrendChartProps = {
  data: ChartPoint[]
}

const WIDTH = 760
const HEIGHT = 240
const PADDING = { top: 12, right: 10, bottom: 8, left: 10 }

function buildSmoothPath(points: { x: number; y: number }[]) {
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

function getVisibleLabels(data: ChartPoint[]) {
  if (data.length <= 8) return data.map((point) => point.label)

  const indexes = [0, 6, 12, 18, data.length - 1]
  return indexes.map((index) => data[index].label)
}

export default function FinanceTrendChart({ data }: FinanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60 text-xs text-muted">
        Belum ada arus kas pada rentang tanggal ini.
      </div>
    )
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom

  const maxValue = Math.max(...data.map((point) => Math.max(point.gross, point.disbursed)), 1) * 1.12
  const maxCommission = Math.max(...data.map((point) => point.commission), 1) * 1.9

  const slot = innerWidth / data.length
  const barWidth = Math.max(3.5, Math.min(13, slot * 0.27))
  const baseline = PADDING.top + innerHeight

  const getBarHeight = (value: number) => (value / maxValue) * innerHeight
  const getCenter = (index: number) => PADDING.left + slot * index + slot / 2

  const commissionPoints = data.map((point, index) => ({
    x: getCenter(index),
    y: PADDING.top + innerHeight - (point.commission / maxCommission) * innerHeight,
  }))
  const commissionPath = buildSmoothPath(commissionPoints)
  const labels = getVisibleLabels(data)

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Grafik tren omzet masuk, dana dicairkan, dan komisi platform"
      >
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

        {data.map((point, index) => {
          const center = getCenter(index)
          const grossHeight = getBarHeight(point.gross)
          const disbursedHeight = getBarHeight(point.disbursed)

          return (
            <g key={`${point.label}-${index}`}>
              <rect
                x={center - barWidth - 1.5}
                y={baseline - grossHeight}
                width={barWidth}
                height={grossHeight}
                rx="2"
                fill="#0f766e"
              />
              <rect
                x={center + 1.5}
                y={baseline - disbursedHeight}
                width={barWidth}
                height={disbursedHeight}
                rx="2"
                fill="#99f6e4"
              />
            </g>
          )
        })}

        <path d={commissionPath} fill="none" stroke="#0b3b38" strokeWidth="2" strokeLinecap="round" />

        {commissionPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={data.length <= 10 ? 2.5 : 1.6}
            fill="#ffffff"
            stroke="#0b3b38"
            strokeWidth="1.5"
          />
        ))}
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
