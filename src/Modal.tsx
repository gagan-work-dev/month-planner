import * as React from 'react'
import type { Category } from './types'

interface Props {
  isOpen: boolean
  title: string
  defaultName?: string
  defaultCategory?: Category
  defaultNotes?: string
  onCancel: () => void
  onSave: (name: string, category: Category, notes?: string) => void
  onDelete?: () => void
}

const categories: Category[] = ['To Do', 'In Progress', 'Review', 'Completed']

export default function Modal({
  isOpen, title, defaultName = '', defaultCategory = 'To Do', defaultNotes = '',
  onCancel, onSave, onDelete
}: Props) {
  const [name, setName] = React.useState(defaultName)
  const [cat, setCat] = React.useState<Category>(defaultCategory)
  const [notes, setNotes] = React.useState(defaultNotes)

  React.useEffect(() => {
    setName(defaultName)
    setCat(defaultCategory)
    setNotes(defaultNotes)
  }, [isOpen, defaultName, defaultCategory, defaultNotes])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{title}</h3></div>

        <div className="modal-body">
          <div className="row two">
            <label className="field">
              <span>Task name</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Design review"
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select value={cat} onChange={e => setCat(e.target.value as Category)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Notes (optional)</span>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note"
            />
          </label>
        </div>

        <div className="modal-footer">
          {onDelete ? <button className="btn danger" onClick={onDelete}>Delete</button> : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onCancel}>Cancel</button>
            <button
              className="btn primary"
              disabled={!name.trim()}
              onClick={() => onSave(name.trim(), cat, notes.trim() || undefined)}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
