import { useState, useEffect, useCallback, useRef } from 'react'
import EmployeeShell from '../../components/layout/EmployeeShell'
import { getMySchedule } from '../../api/schedules'
import { getMyAttendance, checkIn, checkOut } from '../../api/attendance'
import { getMe } from '../../utils/auth'
import { updateProfile } from '../../api/profile'

/* ── helpers ── */
function useLiveClock() {
    const [time, setTime] = useState(new Date())
    useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id) }, [])
    return time
}
function pad(n) { return String(n).padStart(2, '0') }
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
function getTodayName() { return DAYS_FULL[new Date().getDay()] }
function getMondayDate() {
    const now = new Date(); const day = now.getDay(); const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return monday.toISOString().split('T')[0]
}
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEK_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
function getWeekDates() {
    const now = new Date(); const day = now.getDay(); const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return WEEK.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}
function shiftShort(t) { return t ? String(parseInt(t.split(':')[0], 10) % 12 || 12) : '' }
function isToday(ts) { return ts ? new Date(ts).toDateString() === new Date().toDateString() : false }
function formatTime12(ts) {
    if (!ts) return null
    const d = new Date(ts); const h = d.getHours()
    return `${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`
}
function shiftTime12(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}
function elapsedHours(ts) { return ts ? (Date.now() - new Date(ts).getTime()) / 3600000 : 0 }
function fmtHours(h) { const hr = Math.floor(h); return `${hr}h ${Math.round((h - hr) * 60)}m` }

