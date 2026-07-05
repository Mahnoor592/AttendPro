import { useState, useEffect } from 'react'
import EmployeeShell from '../../components/layout/EmployeeShell'
import { getMyAttendance } from '../../api/attendance'

const FLAG_STYLE = {
    on_time:         { label: 'On Time',   bg: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
    late:            { label: 'Late',      bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  },
    early_departure: { label: 'Early Out', bg: 'bg-red-100 text-red-600',     dot: 'bg-red-400'    },
}

function formatDate(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime12(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

function getDateKey(ts) {
    return ts ? ts.split(' ')[0] : ''
}

function fmtHours(h) {
    if (h == null) return null
    const hrs = Math.floor(h)
    const mins = Math.round((h - hrs) * 60)
    return `${hrs}h ${mins}m`
}

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

export default function EmployeeAttendance() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyAttendance()
            .then(res => {
                const logs = res.data.data || res.data
                setRecords(groupByDate(logs.filter(l => l.is_valid)))
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    return (
        <EmployeeShell activePage="Attendance">
            <div className="space-y-4 pb-20">

                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Attendance</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Your personal check-in and check-out history.</p>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">Loading…</div>
                ) : records.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">No attendance records yet.</div>
                ) : (
                    <div className="space-y-3">
                        {records.map(rec => {
                            const f = FLAG_STYLE[rec.flag]
                            return (
                                <div key={rec.date} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-slate-500">{rec.dateLabel}</p>
                                        {f && (
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${f.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`} />
                                                {f.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check In</p>
                                            <p className={`text-sm font-semibold ${rec.checkIn ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {rec.checkIn ? formatTime12(rec.checkIn.timestamp) : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check Out</p>
                                            <p className={`text-sm font-semibold ${rec.checkOut ? 'text-slate-800' : 'text-slate-300'}`}>
                                                {rec.checkOut ? formatTime12(rec.checkOut.timestamp) : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hours</p>
                                            <p className={`text-sm font-semibold ${rec.working_hours != null ? 'text-teal-600' : 'text-slate-300'}`}>
                                                {fmtHours(rec.working_hours) || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    {rec.checkIn?.readable_address && (
                                        <p className="text-[11px] text-slate-400 mt-2.5 truncate">{rec.checkIn.readable_address}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </EmployeeShell>
    )
}
