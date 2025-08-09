import * as React from 'react'
import {
  Calendar,
  Views,
  type View,
  type SlotInfo,
  type EventPropGetter,
  type CalendarProps,
} from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { localizer } from './date'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import './index.css'
import Modal from './Modal'
import FiltersPanel from './FiltersPanel'
import Legend from './Legend'
import YearView from './YearView'
import type { PlannerEvent, Filters, Category } from './types'
import { addDays, addMinutes, addMonths, endOfDay, isBefore, startOfDay } from 'date-fns'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

type ViewKey = 'YEAR' | 'MONTH' | 'WEEK' | 'DAY' | 'AGENDA'
type Res = object

const BaseCalendar = Calendar as unknown as React.ComponentType<CalendarProps<PlannerEvent, Res>>
const DnDCalendar = withDragAndDrop<PlannerEvent, Res>(BaseCalendar)

type PersistedEvent = Omit<PlannerEvent, 'start' | 'end'> & { start: string; end: string }

const reviveEvents = (raw: unknown): PlannerEvent[] =>
  (raw as PersistedEvent[] | undefined)?.map(e => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
  })) ?? []

const persistEvents = (evts: PlannerEvent[]): PersistedEvent[] =>
  evts.map(e => ({ ...e, start: e.start.toISOString(), end: e.end.toISOString() }))

const readDate = (raw: unknown, fallback = new Date()): Date => {
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? fallback : d
}

