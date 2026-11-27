import {
  formatReportDateShort,
  reportTodayIso,
  type OwnerReportDay,
} from '../../lib/owner-report-data'

type ChartPoint = {
  x: number
  y: number
}

const WIDTH = 820
const HEIGHT = 310
const PADDING = { top: 48, right: 20, bottom: 34, left: 58 }

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

function formatAxisRupiah(value: number) {
  if (value === 0) return 'Rp 0'
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `Rp ${millions.toLocaleString('id-ID', {
      maximumFractionDigits: 1,
    })} jt`
  }
  return `Rp ${(value / 1000).toLocaleString('id-ID')} rb`
}

function formatFullRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function getLabelIndexes(length: number) {
  if (length <= 8) {
    return Array.from({ length }, (_, index) => index)
  }

  const last = length - 1
  return [0, Math.round(last * 0.2), Math.round(last * 0.4), Math.round(last * 0.6), Math.round(last * 0.8), last]
}

export default function OwnerReportChart({ data }: { data: OwnerReportDay[] }) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl bg-[#f8fafc] px-4 text-center">
        <p className="text-[13px] font-bold text-ink">Belum ada data penjualan</p>
        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
          Pilih periode lain atau selesaikan pesanan pertama untuk melihat tren
          penjualan harian.
        </p>
      </div>
    )
  }

  const innerWidth = WIDTH - PADDING.left - PADDING.right
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom
  const maxOmzet = Math.max(...data.map((day) => day.omzet), 1)
  const maxOrders = Math.max(...data.map((day) => day.orders), 1)
  const step = maxOmzet / 3
  const roundedStep = Math.ceil(step / 100_000) * 100_000
  const yMax = roundedStep * 3
  const yTicks = [0, roundedStep, roundedStep * 2, yMax]

  const getX = (index: number) =>
    data.length <= 1
      ? PADDING.left + innerWidth / 2
      : PADDING.left + (innerWidth * index) / (data.length - 1)
  const getY = (value: number) =>
    PADDING.top + innerHeight - (Math.min(value, yMax) / yMax) * innerHeight

  const omzetPoints = data.map((day, index) => ({
    x: getX(index),
    y: getY(day.omzet),
  }))
  const volumePoints = data.map((day, index) => ({
    x: getX(index),
    y:
      PADDING.top +
      innerHeight -
      (Math.min(day.orders, maxOrders) / maxOrders) * (innerHeight * 0.62),
  }))

  const omzetPath = buildSmoothPath(omzetPoints)
  const volumePath = buildSmoothPath(volumePoints)
  const baseline = PADDING.top + innerHeight
  const areaPath = `${omzetPath} L ${getX(data.length - 1)} ${baseline} L ${getX(
    0,
  )} ${baseline} Z`

  const peakIndex = data.reduce(
    (best, day, index) =>
      day.omzet > data[best].omzet ? index : best,
    0,
  )
  const peakPoint = omzetPoints[peakIndex]
  const peakDay = data[peakIndex]

  const bubbleWidth = 128
  const bubbleHeight = 38
  const bubbleX = Math.min(
    Math.max(peakPoint.x - bubbleWidth / 2, PADDING.left),
    WIDTH - PADDING.right - bubbleWidth,
  )
  const bubbleY = Math.max(peakPoint.y - bubbleHeight - 18, 4)
  const labelIndexes = getLabelIndexes(data.length)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Grafik tren penjualan harian dan nilai omzet"
    >
      <defs>
        <linearGradient id="ownerReportAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
        </linearGradient>
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
              strokeDasharray="4 7"
            />
            <text
              x={PADDING.left - 10}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fontWeight="500"
              fill="#94a3b8"
            >
              {formatAxisRupiah(tick)}
            </text>
          </g>
        )
      })}

      <path d={areaPath} fill="url(#ownerReportAreaFill)" />
      <path
        d={volumePath}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.6"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
      <path
        d={omzetPath}
        fill="none"
        stroke="#0f766e"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.length <= 8 &&
        omzetPoints.map((point, index) => (
          <circle
            key={data[index].date}
            cx={point.x}
            cy={point.y}
            r={index === peakIndex ? 5 : 4}
            fill="#ffffff"
            stroke="#0f766e"
            strokeWidth={index === peakIndex ? 3 : 2}
          />
        ))}

      <circle cx={peakPoint.x} cy={peakPoint.y} r="11" fill="#ccfbf1" opacity="0.75" />
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
          rx="9"
          fill="#0b3b3a"
        />
        <path
          d={`M ${peakPoint.x - 6} ${bubbleY + bubbleHeight} L ${peakPoint.x} ${
            bubbleY + bubbleHeight + 7
          } L ${peakPoint.x + 6} ${bubbleY + bubbleHeight} Z`}
          fill="#0b3b3a"
        />
        <text
          x={bubbleX + bubbleWidth / 2}
          y={bubbleY + 15}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="600"
          fill="#99f6e4"
        >
          {formatReportDateShort(peakDay.date)} (Puncak)
        </text>
        <text
          x={bubbleX + bubbleWidth / 2}
          y={bubbleY + 29}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          fill="#ffffff"
        >
          {formatFullRupiah(peakDay.omzet)} • {peakDay.orders} Order
        </text>
      </g>

      {labelIndexes.map((index, position) => {
        const day = data[index]
        const isLast = position === labelIndexes.length - 1
        return (
          <text
            key={`${day.date}-${position}`}
            x={getX(index)}
            y={HEIGHT - 12}
            textAnchor={
              position === 0 ? 'start' : isLast ? 'end' : 'middle'
            }
            fontSize="10"
            fontWeight={isLast ? '700' : '500'}
            fill={isLast ? '#0f766e' : '#94a3b8'}
          >
            {isLast && day.date === reportTodayIso
              ? 'Hari Ini'
              : formatReportDateShort(day.date)}
          </text>
        )
      })}

    </svg>
  )
}
