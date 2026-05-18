import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useState, useEffect } from "react"
import type { Booking } from "@/api/types"

interface BookingCalendarProps {
  bookings: Booking[]
  spaceSlug?: string
  selectedDateStart: string | undefined
  selectedDateEnd: string | undefined
  onDateSelect: (start: Date, end: Date) => void
}

interface CalendarEvent {
  title: string
  start: string
  end: string
  allDay: boolean
  extendedProps: {
    booking: Booking
  }
}

export default function BookingCalendar({
  bookings,
  spaceSlug,
  selectedDateStart,
  selectedDateEnd,
  onDateSelect
}: BookingCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!spaceSlug) {
      setEvents([])
      return
    }

    const spaceBookings = bookings.filter(
      (b) =>
        b.space_slug === spaceSlug &&
        ["pendente", "confirmada", "em_andamento"].includes(b.status)
    )

    const calendarEvents: CalendarEvent[] = spaceBookings.map((b) => ({
      title: b.status,
      start: b.data_inicio,
      end: b.data_fim,
      allDay: true,
      extendedProps: { booking: b }
    }))

    setEvents(calendarEvents)
  }, [bookings, spaceSlug])

  const handleDateClick = (info: any) => {
    const start = new Date(info.dateStr)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    end.setHours(23, 59, 59, 999)

    onDateSelect(start, end)
  }

  const getEventClassNames = (_info: any) => {
    return [
      "booking-occupied",
      "bg-red-100",
      "text-red-700",
      "border",
      "border-red-200",
      "rounded"
    ]
  }

  const getDayClassNames = (info: any) => {
    const date = new Date(info.date)
    date.setHours(0, 0, 0, 0)

    if (selectedDateStart && selectedDateEnd) {
      const start = new Date(selectedDateStart)
      start.setHours(0, 0, 0, 0)
      const end = new Date(selectedDateEnd)
      end.setHours(23, 59, 59, 999)

      if (date >= start && date <= end) {
        return ["bg-green-100", "text-green-900"]
      }
    }
    return []
  }

  if (!spaceSlug) {
    return (
      <div className="text-sm text-gray-400 text-center py-4">
        Selecione um quarto para ver disponibilidade
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: ""
        }}
        locale="pt-br"
        validRange={{ start: new Date() }}
        buttonText={{ today: "Hoje" }}
        events={events}
        dateClick={handleDateClick}
        eventClassNames={getEventClassNames}
        dayCellClassNames={getDayClassNames}
        eventContent={(info) => (
          <div className="text-xs px-1 py-0.5 font-medium truncate">
            {info.event.title}
          </div>
        )}
        editable={false}
        selectable={false}
        height={300}
        dayMaxEvents={1}
        moreLinkContent={(args) => `+${args.num}`}
        eventMouseEnter={(info) => {
          const booking = info.event.extendedProps.booking as Booking
          info.el.title = `${booking.status} - ${new Date(booking.data_inicio).toLocaleDateString("pt-BR")} a ${new Date(booking.data_fim).toLocaleDateString("pt-BR")}`
        }}
      />
      <div className="flex items-center gap-4 text-xs text-gray-500 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
          Ocupado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span>
          Selecionado
        </span>
      </div>
    </div>
  )
}
