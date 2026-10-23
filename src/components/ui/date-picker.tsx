"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  Sparkles,
} from "lucide-react"

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  highlight?: boolean
  allowClear?: boolean
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const MONTHS_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
]

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  className,
  highlight = false,
  allowClear = true,
}) => {
  const [open, setOpen] = React.useState(false)
  const [manualInput, setManualInput] = React.useState("")

  // Clean and parse value safely (handles YYYY-MM-DD and ISO strings)
  const selectedDate = React.useMemo(() => {
    if (!value) return null
    const cleanStr = String(value).split("T")[0].trim()
    const parts = cleanStr.split("-")
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const d = parseInt(parts[2], 10)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d)
      }
    }
    const fallback = new Date(value)
    return isNaN(fallback.getTime()) ? null : fallback
  }, [value])

  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Synchronize viewDate and manualInput when value changes from outside
  React.useEffect(() => {
    if (selectedDate && !isNaN(selectedDate.getTime())) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
      const y = selectedDate.getFullYear()
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0")
      const d = String(selectedDate.getDate()).padStart(2, "0")
      setManualInput(`${y}-${m}-${d}`)
    } else {
      setManualInput("")
    }
  }, [value, selectedDate])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Year options for dropdown (e.g. 2024 to 2032)
  const currentYear = new Date().getFullYear()
  const yearsList = React.useMemo(() => {
    const years: number[] = []
    for (let y = currentYear - 3; y <= currentYear + 6; y++) {
      years.push(y)
    }
    return years
  }, [currentYear])

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleMonthSelect = (newMonth: number) => {
    setViewDate(new Date(year, newMonth, 1))
  }

  const handleYearSelect = (newYear: number) => {
    setViewDate(new Date(newYear, month, 1))
  }

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday

  const daysArray = React.useMemo(() => {
    const arr: Array<{ day: number; dateString: string; isCurrentMonth: boolean }> = []
    // Previous month filler days
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const prevM = month === 0 ? 12 : month
      const prevY = month === 0 ? year - 1 : year
      arr.push({
        day: d,
        dateString: `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      })
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curM = month + 1
      arr.push({
        day: d,
        dateString: `${year}-${String(curM).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      })
    }
    // Next month filler
    const remaining = (7 - (arr.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = month + 2 > 12 ? 1 : month + 2
      const nextY = month + 2 > 12 ? year + 1 : year
      arr.push({
        day: d,
        dateString: `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      })
    }
    return arr
  }, [year, month, daysInMonth, firstDayIndex])

  // Formatted date string for trigger
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return placeholder
    const cleanStr = String(dateStr).split("T")[0].trim()
    const parts = cleanStr.split("-")
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const d = parseInt(parts[2], 10)
      const dt = new Date(y, m - 1, d)
      if (!isNaN(dt.getTime())) {
        const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dt.getDay()]
        const monthShort = MONTHS_SHORT_ID[m - 1] || ""
        return `${dayName}, ${d} ${monthShort} ${y}`
      }
    }
    return dateStr
  }

  // Quick select helper
  const handleQuickSelect = (daysToAdd: number) => {
    const target = new Date()
    target.setDate(target.getDate() + daysToAdd)
    const y = target.getFullYear()
    const m = String(target.getMonth() + 1).padStart(2, "0")
    const d = String(target.getDate()).padStart(2, "0")
    const str = `${y}-${m}-${d}`
    onChange(str)
    setManualInput(str)
    setOpen(false)
  }

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setManualInput("")
  }

  // Local today string (WIB safe, not UTC)
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  // Standardize value string
  const cleanValue = value ? String(value).split("T")[0].trim() : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full flex items-center">
        <PopoverTrigger
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 pr-8 rounded-xl border transition-all shadow-2xs flex items-center cursor-pointer outline-none select-none",
            !cleanValue && "text-muted-foreground",
            highlight
              ? "border-[#f370a8]/60 dark:border-[#f370a8]/40 bg-[#f370a8]/10 text-foreground hover:bg-[#f370a8]/15 font-medium ring-2 ring-[#f370a8]/15"
              : "border-border bg-card hover:bg-accent/40 text-foreground",
            className
          )}
        >
          <CalendarIcon
            className={cn(
              "w-4 h-4 mr-2.5 shrink-0 transition-transform group-hover:scale-110",
              highlight ? "text-[#f370a8]" : "text-muted-foreground"
            )}
          />
          <span className="truncate text-xs font-semibold">
            {cleanValue ? formatDateDisplay(cleanValue) : placeholder}
          </span>
        </PopoverTrigger>

        {/* Clear Button */}
        {allowClear && cleanValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10"
            title="Hapus tanggal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[320px] max-w-[calc(100vw-2rem)] p-3.5 bg-card border-border shadow-2xl rounded-2xl z-[9999]"
      >
        {/* Quick select chips */}
        <div className="flex items-center gap-1.5 pb-2.5 border-b border-border/80 overflow-x-auto no-scrollbar">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSelect(0)}
            className="h-7 text-[11px] px-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground font-semibold shrink-0"
          >
            Hari Ini
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSelect(1)}
            className="h-7 text-[11px] px-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground font-semibold shrink-0"
          >
            Besok
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSelect(7)}
            className="h-7 text-[11px] px-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground font-semibold shrink-0"
          >
            +1 Mgg
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSelect(30)}
            className="h-7 text-[11px] px-2.5 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground font-semibold shrink-0"
          >
            +1 Bln
          </Button>
        </div>

        {/* Month & Year Navigation with Direct Selectors */}
        <div className="flex items-center justify-between pt-2.5 pb-2 gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 rounded-lg hover:bg-accent text-foreground shrink-0"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Month & Year Selector Dropdowns */}
          <div className="flex items-center gap-1 flex-1 justify-center">
            <select
              value={month}
              onChange={(e) => handleMonthSelect(Number(e.target.value))}
              className="h-7 text-xs font-bold text-foreground bg-muted/60 hover:bg-muted border border-border/80 rounded-lg px-1.5 cursor-pointer outline-none transition-colors"
            >
              {MONTHS_ID.map((mName, mIdx) => (
                <option key={mIdx} value={mIdx} className="bg-card text-foreground">
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => handleYearSelect(Number(e.target.value))}
              className="h-7 text-xs font-bold text-foreground bg-muted/60 hover:bg-muted border border-border/80 rounded-lg px-1.5 cursor-pointer outline-none transition-colors"
            >
              {yearsList.map((yNum) => (
                <option key={yNum} value={yNum} className="bg-card text-foreground">
                  {yNum}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 rounded-lg hover:bg-accent text-foreground shrink-0"
            title="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center py-1">
          {DAYS_ID.map((d, i) => (
            <div
              key={d}
              className={cn(
                "text-[10px] font-bold py-0.5",
                i === 0 ? "text-[#f370a8]" : "text-muted-foreground"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-0.5">
          {daysArray.map((item, idx) => {
            const isSelected = item.dateString === cleanValue
            const isToday = item.dateString === todayStr

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(item.dateString)
                  setManualInput(item.dateString)
                  setOpen(false)
                }}
                className={cn(
                  "h-8 w-full rounded-lg text-xs font-medium flex items-center justify-center transition-all relative cursor-pointer",
                  !item.isCurrentMonth && "text-muted-foreground/35 hover:text-muted-foreground",
                  item.isCurrentMonth && "text-foreground hover:bg-accent hover:text-accent-foreground",
                  isToday && !isSelected && "border border-[#f370a8] font-bold text-[#f370a8]",
                  isSelected &&
                    "bg-gradient-to-r from-[#f370a8] to-[#4d3085] text-white font-bold shadow-md shadow-[#f370a8]/25 scale-105 z-10 ring-2 ring-[#f370a8]/30"
                )}
              >
                {item.day}
              </button>
            )
          })}
        </div>

        {/* Footer: Direct Date Input & Close / Clear */}
        <div className="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between gap-2">
          {/* Native HTML Date Picker Fallback for Direct Typing / OS Picker */}
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="date"
              value={manualInput}
              onChange={(e) => {
                const val = e.target.value
                setManualInput(val)
                if (val) {
                  onChange(val)
                }
              }}
              className="h-7 text-[11px] font-mono px-2 rounded-lg border border-border bg-background text-foreground w-full outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              title="Ketik atau pilih tanggal langsung"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-7 px-2.5 text-[11px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted font-semibold"
          >
            Tutup
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
