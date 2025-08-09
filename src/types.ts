export type Category = 'To Do' | 'In Progress' | 'Review' | 'Completed'

export interface PlannerEvent {
  id: string
  title: string
  category: Category
  start: Date
  end: Date
  notes?: string
}

export type WeeksWindow = 0 | 1 | 2 | 3

export interface Filters {
  categories: Category[]
  withinWeeks: WeeksWindow
  query: string
}
