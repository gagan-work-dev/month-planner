import * as React from 'react'
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'

interface Props {
  date: Date
  onPickMonth: (d: Date) => void
}

const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

export default function YearView({ date, onPickMonth }: Props) {
  const year = date.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
  return (
    <div className="calendar-panel">
      <div className="topbar" style={{ position: 'static', borderBottom: '1px solid var(--border)' }}>
        <div className="brand">Year {year}</div>
      </div>
      <div className="year-grid">
        {months.map(m => (
          <MiniMonth key={m.toISOString()} month={m} onClick={() => onPickMonth(m)} />
        ))}
      </div>
    </div>
  )
}

function MiniMonth({ month, onClick }: { month: Date; onClick: () => void }) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const firstDow = (start.getDay() + 6) % 7
  const days = [...Array(firstDow).fill(null), ...eachDayOfInterval({ start, end })]
  return (
    <div className="year-month">
      <div className="header">{format(month, 'MMMM')}</div>
      <div className="mini">
        <div className="year-mini">
          {dows.map(d => <div key={d} className="dow">{d}</div>)}
          {days.map((d, i) => (
            <div key={i} className="cell" onClick={onClick}>{d ? format(d, 'd') : ''}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
