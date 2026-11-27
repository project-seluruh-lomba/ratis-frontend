type OwnerCashflowPoint = {
  label: string
  income: number
  expense: number
}

type OwnerCashflowChartProps = {
  data: OwnerCashflowPoint[]
  peakNote?: string
}

type ChartPoint = {
  x: number
  y: number
}

const WIDTH = 760
const HEIGHT = 280
const PADDING = { top: 54, right: 16, bottom: 34, left: 46 }

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

function formatAxis(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${millions.toFixed(millions >= 10 ? 0 : 1).replace('.', ',')}jt`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}rb`
  return String(value)
}

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function getLabelIndexes(length: number) {
  if (length <= 8) return Array.from({ length }, (_, index) => index)
  const indexes = [0, 5, 10, 15, 20, 25, length - 1]
  return indexes.filter((index, position) => index < length && indexes.indexOf(index) === position)
}

export default function OwnerCashflowChart({
  data,
  peakNote,
}: OwnerCashflowChartProps) {
  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom

  const maxValue = Math.max(
    ...data.flatMap((point) => [point.income, point.expense]),
    400_000,
  )
  const step = maxValue > 2_000_000 ? 1_000_000 : 500_000
  const yMax = Math.ceil(maxValue / step) * step

  const getX = (index: number) =>
    data.length <= 1 ? PADDING.left : PADDING.left + (innerWidth * index) / (data.length - 1)
  const getY = (value: number) =>
    PADDING.top + innerHeight - (Math.min(value, yMax) / yMax) * innerHeight

  const incomePoints = data.map((point, index) => ({
    x: getX(index),
    y: getY(point.income),
  }))
  const expensePoints = data.map((point, index) => ({
    x: getX(index),
    y: getY(point.expense),
  }))

  const incomePath = buildSmoothPath(incomePoints)
  const expensePath = buildSmoothPath(expensePoints)
  const baseline = PADDING.top + innerHeight
  const areaPath = `${incomePath} L ${getX(data.length - 1)} ${baseline} L ${getX(0)} ${baseline} Z`

  let peakIndex = 0
  data.forEach((point, index) => {
    if (point.income > data[peakIndex].income) peakIndex = index
  })
  const peakPoint = incomePoints[peakIndex]
  const peakLabel = data[peakIndex].label

  const bubbleWidth = 204
  const bubbleHeight = peakNote ? 64 : 48
  const bubbleX = Math.min(
    Math.max(peakPoint.x - bubbleWidth / 2, PADDING.left),
    WIDTH - PADDING.right - bubbleWidth,
  )
  const bubbleY = Math.max(peakPoint.y - bubbleHeight - 18, 2)
  const labelIndexes = getLabelIndexes(data.length)
  const yTicks = [yMax, yMax * (2 / 3), yMax * (1 / 3), 0]

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mt-3 w-full"
      role="img"
      aria-label="Grafik arus kas masuk dan keluar harian"
    >
      <defs>
        <linearGradient id="ownerCashflowAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
        </linearGradient>
        <filter
          id="ownerCashflowTooltipShadow"
          x="-20%"
          y="-30%"
          width="140%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="6"
            floodColor="#0f172a"
            floodOpacity="0.14"
          />
        </filter>
      </defs>

      {yTicks.map((tick) => {
        const y = getY(tick)
        return (
          <g key={tick}>
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
              {formatAxis(tick)}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#ownerCashflowAreaFill)" />
      <path
        d={expensePath}
        fill="none"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={incomePath}
        fill="none"
        stroke="#0f766e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx={peakPoint.x} cy={peakPoint.y} r="10" fill="#ccfbf1" opacity="0.8" />
      <circle
        cx={peakPoint.x}
        cy={peakPoint.y}
        r="4.5"
        fill="#ffffff"
        stroke="#0f766e"
        strokeWidth="2.5"
      />

      <g>
        <rect
          x={bubbleX}
          y={bubbleY}
          width={bubbleWidth}
          height={bubbleHeight}
          rx="8"
          fill="#ffffff"
          filter="url(#ownerCashflowTooltipShadow)"
        />
        <circle cx={bubbleX + 14} cy={bubbleY + 16} r="3" fill="#0f766e" />
        <text
          x={bubbleX + 22}
          y={bubbleY + 19}
          fontSize="9.5"
          fontWeight="600"
          fill="#0f766e"
        >
          {peakLabel} (Puncak Pesanan):
        </text>
        <text
          x={bubbleX + 12}
          y={bubbleY + 39}
          fontSize="11"
          fontWeight="700"
          fill="#0f172a"
        >
          Inflow {formatRupiah(data[peakIndex].income)}
        </text>
        {peakNote ? (
          <text
            x={bubbleX + 12}
            y={bubbleY + 56}
            fontSize="9.5"
            fontWeight="400"
            fill="#64748b"
          >
            {peakNote}
          </text>
        ) : null}
      </g>

      {labelIndexes.map((index) => (
        <text
          key={`${data[index].label}-${index}`}
          x={getX(index)}
          y={HEIGHT - 10}
          textAnchor="middle"
          fontSize="10"
          fontWeight="500"
          fill="#94a3b8"
        >
          {data[index].label}
        </text>
      ))}
    </svg>
  )
}
