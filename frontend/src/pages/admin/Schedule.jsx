import { useState, useEffect, useCallback } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getEmployees } from '../../api/employees'
import { getSchedules, createSchedule, deleteSchedule } from '../../api/schedules'
import TimePicker from '../../components/ui/TimePicker'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_MAP = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
const DAY_RMAP = Object.fromEntries(Object.entries(DAY_MAP).map(([k, v]) => [v, k]))

const PILL = {
    default: 'bg-[#3A5A40]/5 text-[#3A5A40] border-[#3A5A40]/20',
    alt:     'bg-slate-100 text-slate-700 border-slate-200',
}

function fmt12(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function hhmm(t) { return t ? t.slice(0, 5) : '' }

function getMondayDate(offset = 0) {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
    const y = monday.getFullYear()
    const m = String(monday.getMonth() + 1).padStart(2, '0')
    const d = String(monday.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function getWeekDates(offset = 0) {
    const now = new Date()
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
    return DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

const AVATAR_COLORS = ['bg-[#3A5A40]', 'bg-slate-600', 'bg-slate-700', 'bg-slate-500', 'bg-slate-800', 'bg-slate-900']
function initials(name) { return (name || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
function avatarBg(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

function Icon({ d, size = 16, className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = {
    left:  'M15.75 19.5L8.25 12l7.5-7.5',
    right: 'M8.25 4.5l7.5 7.5-7.5 7.5',
    x:     'M6 18L18 6M6 6l12 12',
    plus:  'M12 4.5v15m7.5-7.5h-15',
    trash: ['M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'],
}

function AssignModal({ employee, day, current, onSave, onClose, saving }) {
    const [start, setStart] = useState(current?.start || '09:00')
    const [end, setEnd]     = useState(current?.end || '17:00')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">{DAY_MAP[day]} — {employee.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{employee.branch?.name || 'Set the shift timings'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <Icon d={IC.x} size={15} />
                    </button>
                </div>
                <div className="px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Start Time</label>
                            <TimePicker value={start} onChange={setStart} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 block mb-1.5">End Time</label>
                            <TimePicker value={end} onChange={setEnd} />
                        </div>
                    </div>
                    {current && (
                        <button onClick={() => onSave(null)} disabled={saving}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                            <Icon d={IC.trash} size={13} /> Remove this shift
                        </button>
                    )}
                </div>
                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={() => onSave({ start, end })} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-slate-400 text-sm font-semibold text-white transition-colors">
                        {saving ? 'Saving…' : 'Save Shift'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ShiftPill({ shift, branchIdx, onClick }) {
    if (!shift) {
        return (
            <button onClick={onClick}
                className="w-full h-full min-h-[52px] flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300 hover:border-[#3A5A40] hover:text-[#3A5A40] transition-colors group">
                <Icon d={IC.plus} size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
        )
    }
    const style = branchIdx % 2 === 0 ? PILL.default : PILL.alt
    return (
        <button onClick={onClick}
            className={`w-full min-h-[52px] flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-left transition-all hover:shadow-sm hover:scale-[1.02] ${style}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#3A5A40]" />
            <span className="text-[11px] font-semibold truncate">{fmt12(shift.start)} – {fmt12(shift.end)}</span>
        </button>
    )
}

export default function SchedulePage() {
    const [weekOffset, setWeekOffset] = useState(0)
    const [employees, setEmployees]   = useState([])
    const [shifts, setShifts]         = useState({})
    const [scheduleIds, setScheduleIds] = useState({})
    const [modal, setModal]           = useState(null)
    const [branchFilter, setBranch]   = useState('All')
    const [saving, setSaving]         = useState(false)
    const [loading, setLoading]       = useState(true)

    const weekDates = getWeekDates(weekOffset)
    const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    const isToday = (date) => {
        const t = new Date()
        return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
    }

    const loadData = useCallback(() => {
        setLoading(true)
        const weekStart = getMondayDate(weekOffset)
        Promise.all([
            getEmployees({ role: 'employee' }),
            getSchedules({ week_start_date: weekStart }),
        ]).then(([empRes, schedRes]) => {
            const emps = empRes.data.data || empRes.data
            setEmployees(emps)

            const scheds = schedRes.data.data || schedRes.data
            const newShifts = {}
            const newIds = {}
            scheds.forEach(s => {
                const abbr = DAY_RMAP[s.day_of_week]
                if (!abbr) return
                if (!newShifts[s.employee_id]) newShifts[s.employee_id] = {}
                newShifts[s.employee_id][abbr] = { start: hhmm(s.shift_start), end: hhmm(s.shift_end) }
                newIds[`${s.employee_id}_${abbr}`] = s.id
            })
            setShifts(newShifts)
            setScheduleIds(newIds)
        }).catch(() => {}).finally(() => setLoading(false))
    }, [weekOffset])

    useEffect(() => { loadData() }, [loadData])

    const uniqueBranches = ['All', ...new Set(employees.map(e => e.branch?.name).filter(Boolean))]
    const filtered = branchFilter === 'All' ? employees : employees.filter(e => e.branch?.name === branchFilter)

    const handleSave = async (payload) => {
        const { empId, day } = modal
        const employee = employees.find(e => e.id === empId)
        const schedKey = `${empId}_${day}`
        const existingId = scheduleIds[schedKey]

        setSaving(true)
        try {
            if (!payload) {
                if (existingId) {
                    await deleteSchedule(existingId)
                    setShifts(prev => ({ ...prev, [empId]: { ...prev[empId], [day]: null } }))
                    setScheduleIds(prev => { const n = { ...prev }; delete n[schedKey]; return n })
                }
            } else {
                const res = await createSchedule({
                    employee_id:     empId,
                    branch_id:       employee.branch_id,
                    day_of_week:     DAY_MAP[day],
                    shift_start:     payload.start,
                    shift_end:       payload.end,
                    week_start_date: getMondayDate(weekOffset),
                })
                const newSched = res.data.data || res.data
                setShifts(prev => ({ ...prev, [empId]: { ...prev[empId], [day]: { start: payload.start, end: payload.end } } }))
                setScheduleIds(prev => ({ ...prev, [schedKey]: newSched.id }))
            }
        } catch {
            alert('Failed to save shift. Please try again.')
        }
        setSaving(false)
        setModal(null)
    }

    const totalAssigned = Object.values(shifts).reduce((acc, empDays) =>
        acc + Object.values(empDays || {}).filter(Boolean).length, 0)

    return (
        <AppShell role="admin" activePage="Schedule">
            <div className="space-y-5 pb-16">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Work Schedules</h2>
                            <p className="text-sm text-slate-400 mt-0.5">Assign shifts to employees for each day of the week.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {uniqueBranches.map(b => (
                            <button key={b} onClick={() => setBranch(b)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${branchFilter === b ? 'bg-[#3A5A40] text-white border-[#3A5A40]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                {b}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between">
                    <button onClick={() => setWeekOffset(v => v - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <Icon d={IC.left} size={16} />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">{weekLabel}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{loading ? 'Loading…' : `${totalAssigned} shifts assigned this week`}</p>
                    </div>
                    <button onClick={() => setWeekOffset(v => v + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                        <Icon d={IC.right} size={16} />
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-4 py-3 w-44">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Employee</p>
                                    </th>
                                    {DAYS.map((day, i) => (
                                        <th key={day} className="px-2 py-3 text-center">
                                            <p className={`text-xs font-semibold uppercase tracking-wider ${isToday(weekDates[i]) ? 'text-[#3A5A40]' : 'text-slate-400'}`}>{day}</p>
                                            <p className={`text-sm font-bold mt-0.5 ${isToday(weekDates[i]) ? 'text-[#3A5A40]' : 'text-slate-700'}`}>
                                                {weekDates[i].getDate()}
                                                {isToday(weekDates[i]) && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#3A5A40] inline-block mb-0.5" />}
                                            </p>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-10 text-sm text-slate-400">Loading…</td></tr>
                                ) : filtered.map((emp, idx) => (
                                    <tr key={emp.id} className={`border-b border-slate-50 ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-8 h-8 rounded-full ${avatarBg(emp.name)} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-white text-[11px] font-bold">{initials(emp.name)}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">{emp.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{emp.branch?.name?.split(' ')[0] || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {DAYS.map(day => (
                                            <td key={day} className="px-1.5 py-1.5">
                                                <ShiftPill
                                                    shift={shifts[emp.id]?.[day]}
                                                    branchIdx={idx}
                                                    onClick={() => setModal({ empId: emp.id, day, employee: emp })}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {modal && (
                <AssignModal
                    employee={modal.employee}
                    day={modal.day}
                    current={shifts[modal.empId]?.[modal.day]}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}
        </AppShell>
    )
}
