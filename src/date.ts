import { dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'

const locales = { 'en-US': enUS }

export const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, fmt: string) => parse(value, fmt, new Date()),
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
})
