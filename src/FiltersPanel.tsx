import * as React from 'react'
import type { Category, Filters, WeeksWindow } from './types'

const allCats: Category[] = ['To Do', 'In Progress', 'Review', 'Completed']

interface Props {
  value: Filters
  onChange: (f: Filters) => void
}

export default function FiltersPanel({ value, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch })

  const toggle = (c: Category) => {
    const categories = value.categories.includes(c)
      ? value.categories.filter(x => x !== c)
      : [...value.categories, c]
    set({ categories })
  }

  return (
    <div className="filters-card">
      <input
        className="search"
        placeholder="Search by task name…"
        value={value.query}
        onChange={e => set({ query: e.target.value })}
      />

      <div>
        <div className="section-title">Categories</div>
        {allCats.map(c => (
          <label className="checkbox" key={c}>
            <input
              type="checkbox"
              checked={value.categories.includes(c)}
              onChange={() => toggle(c)}
            />
            <span>{c}</span>
          </label>
        ))}
      </div>

      <div>
        <div className="section-title">Time window</div>
        <div className="segmented">
          {([0, 1, 2, 3] as WeeksWindow[]).map(w => (
            <button
              key={w}
              className={w === value.withinWeeks ? 'active' : ''}
              onClick={() => set({ withinWeeks: w })}
            >
              {w === 0 ? 'All' : `${w}w`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
