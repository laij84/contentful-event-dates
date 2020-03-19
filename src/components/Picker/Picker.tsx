import React, { useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function formatDate(date: Date) {
  return `${date.toLocaleString('en-gb', {
    weekday: 'short'
  })} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  }`
}

interface PickerProps {
  onDateChange: (date: Date, id: string) => void
  date: Date
  id: string
}
export const Picker: React.FC<PickerProps> = ({ onDateChange, date, id, ...props }) => {
  const [eventDate, setDate] = useState<Date>(date || new Date())
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = (e: Event): void => {
    if (ref && ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false)
      return
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  return (
    <div ref={ref} {...props}>
      <div className="TextInput__TextInput___36-K- TextInput__TextInput--full___1EJEW">
        <input
          className="TextInput__TextInput__input___27vDB a11y__focus-border--default___60AXp"
          type="text"
          value={formatDate(eventDate)}
          onFocus={() => setOpen(true)}
          onChange={() => {
            return
          }}
        />
      </div>

      {open && (
        <DatePicker
          selected={eventDate}
          onChange={(pickedDate: Date) => {
            setDate(pickedDate)
            onDateChange(pickedDate, id)
          }}
          showTimeInput
          timeFormat="HH:mm"
          dateFormat="MMMM d, yyyy h:mm aa"
          inline
        />
      )}
    </div>
  )
}
