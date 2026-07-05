import { useState } from 'react'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function iso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function parse(s) { return s ? new Date(s + 'T00:00:00') : null }
function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function stripTime(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

function Arrow({ dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

export default function DateRangePicker({ value = {}, onChange }) {
  const start = parse(value.start)
  const end = parse(value.end)
  const [view, setView] = useState(() => {
    const base = start || new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const pick = (day) => {
    if (!start || (start && end)) {
      onChange({ start: iso(day), end: null })
    } else if (day < start) {
      onChange({ start: iso(day), end: iso(start) })
    } else {
      onChange({ start: iso(start), end: iso(day) })
    }
  }

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const gridStart = new Date(first)
  gridStart.setDate(1 - first.getDay())
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d })

  const s = start ? stripTime(start) : null
  const e = end ? stripTime(end) : null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <Arrow dir="left" />
        </button>
        <p className="text-sm font-bold text-slate-800">{MONTHS[view.getMonth()]} {view.getFullYear()}</p>
        <button type="button" onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <Arrow dir="right" />
        </button>
      </div>

      {/* weekday row */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d, i) => <div key={i} className="h-7 flex items-center justify-center text-[11px] font-bold text-[#3A5A40]">{d}</div>)}
      </div>

      {/* days */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === view.getMonth()
          const cur = stripTime(d)
          const isStart = sameDay(cur, s)
          const isEnd = sameDay(cur, e)
          const between = s && e && cur > s && cur < e
          const endpoint = isStart || isEnd
          return (
            <div key={i} className={`h-9 flex items-center justify-center ${between ? 'bg-[#3A5A40]/10' : ''} ${isStart && e ? 'rounded-l-full bg-[#3A5A40]/10' : ''} ${isEnd && s ? 'rounded-r-full bg-[#3A5A40]/10' : ''}`}>
              <button type="button" onClick={() => pick(cur)}
                className={`w-9 h-9 rounded-full text-sm flex items-center justify-center transition-colors
                  ${endpoint ? 'bg-[#3A5A40] text-white font-bold'
                    : between ? 'text-slate-700 font-medium'
                    : inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}`}>
                {d.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
