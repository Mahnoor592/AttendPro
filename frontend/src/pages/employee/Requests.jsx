import { useState, useEffect } from 'react'
import EmployeeShell from '../../components/layout/EmployeeShell'
import { getMySchedule } from '../../api/schedules'
import { getMyShiftRequests, createShiftRequest } from '../../api/shiftRequests'

const STATUS_STYLE = {
    pending:  { label: 'Pending',  bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    approved: { label: 'Approved', bg: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    denied:   { label: 'Denied',   bg: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-400'  },
}

function shiftTime12(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
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
    plus: 'M12 4.5v15m7.5-7.5h-15',
    x:    'M6 18L18 6M6 6l12 12',
}

function RequestForm({ schedules, onSubmit, onClose }) {
    const [scheduleId, setScheduleId] = useState('')
    const [reason, setReason]         = useState('')
    const [saving, setSaving]         = useState(false)
    const [err, setErr]               = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!scheduleId) { setErr('Please select a shift.'); return }
        if (!reason.trim()) { setErr('Please provide a reason.'); return }
        setSaving(true)
        setErr('')
        const result = await onSubmit({ schedule_id: Number(scheduleId), reason: reason.trim() })
        setSaving(false)
        if (result?.error) setErr(result.error)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Request Shift Change</h2>
                        <p className="text-xs text-slate-400 mt-0.5">HR will review your request</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <Icon d={IC.x} size={15} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                    {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Select Shift</label>
                        <select value={scheduleId} onChange={e => setScheduleId(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition">
                            <option value="">— Select a shift to change —</option>
                            {schedules.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.day_of_week} · {shiftTime12(s.shift_start)} – {shiftTime12(s.shift_end)} ({s.branch_name || s.week_start_date})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Reason</label>
                        <textarea rows={4} placeholder="Explain why you need a shift change…"
                            value={reason} onChange={e => setReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-teal-300 text-sm font-semibold text-white transition-colors">
                            {saving ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function EmployeeRequests() {
    const [requests, setRequests]   = useState([])
    const [schedules, setSchedules] = useState([])
    const [loading, setLoading]     = useState(true)
    const [formOpen, setFormOpen]   = useState(false)

    const loadRequests = () => {
        getMyShiftRequests()
            .then(res => setRequests(res.data.data || res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadRequests()
        getMySchedule()
            .then(res => setSchedules(res.data.data || res.data))
            .catch(() => {})
    }, [])

    const handleSubmit = async (data) => {
        try {
            await createShiftRequest(data)
            setFormOpen(false)
            loadRequests()
        } catch (err) {
            return { error: err.response?.data?.message || 'Failed to submit request.' }
        }
    }

    return (
        <EmployeeShell activePage="Requests">
            <div className="space-y-4 pb-20">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Shift Requests</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Request changes to your scheduled shifts.</p>
                    </div>
                    <button onClick={() => setFormOpen(true)}
                        className="flex items-center gap-2 bg-[#3A5A40] hover:bg-[#2f4a34] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                        <Icon d={IC.plus} size={13} />
                        New Request
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-sm text-slate-400">Loading…</div>
                ) : requests.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                        <p className="text-sm font-semibold text-slate-400">No requests yet.</p>
                        <p className="text-xs text-slate-300 mt-1">Tap "New Request" to submit one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map(req => {
                            const s = STATUS_STYLE[req.status]
                            return (
                                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {req.schedule?.day_of_week} · {shiftTime12(req.schedule?.shift_start)} – {shiftTime12(req.schedule?.shift_end)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">{req.schedule?.branch_name}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${s.bg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                            {s.label}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                        <p className="text-xs text-slate-500 leading-relaxed">{req.reason}</p>
                                    </div>
                                    {req.response_note && (
                                        <div className={`mt-2 px-3 py-2 rounded-lg border text-xs leading-relaxed ${req.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                            <span className="font-semibold">HR Note: </span>{req.response_note}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

            </div>

            {formOpen && (
                <RequestForm
                    schedules={schedules}
                    onSubmit={handleSubmit}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </EmployeeShell>
    )
}
