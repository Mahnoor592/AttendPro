import { useState, useEffect } from 'react'
import EmployeeShell from '../../components/layout/EmployeeShell'
import { getMySchedule } from '../../api/schedules'
import { getMyAttendance } from '../../api/attendance'
import { getMyShiftRequests, createShiftRequest } from '../../api/shiftRequests'
import DateRangePicker from '../../components/ui/DateRangePicker'

function rangeLabel(a, b) {
    if (!a) return '—'
    const s = new Date(a + 'T00:00:00')
    const e = b ? new Date(b + 'T00:00:00') : null
    const opt = { month: 'short', day: 'numeric' }
    if (!e || a === b) return s.toLocaleDateString('en-US', { ...opt, year: 'numeric' })
    return `${s.toLocaleDateString('en-US', opt)} – ${e.toLocaleDateString('en-US', { ...opt, year: 'numeric' })}`
}
function dayCount(a, b) {
    if (!a || !b) return 1
    return Math.round((new Date(b) - new Date(a)) / 86400000) + 1
}

/* ── helpers ── */
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getTodayName() { return DAYS_FULL[new Date().getDay()] }
function getMondayDate() {
    const now = new Date(); const day = now.getDay(); const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return monday.toISOString().split('T')[0]
}
function shiftTime12(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function formatTime12(ts) {
    if (!ts) return '—'
    const d = new Date(ts); const h = d.getHours()
    return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function getDateKey(ts) { return ts ? ts.split(' ')[0] : '' }
function formatDate(ts) { return ts ? new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '' }
function fmtHours(h) { if (h == null) return null; const hr = Math.floor(h); return `${hr}h ${Math.round((h - hr) * 60)}m` }
function groupByDate(logs) {
    const map = {}
    logs.forEach(log => {
        const key = getDateKey(log.timestamp)
        if (!map[key]) map[key] = { date: key, dateLabel: formatDate(log.timestamp), checkIn: null, checkOut: null, flag: null, working_hours: null }
        if (log.type === 'check_in') { map[key].checkIn = log; map[key].flag = log.flag }
        if (log.type === 'check_out') { map[key].checkOut = log; map[key].working_hours = log.working_hours }
    })
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

const FLAG = {
    on_time:         { label: 'On Time',   cls: 'bg-green-100 text-green-700' },
    late:            { label: 'Late',      cls: 'bg-amber-100 text-amber-700' },
    early_departure: { label: 'Early Out', cls: 'bg-red-100 text-red-600' },
}
const REQ = {
    pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    denied:   { label: 'Denied',   cls: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-400' },
}

function Icon({ d, size = 16, className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = { plus: 'M12 5v14M5 12h14', x: 'M6 18L18 6M6 6l12 12' }

/* ── new request modal ── */
function RequestModal({ onSubmit, onClose }) {
    const [range, setRange]   = useState({ start: null, end: null })
    const [reason, setReason] = useState('')
    const [saving, setSaving] = useState(false)
    const [err, setErr]       = useState('')

    const submit = async (e) => {
        e.preventDefault()
        if (!range.start || !range.end) { setErr('Please select a start and end date.'); return }
        if (!reason.trim()) { setErr('Please add a reason.'); return }
        setSaving(true); setErr('')
        const r = await onSubmit({ start_date: range.start, end_date: range.end, reason: reason.trim() })
        setSaving(false)
        if (r?.error) setErr(r.error)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Request Time Off</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Your manager will review this request</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Icon d={IC.x} size={15} /></button>
                </div>
                <form onSubmit={submit} className="px-5 py-4 space-y-4 overflow-y-auto">
                    {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}

                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Reason / Description</label>
                        <textarea rows={3} placeholder="Explain why you need this time off…" value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-semibold text-slate-500">Select dates</label>
                            <span className="text-xs font-semibold text-[#3A5A40]">
                                {range.start ? rangeLabel(range.start, range.end) : 'None selected'}
                            </span>
                        </div>
                        <DateRangePicker value={range} onChange={setRange} />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-slate-400 text-sm font-semibold text-white transition-colors">{saving ? 'Submitting…' : 'Submit Request'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function EmployeeWork() {
    const [tab, setTab]             = useState('week')
    const [schedules, setSchedules] = useState([])
    const [attendance, setAttendance] = useState([])
    const [requests, setRequests]   = useState([])
    const [loading, setLoading]     = useState(true)
    const [formOpen, setFormOpen]   = useState(false)

    const load = () => {
        Promise.all([getMySchedule(), getMyAttendance(), getMyShiftRequests()])
            .then(([sRes, aRes, rRes]) => {
                setSchedules(sRes.data.data || sRes.data)
                setAttendance(groupByDate((aRes.data.data || aRes.data).filter(l => l.is_valid)))
                setRequests(rRes.data.data || rRes.data)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }
    useEffect(load, [])

    const handleSubmit = async (data) => {
        try {
            await createShiftRequest(data)
            setFormOpen(false)
            load()
        } catch (err) {
            return { error: err.response?.data?.message || 'Failed to submit request.' }
        }
    }

    // this-week map
    const weekStart = getMondayDate()
    const todayName = getTodayName()
    const weekMap = {}
    schedules.filter(s => s.week_start_date === weekStart).forEach(s => {
        const abbr = Object.keys(WEEK_FULL).find(k => WEEK_FULL[k] === s.day_of_week)
        if (abbr) weekMap[abbr] = s
    })

    const TABS = [
        { key: 'week', label: 'This Week' },
        { key: 'attendance', label: 'Attendance' },
        { key: 'requests', label: 'Requests' },
    ]

    return (
        <EmployeeShell activePage="My Work">
            <div className="max-w-2xl mx-auto space-y-5">
                {/* tabs */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">Loading…</div>
                ) : (
                    <>
                        {/* THIS WEEK */}
                        {tab === 'week' && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                                {WEEK.map(abbr => {
                                    const full = WEEK_FULL[abbr]
                                    const sched = weekMap[abbr]
                                    const today = full === todayName
                                    return (
                                        <div key={abbr} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${today ? 'border-[#3A5A40]/30 bg-[#3A5A40]/5' : 'border-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${today ? 'bg-[#3A5A40] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    <span className="text-xs font-bold">{abbr}</span>
                                                </div>
                                                <p className={`text-sm font-semibold ${today ? 'text-[#3A5A40]' : 'text-slate-700'}`}>{full}{today && <span className="text-[10px] font-bold ml-1.5">TODAY</span>}</p>
                                            </div>
                                            <span className={`text-sm ${sched ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                                                {sched ? `${shiftTime12(sched.shift_start)} – ${shiftTime12(sched.shift_end)}` : 'No shift'}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* ATTENDANCE */}
                        {tab === 'attendance' && (
                            attendance.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">No attendance records yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {attendance.map(rec => {
                                        const f = FLAG[rec.flag]
                                        return (
                                            <div key={rec.date} className="bg-white border border-slate-200 rounded-2xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs font-bold text-slate-500">{rec.dateLabel}</p>
                                                    {f && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${f.cls}`}>{f.label}</span>}
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check In</p><p className={`text-sm font-semibold ${rec.checkIn ? 'text-slate-800' : 'text-slate-300'}`}>{rec.checkIn ? formatTime12(rec.checkIn.timestamp) : '—'}</p></div>
                                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check Out</p><p className={`text-sm font-semibold ${rec.checkOut ? 'text-slate-800' : 'text-slate-300'}`}>{rec.checkOut ? formatTime12(rec.checkOut.timestamp) : '—'}</p></div>
                                                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hours</p><p className={`text-sm font-semibold ${rec.working_hours != null ? 'text-[#3A5A40]' : 'text-slate-300'}`}>{rec.working_hours != null ? fmtHours(rec.working_hours) : '—'}</p></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        )}

                        {/* REQUESTS */}
                        {tab === 'requests' && (
                            <div className="space-y-3">
                                <div className="flex justify-end">
                                    <button onClick={() => setFormOpen(true)} className="flex items-center gap-1.5 bg-[#3A5A40] hover:bg-[#2f4a34] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                                        <Icon d={IC.plus} size={13} /> New Request
                                    </button>
                                </div>
                                {requests.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                                        <p className="text-sm font-semibold text-slate-400">No requests yet.</p>
                                        <p className="text-xs text-slate-300 mt-1">Tap "New Request" to submit one.</p>
                                    </div>
                                ) : requests.map(req => {
                                    const s = REQ[req.status]
                                    return (
                                        <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{rangeLabel(req.start_date, req.end_date)}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{dayCount(req.start_date, req.end_date)} day{dayCount(req.start_date, req.end_date) !== 1 ? 's' : ''} off</p>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${s.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"><p className="text-xs text-slate-500 leading-relaxed">{req.reason}</p></div>
                                            {req.response_note && (
                                                <div className={`mt-2 px-3 py-2 rounded-lg border text-xs leading-relaxed ${req.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                    <span className="font-semibold">Manager's note: </span>{req.response_note}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {formOpen && <RequestModal onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />}
        </EmployeeShell>
    )
}
