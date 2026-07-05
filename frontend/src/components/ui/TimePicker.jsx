import { useState, useRef, useEffect } from 'react'

/* ── time helpers (work in "HH:mm" 24-hour strings, matching the API) ── */
const HOURS    = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const MERIDIEM = ['AM', 'PM']
const ITEM_H   = 36
const PANEL_H  = 190

function parse24(v) {
  if (!v) return { h: '09', m: '00', ap: 'AM' }
  const [H, M] = v.split(':').map(Number)
  return {
    h: String(H % 12 || 12).padStart(2, '0'),
    m: String(M || 0).padStart(2, '0'),
    ap: H >= 12 ? 'PM' : 'AM',
  }
}
function to24(h, m, ap) {
  let H = Number(h) % 12
  if (ap === 'PM') H += 12
  return `${String(H).padStart(2, '0')}:${m}`
}
export function display12(v) {
  if (!v) return ''
  const { h, m, ap } = parse24(v)
  return `${h}:${m} ${ap}`
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  )
}

/* ── one scrollable wheel column ── */
function WheelColumn({ items, value, onChange }) {
  const ref = useRef(null)

  useEffect(() => {
    const idx = items.indexOf(value)
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleScroll = () => {
    if (!ref.current) return
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_H)))
    if (items[idx] !== value) onChange(items[idx])
  }

  const pick = (it) => ref.current?.scrollTo({ top: items.indexOf(it) * ITEM_H, behavior: 'smooth' })

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="h-[108px] w-11 overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      <div style={{ height: ITEM_H }} />
      {items.map(it => (
        <div
          key={it}
          onClick={() => pick(it)}
          className={`flex items-center justify-center snap-center cursor-pointer text-base tabular-nums select-none transition-colors
            ${it === value ? 'text-slate-900 font-bold' : 'text-slate-300'}`}
          style={{ height: ITEM_H }}
        >
          {it}
        </div>
      ))}
      <div style={{ height: ITEM_H }} />
    </div>
  )
}

/* ── reusable time picker: floats as a light dropdown over the field ── */
export default function TimePicker({ value, onChange, placeholder = 'Select time' }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel]   = useState(parse24(value))
  const [pos, setPos]   = useState(null)
  const rootRef = useRef(null)
  const btnRef  = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = () => {
    if (!open) {
      setSel(parse24(value))
      const r = btnRef.current.getBoundingClientRect()
      const openUp = r.bottom + PANEL_H + 8 > window.innerHeight
      setPos({
        left: r.left,
        width: Math.max(r.width, 200),
        top: openUp ? r.top - PANEL_H - 6 : r.bottom + 6,
      })
    }
    setOpen(o => !o)
  }
  const save = () => { onChange(to24(sel.h, sel.m, sel.ap)); setOpen(false) }

  return (
    <div ref={rootRef} className="relative">
      <button ref={btnRef} type="button" onClick={toggle}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white transition
          ${open ? 'border-teal-400 ring-2 ring-teal-200' : 'border-slate-200 hover:border-slate-300'}`}>
        <span className={value ? 'text-slate-800' : 'text-slate-300'}>{value ? display12(value) : placeholder}</span>
        <span className="text-slate-400"><ClockIcon /></span>
      </button>

      {open && pos && (
        <div className="fixed z-[70] rounded-xl border border-slate-200 bg-white shadow-xl p-3"
          style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="relative">
            <div className="flex items-stretch justify-center gap-0.5">
              <WheelColumn items={HOURS}    value={sel.h}  onChange={h  => setSel(s => ({ ...s, h }))} />
              <div className="flex items-center text-slate-300 text-base font-bold">:</div>
              <WheelColumn items={MINUTES}  value={sel.m}  onChange={m  => setSel(s => ({ ...s, m }))} />
              <WheelColumn items={MERIDIEM} value={sel.ap} onChange={ap => setSel(s => ({ ...s, ap }))} />
            </div>
            {/* center highlight band */}
            <div className="absolute inset-x-0 h-9 border-y border-slate-200 bg-slate-50/60 pointer-events-none" style={{ top: ITEM_H }} />
          </div>

          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={save}
              className="flex-1 py-2 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] text-xs font-semibold text-white transition-colors">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