function useLocalState<T>(
  key: string,
  initial: T,
  revive?: (v: unknown) => T,
  persist?: (v: T) => unknown
) {
  const [val, setVal] = React.useState<T>(() => {
    if (typeof window === 'undefined') return initial
    const raw = localStorage.getItem(key)
    if (!raw) return initial
    try {
      const parsed = JSON.parse(raw) as unknown
      return revive ? revive(parsed) : (parsed as T)
    } catch {
      return initial
    }
  })

  React.useEffect(() => {
    try {
      const toStore = persist ? persist(val) : val
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch {

    }
  }, [key, val, persist])

  return [val, setVal] as const
}

function normalizeRange(start: string | Date, end: string | Date, isTimeBased: boolean) {
  const s = new Date(start)
  const e = new Date(end)
  if (isBefore(e, s) || +e === +s) {
    return isTimeBased
      ? { start: s, end: addMinutes(s, 30) }
      : { start: startOfDay(s), end: endOfDay(s) }
  }
  return { start: s, end: e }
}

const initialFilters: Filters = {
  categories: ['To Do', 'In Progress', 'Review', 'Completed'],
  withinWeeks: 0,
  query: '',
}

export default function App(): JSX.Element {
  const [events, setEvents] = useLocalState<PlannerEvent[]>(
    'rbc-events',
    [],
    reviveEvents,
    persistEvents
  )

  const [filters, setFilters] = useLocalState<Filters>('rbc-filters', initialFilters)

  const [slotRange, setSlotRange] = React.useState<{ start: Date; end: Date } | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PlannerEvent | null>(null)

  const [date, setDate] = useLocalState<Date>('rbc-date', new Date(), readDate, d => d.toISOString())
  const [view, setView] = useLocalState<ViewKey>('rbc-view', 'MONTH')


  React.useEffect(() => {
    if (events.length === 0) {
      setEvents([
        {
          id: '1',
          title: 'Kickoff',
          category: 'To Do',
          start: addMinutes(startOfDay(new Date()), 9 * 60),
          end: addMinutes(startOfDay(new Date()), 10 * 60),
        },
        {
          id: '2',
          title: 'Design Sprint',
          category: 'In Progress',
          start: startOfDay(addDays(new Date(), 2)),
          end: endOfDay(addDays(new Date(), 5)),
        },
      ])
    }

  }, [])


  const handleSelectSlot = ({ start, end }: Pick<SlotInfo, 'start' | 'end'>) => {
    if (view === 'MONTH') {

      const norm = normalizeRange(startOfDay(new Date(start)), endOfDay(addDays(new Date(end), -1)), false)
      setSlotRange(norm)
    } else {
      const norm = normalizeRange(start, end, true)
      setSlotRange(norm)
    }
    setCreateOpen(true)
  }

  const addEvent = (name: string, category: Category, notes?: string) => {
    if (!slotRange) return
    const { start, end } = slotRange
    const newEvent: PlannerEvent = {
      id: String(Date.now()),
      title: name,
      category,
      start,
      end,
      notes,
    }
    setEvents(prev => [...prev, newEvent])
    setCreateOpen(false)
    setSlotRange(null)
  }

  const onEventDrop = ({ event, start, end }: EventInteractionArgs<PlannerEvent>) => {
    const norm = normalizeRange(start, end, view === 'DAY' || view === 'WEEK')
    setEvents(prev => prev.map(e => (e.id === event.id ? { ...e, ...norm } : e)))
  }

  const onEventResize = ({ event, start, end }: EventInteractionArgs<PlannerEvent>) => {
    const norm = normalizeRange(start, end, view === 'DAY' || view === 'WEEK')
    setEvents(prev => prev.map(e => (e.id === event.id ? { ...e, ...norm } : e)))
  }

  const onDoubleClick = (event: PlannerEvent) => {
    setEditing(event)
    setEditOpen(true)
  }

  const saveEdit = (name: string, category: Category, notes?: string) => {
    if (!editing) return
    setEvents(prev =>
      prev.map(e => (e.id === editing.id ? { ...e, title: name, category, notes } : e))
    )
    setEditOpen(false)
    setEditing(null)
  }

  const deleteEdit = () => {
    if (!editing) return
    setEvents(prev => prev.filter(e => e.id !== editing.id))
    setEditOpen(false)
    setEditing(null)
  }


  const filtered: PlannerEvent[] = React.useMemo(() => {
    return events.filter(ev => {
      if (!filters.categories.includes(ev.category)) return false
      if (filters.query && !ev.title.toLowerCase().includes(filters.query.toLowerCase())) return false
      if (filters.withinWeeks > 0) {
        const today = startOfDay(new Date())
        const windowEnd = endOfDay(addDays(today, filters.withinWeeks * 7 - 1))
        const within =
          (ev.start >= today && ev.start <= windowEnd) ||
          (ev.end >= today && ev.end <= windowEnd) ||
          (ev.start < today && ev.end > windowEnd)
        if (!within) return false
      }
      return true
    })
  }, [events, filters])


  const eventPropGetter: EventPropGetter<PlannerEvent> = (event) => {
    const color: string = {
      'To Do': '#2563eb',
      'In Progress': '#16a34a',
      Review: '#7c3aed',
      Completed: '#f59e0b',
    }[event.category]
    return { style: { backgroundColor: color }, title: `${event.title} • ${event.category}` }
  }

  const minTime: Date = new Date(new Date().setHours(7, 0, 0, 0))
  const maxTime: Date = new Date(new Date().setHours(21, 0, 0, 0))

  const rbcView: View =
    view === 'MONTH' ? Views.MONTH :
      view === 'WEEK' ? Views.WEEK :
        view === 'DAY' ? Views.DAY : Views.AGENDA

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <div className="topbar">
          <div className="brand">Planner</div>
          <div className="spacer" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setDate(addMonths(date, view === 'YEAR' ? -12 : -1))}>Prev</button>
            <button className="btn" onClick={() => setDate(new Date())}>Today</button>
            <button className="btn" onClick={() => setDate(addMonths(date, view === 'YEAR' ? 12 : 1))}>Next</button>
          </div>
          <div className="spacer" />
          <div className="segmented">
            {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'AGENDA'] as const).map(v => (
              <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
        </div>

        <div className="layout">
          <FiltersPanel value={filters} onChange={setFilters} />

          {view === 'YEAR' ? (
            <YearView
              date={date}
              onPickMonth={(m: Date) => { setDate(m); setView('MONTH') }}
            />
          ) : (
            <div className="calendar-panel">
              <DnDCalendar
                localizer={localizer}
                date={date}
                onNavigate={setDate}
                view={rbcView}
                onView={(_v: View) => { }}
                views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
                events={filtered}
                startAccessor="start"
                endAccessor="end"
                selectable
                resizable
                step={30}
                timeslots={2}
                min={minTime}
                max={maxTime}
                popup
                tooltipAccessor={(e: PlannerEvent) => (e.notes ? `${e.title} — ${e.notes}` : e.title)}
                onSelectSlot={handleSelectSlot}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                onDoubleClickEvent={onDoubleClick}
                eventPropGetter={eventPropGetter}
                style={{ height: 'calc(100vh - 130px)' }}
              />
              <Legend />
            </div>
          )}
        </div>

        <Modal
          isOpen={createOpen}
          title={view === 'MONTH' ? 'Create Task (All-day)' : 'Create Task (Timed)'}
          onCancel={() => { setCreateOpen(false); setSlotRange(null) }}
          onSave={addEvent}
        />

        <Modal
          isOpen={editOpen}
          title="Edit Task"
          defaultName={editing?.title}
          defaultCategory={editing?.category}
          defaultNotes={editing?.notes}
          onCancel={() => { setEditOpen(false); setEditing(null) }}
          onSave={saveEdit}
          onDelete={deleteEdit}
        />
      </div>
    </DndProvider>
  )
}
