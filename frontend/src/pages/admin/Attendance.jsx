import { useState, useEffect } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getAttendance } from '../../api/attendance'

const STATUS_STYLE = {
    on_time:         { label: 'On Time',   color: '#16a34a', badge: 'bg-green-500 text-white'  },
    late:            { label: 'Late',      color: '#d97706', badge: 'bg-amber-400 text-white'  },
    early_departure: { label: 'Early Out', color: '#ea580c', badge: 'bg-orange-500 text-white' },
}

const AVATAR_COLORS = ['#134e4a', '#1e3a5f', '#4a1942', '#3b2f06', '#1a3a2a', '#3f1e2e']
function initials(name) { return (name || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
function avatarColor(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

function formatTime(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatDate(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getDateOnly(ts) {
    if (!ts) return ''
    return ts.split(' ')[0]
}

function fmtHours(h) {
    if (h == null) return '—'
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    return `${hrs}h ${mins}m`
}

function groupLogsByEmployeeAndDate(logs) {
    const map = {}
    logs.forEach(log => {
        const date = getDateOnly(log.timestamp)
        const key = `${log.employee_id}_${date}`
        if (!map[key]) {
            map[key] = {
                id: key,
                employee_id: log.employee_id,
                name: log.employee_name || 'Unknown',
                branch: log.branch_name || '—',
                date,
                dateLabel: formatDate(log.timestamp),
                checkIn: null, checkOut: null,
                flag: null, working_hours: null,
            }
        }
        if (log.type === 'check_in') {
            map[key].checkIn = formatTime(log.timestamp)
            map[key].flag = log.flag
        }
        if (log.type === 'check_out') {
            map[key].checkOut = formatTime(log.timestamp)
            map[key].working_hours = log.working_hours
            if (!map[key].flag) map[key].flag = log.flag
        }
    })
    return Object.values(map)
}

function Icon({ d, size = 16, className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = {
    search:   'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    x:        'M6 18L18 6M6 6l12 12',
}

const COL = 'grid grid-cols-[1.8fr_1fr_1fr_1fr_1.5fr]'

export default function AttendancePage() {
    const [records, setRecords]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [search, setSearch]     = useState('')
    const [flag, setFlag]         = useState('all')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo]     = useState('')

    useEffect(() => {
        setLoading(true)
        const params = {}
        if (dateFrom) params.date_from = dateFrom
        if (dateTo)   params.date_to   = dateTo
        if (flag !== 'all') params.flag = flag

        getAttendance(params)
            .then(res => {
                const raw = res.data.data || res.data
                // Rejected GPS check-in attempts (is_valid=false) belong in the anomaly feed,
                // not the attendance report — exclude them so they don't hide the real record.
                const logs = raw.filter(l => l.type !== 'check_in' || l.is_valid)
                setRecords(groupLogsByEmployeeAndDate(logs))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [dateFrom, dateTo, flag])

    const filtered = records.filter(r => {
        const q = search.toLowerCase()
        return !q || r.name.toLowerCase().includes(q) || r.branch.toLowerCase().includes(q)
    })

    const dates = [...new Set(filtered.map(r => r.date))].sort((a, b) => b.localeCompare(a))
    const grouped = dates.map(date => ({
        date,
        label: filtered.find(r => r.date === date)?.dateLabel || date,
        records: filtered.filter(r => r.date === date),
    }))

    const todayStr = new Date().toISOString().split('T')[0]
    const todayRecs = records.filter(r => r.date === todayStr)
    const lateNum   = todayRecs.filter(r => r.flag === 'late').length
    const earlyNum  = todayRecs.filter(r => r.flag === 'early_departure').length

    const hasFilters = search || flag !== 'all' || dateFrom || dateTo

    return (
        <AppShell role="admin" activePage="Attendance">
            <div className="flex flex-col gap-5 pb-16">

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Attendance</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Check-in and check-out log across all branches.</p>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="bg-white rounded-2xl border-2 border-[#5B8C5A]/25 px-7 py-5">
                    <div className="flex items-center gap-10">
                        {[
                            { num: todayRecs.length,  label: "Today's Records" },
                            { num: lateNum,            label: 'Late Today'     },
                            { num: earlyNum,           label: 'Early Departure'},
                        ].map((s, i) => (
                            <div key={i} className={i > 0 ? 'pl-10 border-l border-slate-100' : ''}>
                                <span className="text-3xl font-bold text-slate-800 tabular-nums">{s.num}</span>
                                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Icon d={IC.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]/20 focus:border-[#5B8C5A] transition placeholder:text-slate-300" />
                    </div>
                    <select value={flag} onChange={e => setFlag(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]/20 cursor-pointer">
                        <option value="all">All Status</option>
                        <option value="on_time">On Time</option>
                        <option value="late">Late</option>
                        <option value="early_departure">Early Out</option>
                    </select>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]/20 cursor-pointer" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#5B8C5A]/20 cursor-pointer" />
                    {hasFilters && (
                        <button onClick={() => { setSearch(''); setFlag('all'); setDateFrom(''); setDateTo('') }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                            <Icon d={IC.x} size={12} /> Clear
                        </button>
                    )}
                </div>

                {/* Table area */}
                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center text-sm text-slate-400">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center text-sm text-slate-400">No records match your filters.</div>
                ) : (
                    <div className="space-y-6">
                        {grouped.map(({ label, records: recs }) => (
                            <div key={label}>
                                <p className="text-sm font-medium text-slate-500 mb-3">{label}</p>
                                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                    style={{ borderLeft: '3px solid #5B8C5A' }}>
                                    <div className={`${COL} gap-4 px-6 py-3 border-b border-slate-100`}>
                                        {['Member', 'Check In', 'Check Out', 'Status', 'Hours Worked'].map(h => (
                                            <p key={h} className="text-xs font-semibold text-slate-400 tracking-wide">{h}</p>
                                        ))}
                                    </div>
                                    {recs.map((rec, i) => {
                                        const s = STATUS_STYLE[rec.flag]
                                        return (
                                            <div key={rec.id}
                                                className={`${COL} gap-4 items-center px-6 py-4 hover:bg-slate-50/60 transition-colors ${i < recs.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                                                        style={{ backgroundColor: avatarColor(rec.name) }}>
                                                        {initials(rec.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-700 truncate">{rec.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{rec.branch}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-medium tabular-nums ${rec.checkIn ? 'text-slate-600' : 'text-slate-300'}`}>{rec.checkIn || '—'}</p>
                                                <p className={`text-sm font-medium tabular-nums ${rec.checkOut ? 'text-slate-600' : 'text-slate-300'}`}>{rec.checkOut || '—'}</p>
                                                <div>
                                                    {s
                                                        ? <span className={`text-xs font-semibold py-1.5 px-3 rounded-lg ${s.badge}`}>{s.label}</span>
                                                        : <span className="text-xs text-slate-300">—</span>
                                                    }
                                                </div>
                                                <p className={`text-sm font-medium ${rec.working_hours != null ? 'text-slate-600' : 'text-slate-300'}`}>
                                                    {fmtHours(rec.working_hours)}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-slate-400 text-center pb-2">
                            {filtered.length} records across {grouped.length} day{grouped.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
