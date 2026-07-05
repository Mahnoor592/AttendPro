import { useState, useEffect } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getShiftRequests, decideShiftRequest } from '../../api/shiftRequests'

const STATUS_STYLE = {
    pending:  { label: 'Pending',  bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    approved: { label: 'Approved', bg: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    denied:   { label: 'Denied',   bg: 'bg-red-50   text-red-600   border-red-200',   dot: 'bg-red-400'  },
}

const AVATAR_COLORS = ['bg-[#1a2e2a]', 'bg-slate-600', 'bg-slate-700', 'bg-slate-500', 'bg-slate-800', 'bg-slate-900']
function initials(name) { return (name || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
function avatarBg(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

function rangeLabel(a, b) {
    if (!a) return '—'
    const s = new Date(a + 'T00:00:00')
    const e = b ? new Date(b + 'T00:00:00') : null
    const opt = { month: 'short', day: 'numeric' }
    if (!e || a === b) return s.toLocaleDateString('en-US', { ...opt, year: 'numeric' })
    return `${s.toLocaleDateString('en-US', opt)} – ${e.toLocaleDateString('en-US', { ...opt, year: 'numeric' })}`
}
function dayCount(a, b) { if (!a || !b) return 1; return Math.round((new Date(b) - new Date(a)) / 86400000) + 1 }
function daysLabel(a, b) { const n = dayCount(a, b); return `${n} day${n !== 1 ? 's' : ''} off` }

function Icon({ d, size = 16, className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = {
    check:  'M4.5 12.75l6 6 9-13.5',
    x:      'M6 18L18 6M6 6l12 12',
    arrow:  'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3',
    inbox:  'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z',
}

function DenyModal({ request, onDeny, onClose }) {
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)

    const handleDeny = async () => {
        setSaving(true)
        await onDeny(request.id, note)
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-base font-bold text-slate-800 mb-1">Deny Request</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Provide a reason for <span className="font-semibold text-slate-700">{request.employee_name}</span>.
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 mb-4 text-xs text-slate-600">
                    {rangeLabel(request.start_date, request.end_date)} · {daysLabel(request.start_date, request.end_date)}
                </div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for denial</label>
                <textarea rows={3} placeholder="e.g. Insufficient coverage on that day…"
                    value={note} onChange={e => setNote(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition placeholder:text-slate-300" />
                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleDeny} disabled={saving} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors">
                        {saving ? 'Denying…' : 'Deny Request'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function DetailPanel({ req, onApprove, onOpenDeny, approving }) {
    const s = STATUS_STYLE[req.status]
    const isPending = req.status === 'pending'

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="px-7 pt-7 pb-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${avatarBg(req.employee_name)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-sm font-bold">{initials(req.employee_name)}</span>
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">{req.employee_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Time-off request</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
                {/* Requested dates */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Requested Dates</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-sm font-bold text-slate-700">{rangeLabel(req.start_date, req.end_date)}</p>
                        <p className="text-xs text-slate-500 mt-1">{daysLabel(req.start_date, req.end_date)}</p>
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Employee's Reason</p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
                        <p className="text-sm text-slate-600 leading-relaxed">{req.reason}</p>
                    </div>
                </div>

                {/* Response note */}
                {!isPending && req.response_note && (
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {req.status === 'approved' ? 'Approval Note' : 'Denial Reason'}
                        </p>
                        <div className={`rounded-xl px-4 py-3.5 border ${req.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className={`text-sm leading-relaxed ${req.status === 'approved' ? 'text-green-700' : 'text-red-600'}`}>{req.response_note}</p>
                            {req.reviewer_name && <p className="text-xs text-slate-400 mt-2">by {req.reviewer_name}</p>}
                        </div>
                    </div>
                )}
            </div>

            {isPending && (
                <div className="px-7 py-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
                    <button onClick={() => onApprove(req.id)} disabled={approving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3A5A40] text-white text-sm font-semibold hover:bg-[#2f4a34] disabled:bg-slate-400 transition-colors">
                        <Icon d={IC.check} size={14} />
                        {approving ? 'Approving…' : 'Approve'}
                    </button>
                    <button onClick={() => onOpenDeny(req)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Icon d={IC.x} size={14} /> Deny
                    </button>
                </div>
            )}
        </div>
    )
}

export default function ShiftRequestsPage() {
    const [requests, setRequests]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [tab, setTab]               = useState('All')
    const [selected, setSelected]     = useState(null)
    const [denyTarget, setDenyTarget] = useState(null)
    const [approving, setApproving]   = useState(false)

    const load = () => {
        setLoading(true)
        getShiftRequests()
            .then(res => setRequests(res.data.data || res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }
    useEffect(load, [])

    const tabs = ['All', 'Pending', 'Approved', 'Denied']
    const counts = {
        All:      requests.length,
        Pending:  requests.filter(r => r.status === 'pending').length,
        Approved: requests.filter(r => r.status === 'approved').length,
        Denied:   requests.filter(r => r.status === 'denied').length,
    }

    const filtered = tab === 'All' ? requests : requests.filter(r => r.status === tab.toLowerCase())

    const handleApprove = async (id) => {
        setApproving(true)
        try {
            await decideShiftRequest(id, { status: 'approved', response_note: 'Approved.' })
            load()
            setSelected(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve.')
        }
        setApproving(false)
    }

    const handleDeny = async (id, note) => {
        try {
            await decideShiftRequest(id, { status: 'denied', response_note: note || 'Denied.' })
            load()
            setDenyTarget(null)
            setSelected(null)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deny.')
        }
    }

    const activeReq = selected ? requests.find(r => r.id === selected.id) : null

    return (
        <AppShell role="admin" activePage="Shift Requests">
            <div className="flex flex-col gap-5 h-[calc(100vh-3.5rem)] pb-4">

                <div className="flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Shift Requests</h2>
                            <p className="text-sm text-slate-400 mt-0.5">Review and respond to employee shift change requests.</p>
                        </div>
                    </div>
                    {counts.Pending > 0 && (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {counts.Pending} pending review
                        </span>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t}
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t ? 'bg-[#1a2e2a]/10 text-[#1a2e2a]' : 'bg-slate-200 text-slate-500'}`}>{counts[t]}</span>
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex gap-4 flex-1 min-h-0">
                    <div className={`bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden transition-all duration-300 ${selected ? 'w-80 flex-shrink-0' : 'flex-1'}`}>
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No {tab.toLowerCase()} requests.</div>
                        ) : filtered.map(req => {
                            const s = STATUS_STYLE[req.status]
                            const isActive = selected?.id === req.id
                            return (
                                <button key={req.id} onClick={() => setSelected(req)}
                                    className={`w-full text-left border-b border-slate-50 last:border-0 transition-colors flex items-center gap-3
                                        ${isActive ? 'bg-slate-900 border-l-[3px] border-l-black pl-3' : 'hover:bg-slate-50 pl-4'}
                                        ${selected ? 'px-3 py-3' : 'px-5 py-4'}`}>
                                    <div className={`rounded-full ${avatarBg(req.employee_name)} flex items-center justify-center flex-shrink-0 ${selected ? 'w-7 h-7' : 'w-9 h-9'}`}>
                                        <span className={`text-white font-bold ${selected ? 'text-[9px]' : 'text-xs'}`}>{initials(req.employee_name)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className={`font-bold text-slate-800 truncate ${selected ? 'text-xs' : 'text-sm'} ${isActive ? 'text-white' : ''}`}>{req.employee_name}</p>
                                        </div>
                                        <p className={`text-slate-500 truncate ${selected ? 'text-[10px]' : 'text-xs'} ${isActive ? 'text-slate-300' : ''}`}>
                                            {rangeLabel(req.start_date, req.end_date)}
                                        </p>
                                    </div>
                                    {selected ? (
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                                    ) : (
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                            {s.label}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {activeReq && (
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <DetailPanel req={activeReq} onApprove={handleApprove} onOpenDeny={setDenyTarget} approving={approving} />
                        </div>
                    )}
                </div>
            </div>

            {denyTarget && <DenyModal request={denyTarget} onDeny={handleDeny} onClose={() => setDenyTarget(null)} />}
        </AppShell>
    )
}
