import { useState, useEffect } from 'react'
import EmployeeShell from '../../components/layout/EmployeeShell'
import { getMySchedule } from '../../api/schedules'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ABBR   = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' }

function shiftTime12(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatWeekRange(weekStart) {
    if (!weekStart) return ''
    const start = new Date(weekStart)
    const end   = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function getTodayName() {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

function getMondayDate() {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return monday.toISOString().split('T')[0]
}

export default function EmployeeSchedule() {
    const [weekGroups, setWeekGroups] = useState([])
    const [loading, setLoading]       = useState(true)
    const [activeWeek, setActiveWeek] = useState(null)

    useEffect(() => {
        getMySchedule()
            .then(res => {
                const scheds = res.data.data || res.data
                const grouped = {}
                scheds.forEach(s => {
                    if (!grouped[s.week_start_date]) grouped[s.week_start_date] = []
                    grouped[s.week_start_date].push(s)
                })
                const sorted = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
                setWeekGroups(sorted)
                if (sorted.length > 0) setActiveWeek(sorted[0][0])
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const todayName = getTodayName()
    const thisWeek  = getMondayDate()

    const activeScheds = weekGroups.find(([w]) => w === activeWeek)?.[1] || []
    const schedMap = Object.fromEntries(activeScheds.map(s => [s.day_of_week, s]))

    return (
        <EmployeeShell activePage="Schedule">
            <div className="space-y-4 pb-20">

                <div>
                    <h1 className="text-xl font-bold text-slate-800">My Schedule</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Your assigned shifts (read-only).</p>
                </div>

                {/* Week selector */}
                {weekGroups.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                        {weekGroups.map(([w]) => (
                            <button key={w} onClick={() => setActiveWeek(w)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${activeWeek === w ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                {w === thisWeek ? 'This Week' : formatWeekRange(w)}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">Loading…</div>
                ) : weekGroups.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                        <p className="text-sm font-semibold text-slate-400">No schedule assigned yet.</p>
                        <p className="text-xs text-slate-300 mt-1">Your HR will assign shifts here.</p>
                    </div>
                ) : (
                    <>
                        {activeWeek && (
                            <p className="text-xs text-slate-500 font-medium">{formatWeekRange(activeWeek)}</p>
                        )}
                        <div className="space-y-2">
                            {DAYS_ORDER.map(day => {
                                const sched = schedMap[day]
                                const isToday = day === todayName && activeWeek === thisWeek
                                return (
                                    <div key={day}
                                        className={`bg-white border rounded-2xl p-4 shadow-sm transition-colors ${isToday ? 'border-teal-300 ring-1 ring-teal-200' : 'border-slate-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isToday ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    <span className="text-xs font-bold">{DAY_ABBR[day]}</span>
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-semibold ${isToday ? 'text-teal-700' : 'text-slate-700'}`}>
                                                        {day} {isToday && <span className="text-[10px] text-teal-500 font-bold ml-1">TODAY</span>}
                                                    </p>
                                                    {sched ? (
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {shiftTime12(sched.shift_start)} – {shiftTime12(sched.shift_end)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-slate-300 mt-0.5">No shift</p>
                                                    )}
                                                </div>
                                            </div>
                                            {sched && (
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-slate-600">{sched.branch_name || '—'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </EmployeeShell>
    )
}