async function getGPSLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    })
}
function Icon({ d, size = 15, className = '', sw = 1.75 }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = {
    pin:   ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z', 'M12 10a2 2 0 100-4 2 2 0 000 4z'],
    clock: ['M12 12l3 2', 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
    check: 'M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    mail:  ['M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75', 'M21.75 6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'],
    phone: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
    home:  'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    edit:  'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125',
    camera:['M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z', 'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z'],
    x:     'M6 18L18 6M6 6l12 12',
}

function ProfileCard({ p, onEdit }) {
    const initials = (p?.name || 'U').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const rows = [
        { icon: IC.mail,  label: 'Email',   value: p?.email },
        { icon: IC.phone, label: 'Phone',   value: p?.phone },
        { icon: IC.home,  label: 'Address', value: p?.address },
        { icon: IC.pin,   label: 'Branch',  value: p?.branch },
    ]
    return (
        <aside className="relative bg-white border border-slate-200 rounded-2xl p-6">
            <button onClick={onEdit} title="Edit profile"
                className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-semibold text-[#3A5A40] hover:bg-[#3A5A40]/5 px-2.5 py-1.5 rounded-lg transition-colors">
                <Icon d={IC.edit} size={13} /> Edit
            </button>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-slate-100"
                    style={{ backgroundColor: p?.avatar ? undefined : '#3A5A40' }}>
                    {p?.avatar
                        ? <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-2xl font-bold">{initials}</span>}
                </div>
                <p className="text-base font-bold text-slate-800 mt-3">{p?.name || 'Employee'}</p>
                <p className="text-xs font-semibold text-[#3A5A40] mt-0.5">{p?.position || 'Employee'}</p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
                {rows.map(r => (
                    <div key={r.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon d={r.icon} size={14} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-400">{r.label}</p>
                            <p className="text-sm font-medium text-slate-700 break-words">{r.value || '—'}</p>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-4 text-center">Branch is set by your admin.</p>
        </aside>
    )
}

function EditProfileModal({ p, onSave, onClose }) {
    const fileRef = useRef(null)
    const [form, setForm] = useState({ name: p?.name || '', email: p?.email || '', phone: p?.phone || '', address: p?.address || '', avatar: p?.avatar || null })
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState('')
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const initials = (form.name || 'U').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    const handleAvatar = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => set('avatar', ev.target.result)
        reader.readAsDataURL(file)
    }
    const submit = async (e) => {
        e.preventDefault()
        setSaving(true); setErr('')
        const r = await onSave(form)
        setSaving(false)
        if (r?.error) setErr(r.error)
    }
    const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col text-left">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-sm font-bold text-slate-800">Edit Profile</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Icon d={IC.x} size={15} /></button>
                </div>
                <form onSubmit={submit} className="px-5 py-4 space-y-4 overflow-y-auto">
                    {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => fileRef.current?.click()} title="Change photo"
                            className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-slate-100 group"
                            style={{ backgroundColor: form.avatar ? undefined : '#3A5A40' }}>
                            {form.avatar
                                ? <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                                : <span className="text-white text-lg font-bold">{initials}</span>}
                            <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Icon d={IC.camera} size={16} className="text-white" />
                            </span>
                        </button>
                        <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-[#3A5A40] hover:underline">Change photo</button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Full Name</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone</label>
                        <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 300 1234567" className={inputCls} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
                        <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="House #, Street, City" className={inputCls} />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-slate-400 text-sm font-semibold text-white transition-colors">{saving ? 'Saving…' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function EmployeeToday() {
    const time = useLiveClock()

    const [todaySchedule, setTodaySchedule] = useState(null)
    const [weekSchedule, setWeekSchedule]   = useState({})
    const [todayLogs, setTodayLogs]         = useState([])
    const [actionLoading, setActionLoading] = useState(false)
    const [statusMsg, setStatusMsg]         = useState('')
    const [errorMsg, setErrorMsg]           = useState('')
    const [profile, setProfile]             = useState(() => { try { return JSON.parse(localStorage.getItem('current_user')) || {} } catch { return {} } })
    const [editOpen, setEditOpen]           = useState(false)

    useEffect(() => { getMe().then(p => { if (p) setProfile(p) }) }, [])

    const handleSaveProfile = async (form) => {
        try {
            const res = await updateProfile({ name: form.name, email: form.email, phone: form.phone, address: form.address, avatar: form.avatar })
            setProfile(res.data)
            localStorage.setItem('current_user', JSON.stringify(res.data))
            setEditOpen(false)
        } catch (e) {
            return { error: e.response?.data?.message || e.response?.data?.errors?.email?.[0] || 'Failed to save profile.' }
        }
    }

    const loadData = useCallback(() => {
        const todayName = getTodayName()
        const weekStart = getMondayDate()
        getMySchedule().then(res => {
            const scheds = res.data.data || res.data
            const thisWeek = scheds.filter(s => s.week_start_date === weekStart)
            const map = {}
            thisWeek.forEach(s => {
                const abbr = Object.keys(WEEK_FULL).find(k => WEEK_FULL[k] === s.day_of_week)
                if (abbr) map[abbr] = s
            })
            setWeekSchedule(map)
            setTodaySchedule(thisWeek.find(s => s.day_of_week === todayName)
                || scheds.find(s => s.day_of_week === todayName) || null)
        }).catch(() => {})
        getMyAttendance().then(res => {
            const logs = (res.data.data || res.data)
                .filter(l => l.is_valid && isToday(l.timestamp))
                .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
            setTodayLogs(logs)
        }).catch(() => {})
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleClockAction = async () => {
        setErrorMsg(''); setStatusMsg('')
        const openNow = todayLogs.filter(l => l.type === 'check_in').length > todayLogs.filter(l => l.type === 'check_out').length
        // No shift today → can't check in. Tell the employee instead of starting GPS.
        if (!openNow && !todaySchedule) {
            setErrorMsg('You have no shift scheduled today, so check-in is not allowed.')
            return
        }
        setActionLoading(true)
        try {
            const { lat, lng } = await getGPSLocation()
            // Address is set server-side from the branch, so each office's logs show its own address.
            if (!openNow) {
                const res = await checkIn({ gps_lat: lat, gps_lng: lng })
                if (res.data?.log) setTodayLogs(prev => [...prev, res.data.log])
                setStatusMsg(res.data?.log?.readable_address ? `Checked in — ${res.data.log.readable_address}` : 'Checked in.')
            } else {
                const res = await checkOut({ gps_lat: lat, gps_lng: lng })
                if (res.data?.log) setTodayLogs(prev => [...prev, res.data.log])
                setStatusMsg(res.data?.log?.readable_address ? `Checked out — ${res.data.log.readable_address}` : 'Checked out.')
            }
            loadData()
        } catch (err) {
            if (err.code === 1) setErrorMsg('Location access denied. Please allow location in your browser.')
            else setErrorMsg(err.response?.data?.message || err.message || 'Something went wrong.')
        }
        setActionLoading(false)
    }

    const checkIns  = todayLogs.filter(l => l.type === 'check_in')
    const checkOuts = todayLogs.filter(l => l.type === 'check_out')
    const currentlyIn  = checkIns.length > checkOuts.length
    const lastCheckIn  = checkIns[checkIns.length - 1] || null
    const lastCheckOut = checkOuts[checkOuts.length - 1] || null
    const completedHours = checkOuts.reduce((s, l) => s + (l.working_hours || 0), 0)
    const hoursWorked = completedHours + (currentlyIn && lastCheckIn ? elapsedHours(lastCheckIn.timestamp) : 0)
    const hasActivity = todayLogs.length > 0
    const firstFlag = checkIns[0]?.flag
    const pct = Math.min((hoursWorked / 8) * 100, 100)

    const hh = pad(time.getHours() % 12 || 12), mm = pad(time.getMinutes()), ss = pad(time.getSeconds())
    const ampm = time.getHours() >= 12 ? 'PM' : 'AM'
    const greeting = time.getHours() < 12 ? 'Good morning' : time.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    const firstName = (() => { try { return JSON.parse(localStorage.getItem('current_user'))?.name?.split(' ')[0] } catch { return '' } })() || ''
    const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    const branchName = todaySchedule?.branch_name || todaySchedule?.branch?.name || 'Your Branch'
    const weekDates = getWeekDates()
    const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

    return (
        <EmployeeShell activePage="Clock In">
            <div className="max-w-5xl mx-auto pt-6 space-y-6">
              <div className="grid lg:grid-cols-2 gap-6 items-stretch">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center">

                {/* greeting + clock */}
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{greeting}{firstName ? `, ${firstName}` : ''} 👋</h1>
                <p className="text-sm text-slate-400 mt-2 flex items-center gap-2 tabular-nums">
                    <span className="font-semibold text-slate-500">{hh}:{mm}<span className="text-slate-300">:{ss}</span> {ampm}</span>
                    <span className="text-slate-300">·</span>
                    <span>{dateStr}</span>
                </p>

                {/* today's shift */}
                <div className="mt-5 inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                    {todaySchedule ? (
                        <>
                            <Icon d={IC.pin} size={15} className="text-[#3A5A40]" sw={1.9} />
                            <span className="text-sm font-semibold text-slate-700">{branchName}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-sm text-slate-500">{shiftTime12(todaySchedule.shift_start)} – {shiftTime12(todaySchedule.shift_end)}</span>
                        </>
                    ) : (
                        <span className="text-sm text-slate-400">No shift scheduled for today</span>
                    )}
                </div>

                {/* the big button */}
                <div className="relative grid place-items-center my-10">
                    {!currentlyIn && (
                        <>
                            <span className="absolute w-56 h-56 rounded-full border-2 border-[#3A5A40]/25 animate-ping motion-reduce:hidden" />
                            <span className="absolute w-56 h-56 rounded-full border-2 border-[#3A5A40]/15 animate-ping [animation-delay:1.2s] motion-reduce:hidden" />
                        </>
                    )}
                    <button onClick={handleClockAction} disabled={actionLoading}
                        className={`relative z-10 w-56 h-56 rounded-full text-white flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all duration-150 select-none
                            ${currentlyIn
                                ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-[0_18px_45px_rgba(220,38,38,.4)]'
                                : 'bg-gradient-to-br from-[#6fa06a] to-[#3A5A40] shadow-[0_18px_45px_rgba(58,90,64,.45)]'}
                            disabled:opacity-60 disabled:cursor-not-allowed`}>
                        {actionLoading
                            ? <span className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            : <>
                                <Icon d={IC.clock} size={40} sw={1.5} />
                                <span className="text-xl font-bold tracking-[.14em]">{currentlyIn ? 'CHECK OUT' : 'CHECK IN'}</span>
                              </>}
                    </button>
                </div>

                {/* status */}
                {hasActivity ? (
                    <div className="w-full max-w-sm">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <span className={`w-2.5 h-2.5 rounded-full ${currentlyIn ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className="text-sm font-semibold text-slate-700">
                                {currentlyIn ? `Working since ${formatTime12(lastCheckIn.timestamp)}` : `Last checked out at ${formatTime12(lastCheckOut?.timestamp)}`}
                            </span>
                            {currentlyIn && firstFlag && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${firstFlag === 'on_time' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {firstFlag === 'on_time' ? 'On Time' : 'Late'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                            <span>Hours today</span>
                            <span><b className="text-slate-600">{fmtHours(hoursWorked)}</b> / 8h</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#3A5A40] to-[#6fa06a] transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                        {!currentlyIn && (
                            <p className="text-xs text-slate-400 mt-3">You can check in again — your hours keep adding up.</p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400">
                        {todaySchedule ? "You haven't checked in yet — tap the button to start your day." : 'Enjoy your day off.'}
                    </p>
                )}

                {/* messages */}
                {statusMsg && (
                    <div className="mt-5 w-full max-w-sm bg-[#3A5A40]/5 border border-[#3A5A40]/15 rounded-xl px-4 py-2.5 flex items-start gap-2.5 text-left">
                        <Icon d={IC.pin} size={15} className="text-[#3A5A40] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#3A5A40] font-medium">{statusMsg}</p>
                    </div>
                )}
                {errorMsg && (
                    <div className="mt-5 w-full max-w-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-left">
                        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                    </div>
                )}
                </div>

                <ProfileCard p={profile} onEdit={() => setEditOpen(true)} />
              </div>

              {/* This Week — full width */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">This Week</p>
                <div className="grid grid-cols-7 gap-2">
                    {WEEK.map((abbr, i) => {
                        const sched = weekSchedule[abbr]
                        const today = i === todayIdx
                        return (
                            <div key={abbr} className={`rounded-xl border px-1 py-3 text-center ${today ? 'border-[#3A5A40] ring-1 ring-[#3A5A40]/20 bg-white' : 'border-slate-200 bg-slate-50/60'}`}>
                                <p className={`text-[10px] font-extrabold uppercase tracking-wider ${today ? 'text-[#3A5A40]' : 'text-slate-400'}`}>{abbr}</p>
                                <p className={`text-[15px] font-extrabold mt-0.5 ${today ? 'text-[#3A5A40]' : 'text-slate-700'}`}>{weekDates[i].getDate()}</p>
                                {sched
                                    ? <p className="text-[9px] font-bold mt-1.5 px-1 py-0.5 rounded bg-[#3A5A40]/10 text-[#3A5A40]">{shiftShort(sched.shift_start)}–{shiftShort(sched.shift_end)}</p>
                                    : <p className="text-[9px] font-bold mt-1.5 text-slate-300">Off</p>}
                            </div>
                        )
                    })}
                </div>
              </div>
            </div>
            {editOpen && <EditProfileModal p={profile} onSave={handleSaveProfile} onClose={() => setEditOpen(false)} />}
        </EmployeeShell>
    )
}
