import { useState, useEffect } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getDashboard } from '../../api/dashboard'

const STAT_META = [
    { label: 'Total Employees', key: 'total',   sub: 'active employees',          dot: 'bg-[#1a2e2a]', iconBg: 'bg-slate-100', iconColor: 'text-[#1a2e2a]',  icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
    { label: 'Present Now',     key: 'present', sub: 'checked in today',           dot: 'bg-green-500', iconBg: 'bg-green-50', iconColor: 'text-green-600', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Late Today',      key: 'late',    sub: 'checked in after shift start',dot: 'bg-amber-400', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Absent',          key: 'absent',  sub: 'no check-in recorded',        dot: 'bg-red-400',   iconBg: 'bg-red-50',   iconColor: 'text-red-500',   icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
]

const FLAG = {
    on_time:         { dot: 'bg-green-500', label: 'On Time'   },
    late:            { dot: 'bg-amber-400', label: 'Late'      },
    early_departure: { dot: 'bg-red-400',   label: 'Early Out' },
}

const AVATAR_COLORS = ['bg-[#1a2e2a]', 'bg-slate-600', 'bg-slate-700', 'bg-slate-500', 'bg-slate-800', 'bg-slate-900']
function initials(name) { return (name || 'U').split(' ').map(n => n[0]).join('') }
function avatarColor(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

function formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

function StatCard({ label, value, sub, dot, icon, iconBg, iconColor }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                        className={iconColor}>
                        <path d={icon} />
                    </svg>
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
            </div>
            <p className="text-3xl font-bold tabular-nums text-slate-800">{value ?? '—'}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
            <p className="text-xs mt-0.5 text-slate-400">{sub}</p>
        </div>
    )
}

function ActivityRow({ item }) {
    const f = FLAG[item.flag] || FLAG.on_time
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <div className={`w-8 h-8 rounded-full ${avatarColor(item.name)} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-[11px] font-bold">{initials(item.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-400">{item.action}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 w-20 justify-end">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.dot}`} />
                {f.label}
            </span>
            <span className="text-xs text-slate-400 w-14 text-right flex-shrink-0">{item.time}</span>
        </div>
    )
}

export default function AdminToday() {
    const [stats, setStats]       = useState({ total: 0, present: 0, late: 0, absent: 0 })
    const [logs, setLogs]         = useState([])
    const [loading, setLoading]   = useState(true)

    useEffect(() => {
        const load = () => getDashboard().then(res => {
            const d = res.data
            setStats({ total: d.total, present: d.present, late: d.late, absent: d.absent })
            setLogs((d.recent_logs || []).map(l => ({
                name:   l.employee_name || 'Unknown',
                action: l.type === 'check_in' ? 'Check In' : 'Check Out',
                time:   formatTime(l.timestamp),
                flag:   l.flag || 'on_time',
            })))
        }).catch(() => {})

        load().finally(() => setLoading(false))
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [])

    return (
        <AppShell role="admin" activePage="Today">
            <div className="space-y-6 pb-16">

                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Today's Overview</h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {loading ? 'Loading…' : "Here's what's happening at your offices today."}
                        </p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-4">
                    {STAT_META.map(s => (
                        <StatCard key={s.label} {...s} value={stats[s.key]} />
                    ))}
                </div>

                {/* Activity Feed */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Today's Activity</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Real-time check-ins & check-outs</p>
                        </div>
                        <span className="text-xs text-slate-400">{stats.present} check-ins so far</span>
                    </div>
                    {logs.length === 0
                        ? <p className="text-xs text-slate-400 text-center py-6">{loading ? 'Loading…' : 'No activity recorded today'}</p>
                        : <div>{logs.map((a, i) => <ActivityRow key={i} item={a} />)}</div>
                    }
                </div>

            </div>
        </AppShell>
    )
}
