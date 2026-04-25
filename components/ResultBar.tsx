'use client'

interface ResultBarProps {
  label: string
  percentage: number
  color: 'red' | 'blue'
  winner?: boolean
}

export default function ResultBar({ label, percentage, color, winner }: ResultBarProps) {
  const colorMap = {
    red: { bar: winner ? 'bg-red-500' : 'bg-red-500/40', text: 'text-red-400' },
    blue: { bar: winner ? 'bg-blue-500' : 'bg-blue-500/40', text: 'text-blue-400' },
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-[var(--text)] truncate pr-4">{label}</span>
        <span className={`text-lg font-black flex-shrink-0 ${colorMap[color].text}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-6 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorMap[color].bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
