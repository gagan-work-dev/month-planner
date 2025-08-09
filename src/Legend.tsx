import * as React from 'react'

export default function Legend() {
  const items = [
    { cls: 'cat-to-do', label: 'To Do' },
    { cls: 'cat-in-progress', label: 'In Progress' },
    { cls: 'cat-review', label: 'Review' },
    { cls: 'cat-completed', label: 'Completed' },
  ] as const

  return (
    <div className="legend">
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`dot ${i.cls}`} />
          <span style={{ fontSize: 12 }}>{i.label}</span>
        </div>
      ))}
    </div>
  )
}
